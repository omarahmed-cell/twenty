import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';

import { isNonEmptyString } from '@sniptt/guards';
import { isDefined } from 'twenty-shared/utils';
import { DataSource } from 'typeorm';

import { TwentyConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';
import { getWorkspaceSchemaName } from 'src/engine/workspace-datasource/utils/get-workspace-schema-name.util';
import { EmailContactFindOrCreateService } from 'src/modules/unified-email/services/email-contact-find-or-create.service';
import { normalizeEmailAddress } from 'src/modules/unified-email/utils/classify-email-address.util';

const SEARCH_LIMIT = 8;

export type GmailExtensionDeal = {
  id: string;
  name: string;
  stage: string | null;
  amount: number | null;
  currency: string | null;
  closeDate: string | null;
  companyId: string | null;
  url: string;
};

export type GmailExtensionCompany = {
  id: string;
  name: string;
  domain: string | null;
  url: string;
};

export type GmailExtensionContact = {
  id: string;
  name: string;
  email: string | null;
  jobTitle: string | null;
  companyId: string | null;
  companyName: string | null;
  ownerName: string | null;
  lifecycleStage: string | null;
  leadStatus: string | null;
  lastActivityDate: string | null;
  url: string;
};

export type GmailExtensionAddressLookup = {
  address: string;
  isInternal: boolean;
  contact: GmailExtensionContact | null;
  openDeals: GmailExtensionDeal[];
};

type Row = Record<string, unknown>;

const text = (value: unknown) =>
  isNonEmptyString(value)
    ? value
    : value === null || value === undefined
      ? null
      : String(value);

@Injectable()
export class GmailExtensionLookupService {
  constructor(
    @InjectDataSource()
    private readonly coreDataSource: DataSource,
    private readonly twentyConfigService: TwentyConfigService,
    private readonly emailContactFindOrCreateService: EmailContactFindOrCreateService,
  ) {}

  private recordUrl(objectNameSingular: string, id: string) {
    return `${this.twentyConfigService.get('SERVER_URL').replace(/\/+$/, '')}/object/${objectNameSingular}/${id}`;
  }

  // Custom fields such as Lead status may be missing in another workspace, so only existing columns are read
  private async getColumns(schemaName: string, tableName: string) {
    const rows: { column_name: string }[] = await this.coreDataSource.query(
      `SELECT column_name FROM information_schema.columns WHERE table_schema = $1 AND table_name = $2`,
      [schemaName, tableName],
    );

    return new Set(rows.map(({ column_name }) => column_name));
  }

  private optionalColumn(columns: Set<string>, column: string, alias: string) {
    return columns.has(column)
      ? `person."${column}"::text AS "${alias}"`
      : `NULL AS "${alias}"`;
  }

  private async findContacts(
    workspaceId: string,
    where: string,
    parameters: unknown[],
  ): Promise<GmailExtensionContact[]> {
    const schemaName = getWorkspaceSchemaName(workspaceId);
    const columns = await this.getColumns(schemaName, 'person');
    const ownerJoin = columns.has('contactOwnerId')
      ? `LEFT JOIN "${schemaName}"."workspaceMember" owner ON owner.id = person."contactOwnerId"`
      : '';
    const ownerName = columns.has('contactOwnerId')
      ? `NULLIF(btrim(concat_ws(' ', owner."nameFirstName", owner."nameLastName")), '') AS "ownerName"`
      : `NULL AS "ownerName"`;

    const rows: Row[] = await this.coreDataSource.query(
      `SELECT person.id, person."nameFirstName", person."nameLastName", person."emailsPrimaryEmail" AS email,
        person."jobTitle", person."companyId", company.name AS "companyName", ${ownerName},
        ${this.optionalColumn(columns, 'lifecycleStage', 'lifecycleStage')},
        ${this.optionalColumn(columns, 'leadStatus', 'leadStatus')},
        ${this.optionalColumn(columns, 'lastActivityDate', 'lastActivityDate')}
      FROM "${schemaName}"."person" person
      LEFT JOIN "${schemaName}"."company" company ON company.id = person."companyId"
      ${ownerJoin}
      WHERE person."deletedAt" IS NULL AND (${where})
      ORDER BY person."createdAt"
      LIMIT 50`,
      parameters,
    );

    return rows.map((row) => ({
      id: row.id as string,
      name:
        [row.nameFirstName, row.nameLastName]
          .filter(isNonEmptyString)
          .join(' ') ||
        ((row.email as string | null) ?? ''),
      email: text(row.email),
      jobTitle: text(row.jobTitle),
      companyId: text(row.companyId),
      companyName: text(row.companyName),
      ownerName: text(row.ownerName),
      lifecycleStage: text(row.lifecycleStage),
      leadStatus: text(row.leadStatus),
      lastActivityDate: text(row.lastActivityDate),
      url: this.recordUrl('person', row.id as string),
    }));
  }

  async findOpenDeals(
    workspaceId: string,
    { personIds, companyIds }: { personIds: string[]; companyIds: string[] },
  ): Promise<GmailExtensionDeal[]> {
    if (personIds.length === 0 && companyIds.length === 0) {
      return [];
    }

    const schemaName = getWorkspaceSchemaName(workspaceId);
    const junctionColumns = await this.getColumns(
      schemaName,
      'opportunityContact',
    );
    const byContact =
      junctionColumns.has('personId') && personIds.length > 0
        ? `OR opportunity.id IN (SELECT "opportunityId" FROM "${schemaName}"."opportunityContact"
             WHERE "deletedAt" IS NULL AND "personId" = ANY($1::uuid[]))`
        : '';

    const rows: Row[] = await this.coreDataSource.query(
      `SELECT opportunity.id, opportunity.name, opportunity.stage::text AS stage,
        opportunity."amountAmountMicros" AS "amountMicros", opportunity."amountCurrencyCode" AS currency,
        opportunity."closeDate", opportunity."companyId"
      FROM "${schemaName}"."opportunity" opportunity
      WHERE opportunity."deletedAt" IS NULL
        AND COALESCE(opportunity.stage::text, '') NOT ILIKE '%CLOSED%'
        AND (opportunity."companyId" = ANY($2::uuid[]) ${byContact})
      ORDER BY opportunity."createdAt" DESC
      LIMIT 25`,
      [personIds, companyIds],
    );

    return rows.map((row) => ({
      id: row.id as string,
      name: (row.name as string | null) ?? '',
      stage: text(row.stage),
      amount: isDefined(row.amountMicros)
        ? Number(row.amountMicros) / 1_000_000
        : null,
      currency: text(row.currency),
      closeDate: text(row.closeDate),
      companyId: text(row.companyId),
      url: this.recordUrl('opportunity', row.id as string),
    }));
  }

  async findCompanies(
    workspaceId: string,
    companyIds: string[],
  ): Promise<GmailExtensionCompany[]> {
    if (companyIds.length === 0) {
      return [];
    }

    const schemaName = getWorkspaceSchemaName(workspaceId);
    const rows: Row[] = await this.coreDataSource.query(
      `SELECT id, name, "domainNamePrimaryLinkUrl" AS domain FROM "${schemaName}"."company"
      WHERE "deletedAt" IS NULL AND id = ANY($1::uuid[])`,
      [companyIds],
    );

    return rows.map((row) => this.toCompany(row));
  }

  private toCompany(row: Row): GmailExtensionCompany {
    return {
      id: row.id as string,
      name: (row.name as string | null) ?? '',
      domain: text(row.domain),
      url: this.recordUrl('company', row.id as string),
    };
  }

  async lookupAddresses(
    workspaceId: string,
    addresses: string[],
  ): Promise<{
    addresses: GmailExtensionAddressLookup[];
    contacts: GmailExtensionContact[];
    companies: GmailExtensionCompany[];
    deals: GmailExtensionDeal[];
  }> {
    const normalizedAddresses = [
      ...new Set(addresses.map(normalizeEmailAddress).filter(isNonEmptyString)),
    ];
    const matches =
      await this.emailContactFindOrCreateService.findPeopleByAddresses(
        workspaceId,
        normalizedAddresses,
      );
    const contacts = await this.findContacts(
      workspaceId,
      'person.id = ANY($1::uuid[])',
      [matches.map(({ id }) => id)],
    );
    const contactById = new Map(
      contacts.map((contact) => [contact.id, contact]),
    );
    const companyIds = [
      ...new Set(contacts.map(({ companyId }) => companyId).filter(isDefined)),
    ];
    const [companies, deals] = await Promise.all([
      this.findCompanies(workspaceId, companyIds),
      this.findOpenDeals(workspaceId, {
        personIds: contacts.map(({ id }) => id),
        companyIds,
      }),
    ]);

    return {
      addresses: normalizedAddresses.map((address) => {
        const contact =
          contactById.get(
            matches.find((match) => match.email === address)?.id ?? '',
          ) ?? null;

        return {
          address,
          isInternal:
            this.emailContactFindOrCreateService.isInternalAddress(address),
          contact,
          openDeals: isDefined(contact)
            ? deals.filter(
                (deal) =>
                  isDefined(contact.companyId) &&
                  deal.companyId === contact.companyId,
              )
            : [],
        };
      }),
      contacts,
      companies,
      deals,
    };
  }

  async search(workspaceId: string, query: string) {
    const pattern = `%${query.trim().replace(/[%_]/g, '')}%`;
    const schemaName = getWorkspaceSchemaName(workspaceId);

    if (pattern.length < 4) {
      return { contacts: [], companies: [], deals: [] };
    }

    const [contacts, companyRows, dealRows] = await Promise.all([
      this.findContacts(
        workspaceId,
        `concat_ws(' ', person."nameFirstName", person."nameLastName") ILIKE $1 OR person."emailsPrimaryEmail" ILIKE $1`,
        [pattern],
      ),
      this.coreDataSource.query(
        `SELECT id, name, "domainNamePrimaryLinkUrl" AS domain FROM "${schemaName}"."company"
        WHERE "deletedAt" IS NULL AND (name ILIKE $1 OR "domainNamePrimaryLinkUrl" ILIKE $1)
        ORDER BY name LIMIT ${SEARCH_LIMIT}`,
        [pattern],
      ) as Promise<Row[]>,
      this.coreDataSource.query(
        `SELECT id FROM "${schemaName}"."opportunity"
        WHERE "deletedAt" IS NULL AND name ILIKE $1 ORDER BY "createdAt" DESC LIMIT ${SEARCH_LIMIT}`,
        [pattern],
      ) as Promise<Row[]>,
    ]);

    const deals = await this.findDealsByIds(
      workspaceId,
      dealRows.map((row) => row.id as string),
    );

    return {
      contacts: contacts.slice(0, SEARCH_LIMIT),
      companies: companyRows.map((row) => this.toCompany(row)),
      deals,
    };
  }

  private async findDealsByIds(workspaceId: string, ids: string[]) {
    if (ids.length === 0) {
      return [];
    }

    const schemaName = getWorkspaceSchemaName(workspaceId);
    const rows: Row[] = await this.coreDataSource.query(
      `SELECT id, name, stage::text AS stage, "amountAmountMicros" AS "amountMicros",
        "amountCurrencyCode" AS currency, "closeDate", "companyId"
      FROM "${schemaName}"."opportunity" WHERE id = ANY($1::uuid[])`,
      [ids],
    );

    return rows.map((row) => ({
      id: row.id as string,
      name: (row.name as string | null) ?? '',
      stage: text(row.stage),
      amount: isDefined(row.amountMicros)
        ? Number(row.amountMicros) / 1_000_000
        : null,
      currency: text(row.currency),
      closeDate: text(row.closeDate),
      companyId: text(row.companyId),
      url: this.recordUrl('opportunity', row.id as string),
    }));
  }
}
