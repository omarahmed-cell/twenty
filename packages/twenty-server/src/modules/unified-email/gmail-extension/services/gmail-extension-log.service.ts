import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';

import { isNonEmptyString } from '@sniptt/guards';
import { type ActorMetadata, FieldActorSource } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';
import { DataSource } from 'typeorm';

import { getWorkspaceSchemaName } from 'src/engine/workspace-datasource/utils/get-workspace-schema-name.util';
import { type GmailExtensionCaller } from 'src/modules/unified-email/gmail-extension/services/gmail-extension-token.service';
import { type GmailExtensionLogInput } from 'src/modules/unified-email/gmail-extension/types/gmail-extension-log-input.type';
import { EmailContactFindOrCreateService } from 'src/modules/unified-email/services/email-contact-find-or-create.service';
import { EmailRecordService } from 'src/modules/unified-email/services/email-record.service';
import { normalizeEmailAddress } from 'src/modules/unified-email/utils/classify-email-address.util';

export type GmailExtensionLogResult =
  | { status: 'SKIPPED_INTERNAL_ONLY' }
  | {
      status: 'LOGGED' | 'ALREADY_LOGGED';
      emailId: string;
      createdPersonIds: string[];
      createdCompanyIds: string[];
    };

@Injectable()
export class GmailExtensionLogService {
  constructor(
    @InjectDataSource()
    private readonly coreDataSource: DataSource,
    private readonly emailRecordService: EmailRecordService,
    private readonly emailContactFindOrCreateService: EmailContactFindOrCreateService,
  ) {}

  async getMemberActor(caller: GmailExtensionCaller): Promise<ActorMetadata> {
    const schemaName = getWorkspaceSchemaName(caller.workspaceId);
    const [member]: { name: string | null }[] = await this.coreDataSource.query(
      `SELECT NULLIF(btrim(concat_ws(' ', "nameFirstName", "nameLastName")), '') AS name
      FROM "${schemaName}"."workspaceMember" WHERE id = $1`,
      [caller.workspaceMemberId],
    );

    return {
      source: FieldActorSource.EMAIL,
      name: member?.name ?? 'Gmail extension',
      workspaceMemberId: caller.workspaceMemberId,
      context: {},
    };
  }

  async log(
    caller: GmailExtensionCaller,
    input: GmailExtensionLogInput,
  ): Promise<GmailExtensionLogResult> {
    const participants = [
      ...(isDefined(input.from) ? [input.from] : []),
      ...input.to,
      ...input.cc,
      ...input.bcc,
    ].filter(({ address }) => isNonEmptyString(address));

    const isInternalOnly =
      participants.length > 0 &&
      participants.every(({ address }) =>
        this.emailContactFindOrCreateService.isInternalAddress(address),
      );

    if (isInternalOnly) {
      return { status: 'SKIPPED_INTERNAL_ONLY' };
    }

    const createdBy = await this.getMemberActor(caller);

    const existing = await this.emailRecordService.findByMessageIds({
      workspaceId: caller.workspaceId,
      gmailMessageId: input.gmailMessageId,
      rfcMessageId: input.rfcMessageId,
    });

    const unknownExternal = await this.findUnknownExternalParticipants(
      caller.workspaceId,
      participants,
    );

    const created =
      unknownExternal.length > 0 && input.createUnknownContacts
        ? await this.emailContactFindOrCreateService.findOrCreate({
            workspaceId: caller.workspaceId,
            participants: unknownExternal,
            createdBy,
          })
        : undefined;

    const createdContacts = (created?.contacts ?? []).filter(
      ({ isPersonCreated }) => isPersonCreated,
    );

    const links = {
      personIds: [
        ...input.links.personIds,
        ...createdContacts.map(({ personId }) => personId),
      ],
      companyIds: [
        ...input.links.companyIds,
        ...createdContacts.map(({ companyId }) => companyId).filter(isDefined),
      ],
      opportunityIds: input.links.opportunityIds,
    };

    const createdPersonIds = createdContacts.map(({ personId }) => personId);
    const createdCompanyIds = createdContacts
      .filter(({ isCompanyCreated }) => isCompanyCreated)
      .map(({ companyId }) => companyId)
      .filter(isDefined);

    if (isDefined(existing)) {
      await this.emailRecordService.addLinks({
        workspaceId: caller.workspaceId,
        emailId: existing.id,
        links,
      });

      return {
        status: 'ALREADY_LOGGED',
        emailId: existing.id,
        createdPersonIds,
        createdCompanyIds,
      };
    }

    const { emailId, isDuplicate } =
      await this.emailRecordService.createEmailRecord({
        workspaceId: caller.workspaceId,
        emailId: input.emailId,
        direction: input.direction,
        source: 'GMAIL_EXTENSION',
        status: 'SENT',
        sentAt: isNonEmptyString(input.sentAt)
          ? new Date(input.sentAt)
          : new Date(),
        subject: input.subject,
        bodyHtml: input.bodyHtml,
        from: input.from,
        to: input.to,
        cc: input.cc,
        bcc: input.bcc,
        gmailMessageId: input.gmailMessageId,
        gmailThreadId: input.gmailThreadId,
        rfcMessageId: input.rfcMessageId,
        inReplyTo: input.inReplyTo,
        trackEnabled: input.trackEnabled,
        loggedByWorkspaceMemberId: caller.workspaceMemberId,
        createdBy,
        links,
      });

    return {
      status: isDuplicate ? 'ALREADY_LOGGED' : 'LOGGED',
      emailId,
      createdPersonIds,
      createdCompanyIds,
    };
  }

  // Gmail only knows the ids once the message is sent, so they are attached afterwards
  async attachMessageIds(
    caller: GmailExtensionCaller,
    emailId: string,
    ids: {
      gmailMessageId?: string | null;
      gmailThreadId?: string | null;
      rfcMessageId?: string | null;
    },
  ): Promise<boolean> {
    const schemaName = getWorkspaceSchemaName(caller.workspaceId);
    const result: [unknown[], number] = await this.coreDataSource.query(
      `UPDATE "${schemaName}"."email" SET
        "gmailMessageId" = COALESCE($3, "gmailMessageId"),
        "gmailThreadId" = COALESCE($4, "gmailThreadId"),
        "rfcMessageId" = COALESCE($5, "rfcMessageId")
      WHERE id = $1 AND "loggedById" = $2 AND "deletedAt" IS NULL`,
      [
        emailId,
        caller.workspaceMemberId,
        ids.gmailMessageId ?? null,
        ids.gmailThreadId ?? null,
        ids.rfcMessageId ?? null,
      ],
    );

    return (result?.[1] ?? 0) > 0;
  }

  private async findUnknownExternalParticipants(
    workspaceId: string,
    participants: { address: string; displayName?: string | null }[],
  ) {
    const external = participants.filter(
      ({ address }) =>
        !this.emailContactFindOrCreateService.isInternalAddress(address),
    );
    const known = new Set(
      (
        await this.emailContactFindOrCreateService.findPeopleByAddresses(
          workspaceId,
          external.map(({ address }) => normalizeEmailAddress(address)),
        )
      ).map(({ email }) => email),
    );

    return external.filter(
      ({ address }) => !known.has(normalizeEmailAddress(address)),
    );
  }
}
