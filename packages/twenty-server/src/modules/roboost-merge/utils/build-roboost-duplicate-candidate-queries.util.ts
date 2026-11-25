import {
  type RoboostDuplicateRuleKey,
  type RoboostMergeObjectName,
} from 'twenty-shared/constants';

export type RoboostDuplicateCandidateQuery = {
  ruleKey: RoboostDuplicateRuleKey;
  sql: string;
};

const LEGAL_SUFFIXES =
  'llc|ltd|limited|inc|co|company|corp|corporation|group|holding|holdings|sa|sae|sal|fz|fze|fzco|fzllc|llp|plc|gmbh|wll|the';

const normalizeDomainSql = (expression: string) =>
  `split_part(regexp_replace(regexp_replace(lower(trim(coalesce(${expression}, ''))), '^[a-z]+://', ''), '^www\\.', ''), '/', 1)`;

const normalizeNameSql = (expression: string) =>
  `regexp_replace(regexp_replace(lower(coalesce(${expression}, '')), '\\m(${LEGAL_SUFFIXES})\\M', '', 'g'), '[[:space:][:punct:]]+', '', 'g')`;

const jsonArraySql = (column: string) =>
  `jsonb_array_elements(CASE WHEN jsonb_typeof(t."${column}") = 'array' THEN t."${column}" ELSE '[]'::jsonb END)`;

const phoneDigitsSql = (column: string) =>
  `right(regexp_replace(coalesce(t."${column}", ''), '\\D', '', 'g'), 9)`;

// Each query returns rows (a, b) with a < b; only live records are compared
export const buildRoboostDuplicateCandidateQueries = ({
  objectName,
  table,
  columns,
  enabledRuleKeys,
}: {
  objectName: RoboostMergeObjectName;
  table: string;
  columns: Set<string>;
  enabledRuleKeys: Set<RoboostDuplicateRuleKey>;
}): RoboostDuplicateCandidateQuery[] => {
  const queries: RoboostDuplicateCandidateQuery[] = [];
  const has = (column: string) => columns.has(column);

  if (objectName === 'company') {
    if (
      enabledRuleKeys.has('companySameDomain') &&
      has('domainNamePrimaryLinkUrl')
    ) {
      const extraDomains = has('domainNameSecondaryLinks')
        ? `UNION SELECT t.id, ${normalizeDomainSql(`link->>'url'`)} FROM ${table} t, ${jsonArraySql('domainNameSecondaryLinks')} link WHERE t."deletedAt" IS NULL`
        : '';

      queries.push({
        ruleKey: 'companySameDomain',
        sql: `WITH d(id, value) AS (
          SELECT t.id, ${normalizeDomainSql('t."domainNamePrimaryLinkUrl"')} FROM ${table} t WHERE t."deletedAt" IS NULL
          ${extraDomains}
        )
        SELECT DISTINCT a.id AS a, b.id AS b FROM d a JOIN d b ON a.value = b.value AND a.id < b.id
        WHERE a.value <> ''`,
      });
    }

    if (enabledRuleKeys.has('companySimilarNameSameCountry') && has('name')) {
      const country = has('addressAddressCountry')
        ? `lower(trim(coalesce(t."addressAddressCountry", '')))`
        : `''`;

      queries.push({
        ruleKey: 'companySimilarNameSameCountry',
        sql: `WITH n AS (
          SELECT t.id, ${normalizeNameSql('t.name')} AS value, ${country} AS country FROM ${table} t WHERE t."deletedAt" IS NULL
        )
        SELECT a.id AS a, b.id AS b FROM n a JOIN n b
          ON left(a.value, 5) = left(b.value, 5) AND a.country = b.country AND a.id < b.id
        WHERE length(a.value) >= 3 AND length(b.value) >= 3
          AND (a.value = b.value OR (least(length(a.value), length(b.value)) >= 8 AND least(length(a.value), length(b.value)) >= 0.6 * greatest(length(a.value), length(b.value)) AND (a.value LIKE b.value || '%' OR b.value LIKE a.value || '%')))`,
      });
    }
  }

  if (objectName === 'person') {
    if (enabledRuleKeys.has('personSameEmail') && has('emailsPrimaryEmail')) {
      const extraEmails = has('emailsAdditionalEmails')
        ? `UNION SELECT t.id, lower(trim(email #>> '{}')) FROM ${table} t, ${jsonArraySql('emailsAdditionalEmails')} email WHERE t."deletedAt" IS NULL`
        : '';

      queries.push({
        ruleKey: 'personSameEmail',
        sql: `WITH e(id, value) AS (
          SELECT t.id, lower(trim(coalesce(t."emailsPrimaryEmail", ''))) FROM ${table} t WHERE t."deletedAt" IS NULL
          ${extraEmails}
        )
        SELECT DISTINCT a.id AS a, b.id AS b FROM e a JOIN e b ON a.value = b.value AND a.id < b.id
        WHERE a.value LIKE '%@%'`,
      });
    }

    const phoneColumns = [
      'phonesPrimaryPhoneNumber',
      'mobilePhoneNumberPrimaryPhoneNumber',
    ].filter(has);

    if (enabledRuleKeys.has('personSamePhone') && phoneColumns.length > 0) {
      queries.push({
        ruleKey: 'personSamePhone',
        sql: `WITH p(id, value) AS (
          ${phoneColumns
            .map(
              (column) =>
                `SELECT t.id, ${phoneDigitsSql(column)} FROM ${table} t WHERE t."deletedAt" IS NULL`,
            )
            .join(' UNION ')}
        )
        SELECT DISTINCT a.id AS a, b.id AS b FROM p a JOIN p b ON a.value = b.value AND a.id < b.id
        WHERE length(a.value) >= 7`,
      });
    }

    if (
      enabledRuleKeys.has('personSameNameSameCompany') &&
      has('nameFirstName') &&
      has('companyId')
    ) {
      queries.push({
        ruleKey: 'personSameNameSameCompany',
        sql: `WITH n AS (
          SELECT t.id, t."companyId" AS company, lower(trim(concat_ws(' ', t."nameFirstName", t."nameLastName"))) AS value
          FROM ${table} t WHERE t."deletedAt" IS NULL AND t."companyId" IS NOT NULL
        )
        SELECT a.id AS a, b.id AS b FROM n a JOIN n b ON a.value = b.value AND a.company = b.company AND a.id < b.id
        WHERE a.value <> ''`,
      });
    }
  }

  if (
    objectName === 'opportunity' &&
    enabledRuleKeys.has('opportunitySameNameCompanyAmount') &&
    has('name') &&
    has('companyId')
  ) {
    const amount = has('amountAmountMicros')
      ? `AND ((a.amount IS NULL AND b.amount IS NULL) OR abs(a.amount - b.amount) <= 0.1 * greatest(abs(a.amount), abs(b.amount)))`
      : '';
    const owner =
      enabledRuleKeys.has('opportunityRequireSameOwner') && has('ownerId')
        ? `AND a.owner IS NOT DISTINCT FROM b.owner`
        : '';

    queries.push({
      ruleKey: 'opportunitySameNameCompanyAmount',
      sql: `WITH n AS (
        SELECT t.id, t."companyId" AS company, lower(trim(coalesce(t.name, ''))) AS value,
          ${has('amountAmountMicros') ? 't."amountAmountMicros"::numeric' : 'NULL::numeric'} AS amount,
          ${has('ownerId') ? 't."ownerId"' : 'NULL::uuid'} AS owner
        FROM ${table} t WHERE t."deletedAt" IS NULL AND t."companyId" IS NOT NULL
      )
      SELECT a.id AS a, b.id AS b FROM n a JOIN n b ON a.value = b.value AND a.company = b.company AND a.id < b.id
      WHERE a.value <> '' ${amount} ${owner}`,
    });
  }

  if (
    objectName === 'service' &&
    enabledRuleKeys.has('serviceSameNameSameCompany') &&
    has('name') &&
    has('companyId')
  ) {
    queries.push({
      ruleKey: 'serviceSameNameSameCompany',
      sql: `WITH n AS (
        SELECT t.id, t."companyId" AS company, lower(trim(coalesce(t.name, ''))) AS value
        FROM ${table} t WHERE t."deletedAt" IS NULL AND t."companyId" IS NOT NULL
      )
      SELECT a.id AS a, b.id AS b FROM n a JOIN n b ON a.value = b.value AND a.company = b.company AND a.id < b.id
      WHERE a.value <> ''`,
    });
  }

  return queries;
};
