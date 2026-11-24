import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';

import { isNonEmptyString } from '@sniptt/guards';
import { isDefined } from 'twenty-shared/utils';
import { DataSource } from 'typeorm';

import { getWorkspaceSchemaName } from 'src/engine/workspace-datasource/utils/get-workspace-schema-name.util';
import { ROBOOST_ASSIGN_OWNER_FIELDS } from 'src/modules/roboost-notification/constants/roboost-assign-owner-fields.constant';
import { RoboostNotificationService } from 'src/modules/roboost-notification/services/roboost-notification.service';
import { type RoboostNotificationRelatedRecord } from 'src/modules/roboost-notification/types/roboost-notification.type';
import { buildRoboostAssignListPath } from 'src/modules/roboost-notification/utils/build-roboost-assign-list-path.util';

// Changes by the same actor to the same field and owner within this window become one notification
export const ROBOOST_ASSIGN_GROUP_WINDOW_SECONDS = 60;
// Chips need only a few names, but the list link needs the ids, so a batch keeps up to this many
const MAX_STORED_RECORDS = 500;

export type RoboostAssignment = {
  recordId: string;
  recordName: string;
  fieldName: string;
  ownerWorkspaceMemberId: string;
};

export type RoboostAssignActor = {
  workspaceMemberId: string | null;
  name: string;
};

const OBJECT_NOUNS: Record<string, { singular: string; plural: string }> = {
  company: { singular: 'company', plural: 'companies' },
  person: { singular: 'contact', plural: 'contacts' },
  opportunity: { singular: 'deal', plural: 'deals' },
  service: { singular: 'service', plural: 'services' },
};

const ACTION_LABELS: Record<string, string> = {
  company: 'View Company',
  person: 'View Contact',
  opportunity: 'View Deal',
  service: 'View Service',
};

@Injectable()
export class RoboostAssignNotificationService {
  private readonly fieldLabelCache = new Map<
    string,
    { labels: Map<string, string>; expiresAt: number }
  >();

  constructor(
    @InjectDataSource()
    private readonly coreDataSource: DataSource,
    private readonly roboostNotificationService: RoboostNotificationService,
  ) {}

  private async getFieldLabels(
    workspaceId: string,
    objectMetadataId: string,
  ): Promise<Map<string, string>> {
    const cacheKey = `${workspaceId}:${objectMetadataId}`;
    const cached = this.fieldLabelCache.get(cacheKey);

    if (isDefined(cached) && cached.expiresAt > Date.now()) {
      return cached.labels;
    }

    const rows: { name: string; label: string }[] =
      await this.coreDataSource.query(
        `SELECT f.name, coalesce(f.overrides->>'label', f.label) AS label
        FROM core."fieldMetadata" f
        WHERE f."workspaceId" = $1 AND f."objectMetadataId" = $2`,
        [workspaceId, objectMetadataId],
      );
    const labels = new Map(rows.map(({ name, label }) => [name, label]));

    this.fieldLabelCache.set(cacheKey, {
      labels,
      expiresAt: Date.now() + 5 * 60_000,
    });

    return labels;
  }

  private async getMemberName(workspaceId: string, workspaceMemberId: string) {
    const [member]: { firstName: string | null; lastName: string | null }[] =
      await this.coreDataSource.query(
        `SELECT "nameFirstName" AS "firstName", "nameLastName" AS "lastName"
        FROM "${getWorkspaceSchemaName(workspaceId)}"."workspaceMember" WHERE id = $1`,
        [workspaceMemberId],
      );

    return [member?.firstName, member?.lastName]
      .filter(isNonEmptyString)
      .join(' ');
  }

  async notifyAssignments({
    workspaceId,
    objectMetadataId,
    objectNameSingular,
    objectNamePlural,
    actor,
    assignments,
  }: {
    workspaceId: string;
    objectMetadataId: string;
    objectNameSingular: string;
    objectNamePlural: string;
    actor: RoboostAssignActor;
    assignments: RoboostAssignment[];
  }) {
    const ownerFields = ROBOOST_ASSIGN_OWNER_FIELDS[objectNameSingular] ?? [];
    const nouns = OBJECT_NOUNS[objectNameSingular] ?? {
      singular: 'record',
      plural: 'records',
    };
    const fieldLabels = await this.getFieldLabels(
      workspaceId,
      objectMetadataId,
    );
    const groups = new Map<string, RoboostAssignment[]>();

    for (const assignment of assignments) {
      const key = `${assignment.fieldName}|${assignment.ownerWorkspaceMemberId}`;

      groups.set(key, [...(groups.get(key) ?? []), assignment]);
    }

    for (const groupAssignments of groups.values()) {
      const { fieldName, ownerWorkspaceMemberId } = groupAssignments[0];
      const ownerField = ownerFields.find(
        (field) => field.fieldName === fieldName,
      );

      if (!isDefined(ownerField)) {
        continue;
      }

      const fieldLabel = fieldLabels.get(fieldName) ?? fieldName;
      const groupKey = [
        'assign',
        objectNameSingular,
        fieldName,
        actor.workspaceMemberId ?? actor.name,
      ].join(':');
      const previous = await this.roboostNotificationService.findRecentGroup({
        workspaceId,
        recipientWorkspaceMemberId: ownerWorkspaceMemberId,
        groupKey,
        windowSeconds: ROBOOST_ASSIGN_GROUP_WINDOW_SECONDS,
      });
      const newRecords: RoboostNotificationRelatedRecord[] =
        groupAssignments.map(({ recordId, recordName }) => ({
          id: recordId,
          name: recordName,
          objectNameSingular,
        }));
      const previousRecords = previous?.relatedRecords ?? [];
      const addedRecords = newRecords.filter(
        (record) => !previousRecords.some(({ id }) => id === record.id),
      );
      const records = [...previousRecords, ...addedRecords].slice(
        0,
        MAX_STORED_RECORDS,
      );
      const count =
        Math.max(previous?.relatedCount ?? 0, previousRecords.length) +
        addedRecords.length;

      if (count === 0) {
        continue;
      }

      if (count === 1) {
        const [record] = records;

        await this.roboostNotificationService.notify({
          workspaceId,
          recipientWorkspaceMemberId: ownerWorkspaceMemberId,
          type: 'assign',
          subtype: 'assigned_single',
          title: `You've been assigned a ${nouns.singular}`,
          body: `${actor.name} has made you the ${fieldLabel} of ${record.name}`,
          actorWorkspaceMemberId: actor.workspaceMemberId,
          actorName: actor.name,
          target: {
            objectNameSingular,
            recordId: record.id,
            actionLabel: ACTION_LABELS[objectNameSingular] ?? 'View record',
          },
          relatedRecords: records,
          relatedCount: 1,
          groupKey,
          groupWindowSeconds: ROBOOST_ASSIGN_GROUP_WINDOW_SECONDS,
        });
        continue;
      }

      const recipientName = await this.getMemberName(
        workspaceId,
        ownerWorkspaceMemberId,
      );

      await this.roboostNotificationService.notify({
        workspaceId,
        recipientWorkspaceMemberId: ownerWorkspaceMemberId,
        type: 'assign',
        subtype: 'assigned_bulk',
        title: `You've been assigned ${count} ${nouns.plural}`,
        body: `${actor.name} has made you the ${fieldLabel} of ${count} ${nouns.plural}`,
        actorWorkspaceMemberId: actor.workspaceMemberId,
        actorName: actor.name,
        target: {
          path: buildRoboostAssignListPath({
            objectNamePlural,
            ownerFieldName: fieldName,
            assignedDateFieldName: ownerField.assignedDateFieldName,
            recipientWorkspaceMemberId: ownerWorkspaceMemberId,
            recipientName: recipientName || 'Me',
            recordIds:
              count <= records.length ? records.map(({ id }) => id) : [],
          }),
          actionLabel: 'View records',
        },
        relatedRecords: records,
        relatedCount: count,
        groupKey,
        groupWindowSeconds: ROBOOST_ASSIGN_GROUP_WINDOW_SECONDS,
      });
    }
  }
}
