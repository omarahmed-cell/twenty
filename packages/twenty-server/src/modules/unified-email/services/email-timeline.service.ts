import { Injectable, Logger } from '@nestjs/common';

import { STANDARD_OBJECTS } from 'twenty-shared/metadata';
import { FieldActorSource } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

import { WorkspaceOrmManager } from 'src/engine/twenty-orm/workspace-orm.manager';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';
import { WorkspaceCacheService } from 'src/engine/workspace-cache/services/workspace-cache.service';
import { toResolvedTimelineActivityType } from 'src/modules/timeline/utils/resolve-timeline-activity-type.util';

const EMAIL_TARGET_COLUMNS = [
  'targetPersonId',
  'targetCompanyId',
  'targetOpportunityId',
  'targetServiceId',
] as const;

type EmailTargetRow = Partial<
  Record<(typeof EMAIL_TARGET_COLUMNS)[number], string | null>
>;

@Injectable()
export class EmailTimelineService {
  private readonly logger = new Logger(EmailTimelineService.name);

  constructor(
    private readonly workspaceOrmManager: WorkspaceOrmManager,
    private readonly workspaceCacheService: WorkspaceCacheService,
  ) {}

  // Writes one row per record the email is linked to, like the "logged an email" rows
  async addRowsForEmail({
    workspaceId,
    emailId,
    timelineActivityTypeUniversalIdentifier,
    happensAt,
    properties = {},
    actorName,
  }: {
    workspaceId: string;
    emailId: string;
    timelineActivityTypeUniversalIdentifier: string;
    happensAt: Date;
    properties?: Record<string, unknown>;
    actorName: string;
  }): Promise<number> {
    const { flatTimelineActivityTypeMaps, flatObjectMetadataMaps } =
      await this.workspaceCacheService.getOrRecompute(workspaceId, [
        'flatTimelineActivityTypeMaps',
        'flatObjectMetadataMaps',
      ]);

    const timelineActivityType =
      flatTimelineActivityTypeMaps.byUniversalIdentifier[
        timelineActivityTypeUniversalIdentifier
      ];
    const emailObjectMetadata =
      flatObjectMetadataMaps.byUniversalIdentifier[
        STANDARD_OBJECTS.email.universalIdentifier
      ];

    if (!isDefined(timelineActivityType) || !isDefined(emailObjectMetadata)) {
      this.logger.warn(
        `Workspace ${workspaceId}: timeline type ${timelineActivityTypeUniversalIdentifier} or the email object is missing`,
      );

      return 0;
    }

    const resolvedType = toResolvedTimelineActivityType(timelineActivityType);

    return this.workspaceOrmManager.executeInWorkspaceContext(async () => {
      const emailRepository = this.workspaceOrmManager.getRepository('email', {
        shouldBypassPermissionChecks: true,
      });
      const emailTargetRepository = this.workspaceOrmManager.getRepository(
        'emailTarget',
        { shouldBypassPermissionChecks: true },
      );
      const timelineActivityRepository = this.workspaceOrmManager.getRepository(
        'timelineActivity',
        { shouldBypassPermissionChecks: true },
        { shouldSkipEventEmission: true },
      );

      const email = await emailRepository.findOne({
        where: { id: emailId },
        select: ['id', 'subject'],
      });
      const emailTargets = (await emailTargetRepository.find({
        where: { emailId },
      })) as EmailTargetRow[];

      const rows = emailTargets.flatMap((emailTarget) =>
        EMAIL_TARGET_COLUMNS.filter((column) =>
          isDefined(emailTarget[column]),
        ).map((column) => ({
          [column]: emailTarget[column],
          happensAt: happensAt.toISOString(),
          timelineActivityTypeId: resolvedType.id,
          timelineActivityTypeSnapshot: resolvedType.snapshot,
          properties: { ...properties, actorName },
          linkedRecordId: emailId,
          linkedObjectMetadataId: emailObjectMetadata.id,
          linkedRecordCachedName: (email?.subject as string | null) ?? '',
          workspaceMemberId: null,
          createdBy: {
            source: FieldActorSource.SYSTEM,
            name: actorName,
            workspaceMemberId: null,
            context: {},
          },
        })),
      );

      if (rows.length > 0) {
        await timelineActivityRepository.insert(rows);
      }

      return rows.length;
    }, buildSystemAuthContext(workspaceId));
  }
}
