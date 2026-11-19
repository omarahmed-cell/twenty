import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';

import { type ActorMetadata } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';
import { DataSource } from 'typeorm';

import { CacheLockService } from 'src/engine/core-modules/cache-lock/cache-lock.service';
import { TwentyConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';
import { WorkspaceOrmManager } from 'src/engine/twenty-orm/workspace-orm.manager';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';
import { getWorkspaceSchemaName } from 'src/engine/workspace-datasource/utils/get-workspace-schema-name.util';
import { getCompanyNameFromDomainName } from 'src/modules/contact-creation-manager/utils/get-company-name-from-domain-name.util';
import { getFirstNameAndLastNameFromHandleAndDisplayName } from 'src/modules/contact-creation-manager/utils/get-first-name-and-last-name-from-handle-and-display-name.util';
import {
  classifyEmailAddress,
  getRegistrableDomain,
  isLinkUrlOnDomain,
  normalizeEmailAddress,
} from 'src/modules/unified-email/utils/classify-email-address.util';
import { getDomainFromEmail } from 'src/utils/get-domain-from-email';

export type EmailParticipantInput = {
  address: string;
  displayName?: string | null;
};

export type EmailContactMatch = {
  address: string;
  personId: string;
  companyId: string | null;
  isPersonCreated: boolean;
  isCompanyCreated: boolean;
};

export type FindOrCreateEmailContactsResult = {
  contacts: EmailContactMatch[];
  skippedInternalAddresses: string[];
  skippedInvalidAddresses: string[];
  personIds: string[];
  companyIds: string[];
};

type PersonRow = {
  id: string;
  companyId: string | null;
  email: string;
  name: string | null;
};

@Injectable()
export class EmailContactFindOrCreateService {
  constructor(
    @InjectDataSource()
    private readonly coreDataSource: DataSource,
    private readonly workspaceOrmManager: WorkspaceOrmManager,
    private readonly cacheLockService: CacheLockService,
    private readonly twentyConfigService: TwentyConfigService,
  ) {}

  isInternalAddress(address: string) {
    return (
      classifyEmailAddress({
        address,
        internalDomains: this.getInternalDomains(),
        personalDomains: [],
      }) === 'INTERNAL'
    );
  }

  async getWorkspaceMemberName(
    workspaceId: string,
    workspaceMemberId: string,
  ): Promise<string | null> {
    const [member]: { name: string | null }[] = await this.coreDataSource.query(
      `SELECT NULLIF(btrim(concat_ws(' ', "nameFirstName", "nameLastName")), '') AS name
      FROM "${getWorkspaceSchemaName(workspaceId)}"."workspaceMember" WHERE id = $1`,
      [workspaceMemberId],
    );

    return member?.name ?? null;
  }

  // The contact's name when the address is known, else the name in the header, else the address
  async getDisplayName(
    workspaceId: string,
    participant: EmailParticipantInput,
  ): Promise<string> {
    const [person] = await this.findPeopleByAddresses(workspaceId, [
      normalizeEmailAddress(participant.address),
    ]);

    return (
      person?.name ?? (participant.displayName?.trim() || participant.address)
    );
  }

  getInternalDomains() {
    return this.twentyConfigService.get('UNIFIED_EMAIL_INTERNAL_DOMAINS');
  }

  // Serialised per workspace so two calls for the same new address never both create it
  async findOrCreate({
    workspaceId,
    participants,
    createdBy,
  }: {
    workspaceId: string;
    participants: EmailParticipantInput[];
    createdBy: ActorMetadata;
  }): Promise<FindOrCreateEmailContactsResult> {
    return this.cacheLockService.withLock(
      () => this.findOrCreateUnlocked({ workspaceId, participants, createdBy }),
      `unified-email:find-or-create:${workspaceId}`,
      { ttl: 15_000, maxRetries: 300, ms: 100 },
    );
  }

  private async findOrCreateUnlocked({
    workspaceId,
    participants,
    createdBy,
  }: {
    workspaceId: string;
    participants: EmailParticipantInput[];
    createdBy: ActorMetadata;
  }): Promise<FindOrCreateEmailContactsResult> {
    const internalDomains = this.getInternalDomains();
    const personalDomains = this.twentyConfigService.get(
      'UNIFIED_EMAIL_PERSONAL_DOMAINS',
    );

    const displayNameByAddress = new Map<string, string>();
    const skippedInternalAddresses = new Set<string>();
    const skippedInvalidAddresses = new Set<string>();
    const kindByAddress = new Map<string, 'PERSONAL' | 'BUSINESS'>();

    for (const participant of participants) {
      const address = normalizeEmailAddress(participant.address);
      const kind = classifyEmailAddress({
        address,
        internalDomains,
        personalDomains,
      });

      if (kind === 'INTERNAL') {
        skippedInternalAddresses.add(address);
        continue;
      }

      if (kind === 'INVALID') {
        skippedInvalidAddresses.add(address);
        continue;
      }

      kindByAddress.set(address, kind);

      if (
        participant.displayName?.trim() &&
        !displayNameByAddress.has(address)
      ) {
        displayNameByAddress.set(address, participant.displayName.trim());
      }
    }

    const addresses = [...kindByAddress.keys()];
    const existingPeople = await this.findPeopleByAddresses(
      workspaceId,
      addresses,
    );
    const contacts: EmailContactMatch[] = [];
    const companyIdByDomain = new Map<
      string,
      { id: string; created: boolean }
    >();

    const resolveCompany = async (address: string) => {
      if (kindByAddress.get(address) !== 'BUSINESS') {
        return null;
      }

      const domain = getRegistrableDomain(getDomainFromEmail(address) ?? '');

      if (!isDefined(domain)) {
        return null;
      }

      if (!companyIdByDomain.has(domain)) {
        companyIdByDomain.set(
          domain,
          await this.findOrCreateCompany({ workspaceId, domain, createdBy }),
        );
      }

      return companyIdByDomain.get(domain) ?? null;
    };

    for (const address of addresses) {
      const existingPerson = existingPeople.find(
        (person) => person.email === address,
      );

      if (isDefined(existingPerson)) {
        let companyId = existingPerson.companyId;
        let isCompanyCreated = false;

        if (!isDefined(companyId)) {
          const company = await resolveCompany(address);

          if (isDefined(company)) {
            companyId = company.id;
            isCompanyCreated = company.created;
            await this.linkPersonToCompany({
              workspaceId,
              personId: existingPerson.id,
              companyId,
            });
          }
        }

        contacts.push({
          address,
          personId: existingPerson.id,
          companyId,
          isPersonCreated: false,
          isCompanyCreated,
        });
        continue;
      }

      const company = await resolveCompany(address);
      const personId = await this.createPerson({
        workspaceId,
        address,
        displayName: displayNameByAddress.get(address) ?? '',
        companyId: company?.id ?? null,
        createdBy,
      });

      contacts.push({
        address,
        personId,
        companyId: company?.id ?? null,
        isPersonCreated: true,
        isCompanyCreated: company?.created ?? false,
      });
    }

    return {
      contacts,
      skippedInternalAddresses: [...skippedInternalAddresses],
      skippedInvalidAddresses: [...skippedInvalidAddresses],
      personIds: [...new Set(contacts.map(({ personId }) => personId))],
      companyIds: [
        ...new Set(
          contacts.map(({ companyId }) => companyId).filter(isDefined),
        ),
      ],
    };
  }

  async findPeopleByAddresses(
    workspaceId: string,
    addresses: string[],
  ): Promise<PersonRow[]> {
    if (addresses.length === 0) {
      return [];
    }

    const schemaName = getWorkspaceSchemaName(workspaceId);

    return this.coreDataSource.query(
      `SELECT DISTINCT ON (matched.email) matched.id, matched."companyId", matched.email, matched.name
      FROM (
        SELECT person.id, person."companyId", person."createdAt", lower(person."emailsPrimaryEmail") AS email,
          NULLIF(btrim(concat_ws(' ', person."nameFirstName", person."nameLastName")), '') AS name
        FROM "${schemaName}"."person" person
        WHERE person."deletedAt" IS NULL AND lower(person."emailsPrimaryEmail") = ANY($1::text[])
        UNION ALL
        SELECT person.id, person."companyId", person."createdAt", lower(additional.email) AS email,
          NULLIF(btrim(concat_ws(' ', person."nameFirstName", person."nameLastName")), '') AS name
        FROM "${schemaName}"."person" person,
          jsonb_array_elements_text(
            CASE WHEN jsonb_typeof(person."emailsAdditionalEmails") = 'array'
              THEN person."emailsAdditionalEmails" ELSE '[]'::jsonb END
          ) AS additional(email)
        WHERE person."deletedAt" IS NULL AND lower(additional.email) = ANY($1::text[])
      ) matched
      ORDER BY matched.email, matched."createdAt"`,
      [addresses],
    );
  }

  private async findOrCreateCompany({
    workspaceId,
    domain,
    createdBy,
  }: {
    workspaceId: string;
    domain: string;
    createdBy: ActorMetadata;
  }): Promise<{ id: string; created: boolean }> {
    const schemaName = getWorkspaceSchemaName(workspaceId);
    const candidates: {
      id: string;
      primaryLinkUrl: string | null;
      secondaryLinks: { url?: string }[] | null;
    }[] = await this.coreDataSource.query(
      `SELECT id, "domainNamePrimaryLinkUrl" AS "primaryLinkUrl", "domainNameSecondaryLinks" AS "secondaryLinks"
      FROM "${schemaName}"."company"
      WHERE "deletedAt" IS NULL
        AND ("domainNamePrimaryLinkUrl" ILIKE $1 OR "domainNameSecondaryLinks"::text ILIKE $1)
      ORDER BY "createdAt"`,
      [`%${domain}%`],
    );

    const match = candidates.find(
      (candidate) =>
        (isDefined(candidate.primaryLinkUrl) &&
          isLinkUrlOnDomain(candidate.primaryLinkUrl, domain)) ||
        (Array.isArray(candidate.secondaryLinks) &&
          candidate.secondaryLinks.some(
            (link) =>
              isDefined(link?.url) && isLinkUrlOnDomain(link.url, domain),
          )),
    );

    if (isDefined(match)) {
      return { id: match.id, created: false };
    }

    const id = await this.workspaceOrmManager.executeInWorkspaceContext(
      async () => {
        const companyRepository = this.workspaceOrmManager.getRepository(
          'company',
          { shouldBypassPermissionChecks: true },
        );

        const inserted = await companyRepository.insert({
          name: getCompanyNameFromDomainName(domain) || domain,
          domainName: {
            primaryLinkUrl: `https://${domain}`,
            primaryLinkLabel: '',
            secondaryLinks: [],
          },
          createdBy,
        });

        return inserted.identifiers[0].id as string;
      },
      buildSystemAuthContext(workspaceId),
    );

    return { id, created: true };
  }

  private async createPerson({
    workspaceId,
    address,
    displayName,
    companyId,
    createdBy,
  }: {
    workspaceId: string;
    address: string;
    displayName: string;
    companyId: string | null;
    createdBy: ActorMetadata;
  }): Promise<string> {
    return this.workspaceOrmManager.executeInWorkspaceContext(async () => {
      const personRepository = this.workspaceOrmManager.getRepository(
        'person',
        { shouldBypassPermissionChecks: true },
      );

      const inserted = await personRepository.insert({
        name: getFirstNameAndLastNameFromHandleAndDisplayName(
          address,
          displayName,
        ),
        emails: { primaryEmail: address, additionalEmails: null },
        companyId,
        createdBy,
      });

      return inserted.identifiers[0].id as string;
    }, buildSystemAuthContext(workspaceId));
  }

  private async linkPersonToCompany({
    workspaceId,
    personId,
    companyId,
  }: {
    workspaceId: string;
    personId: string;
    companyId: string;
  }) {
    await this.workspaceOrmManager.executeInWorkspaceContext(async () => {
      const personRepository = this.workspaceOrmManager.getRepository(
        'person',
        { shouldBypassPermissionChecks: true },
      );

      await personRepository.update({ id: personId }, { companyId });
    }, buildSystemAuthContext(workspaceId));
  }
}
