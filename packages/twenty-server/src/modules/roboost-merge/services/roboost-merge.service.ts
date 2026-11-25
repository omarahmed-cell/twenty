import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';

import {
  ROBOOST_MERGE_COMPANY_FIELD_NAME,
  ROBOOST_MERGE_MAX_MERGES_PER_RECORD,
  ROBOOST_MERGE_OBJECT_NAMES,
  type RoboostMergeFieldPlan,
  type RoboostMergeObjectName,
} from 'twenty-shared/constants';
import {
  FieldActorSource,
  FieldMetadataType,
  RelationType,
} from 'twenty-shared/types';
import { isDefined, normalizeDomain } from 'twenty-shared/utils';
import { DataSource, type EntityManager } from 'typeorm';

import { RoboostRecordVisibilityService } from 'src/engine/metadata-modules/role/services/roboost-record-visibility.service';
import { type OrmFlatFieldMetadata } from 'src/engine/metadata-modules/flat-field-metadata/types/orm-flat-field-metadata.type';
import { type FlatObjectMetadata } from 'src/engine/metadata-modules/flat-object-metadata/types/flat-object-metadata.type';
import { findFlatEntityByIdInFlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/utils/find-flat-entity-by-id-in-flat-entity-maps.util';
import { getFieldMetadataIdToColumnNamesMap } from 'src/engine/twenty-orm/utils/get-field-metadata-id-to-column-names-map.util';
import { computeTableName } from 'src/engine/utils/compute-table-name.util';
import { WorkspaceCacheService } from 'src/engine/workspace-cache/services/workspace-cache.service';
import { getWorkspaceSchemaName } from 'src/engine/workspace-datasource/utils/get-workspace-schema-name.util';
import { toResolvedTimelineActivityType } from 'src/modules/timeline/utils/resolve-timeline-activity-type.util';
import { RoboostMergeAfterEffectsService } from 'src/modules/roboost-merge/services/roboost-merge-after-effects.service';
import {
  type RoboostMergeActor,
  type RoboostMergeFieldChange,
  type RoboostMergeMovedLink,
} from 'src/modules/roboost-merge/types/roboost-merge.type';

type RawRow = Record<string, unknown>;

type MergeField = {
  field: OrmFlatFieldMetadata;
  columns: string[];
};

export type RoboostMergeObjectContext = {
  workspaceId: string;
  schemaName: string;
  objectName: RoboostMergeObjectName;
  flatObject: FlatObjectMetadata;
  tableName: string;
  fields: MergeField[];
  allFlatFields: OrmFlatFieldMetadata[];
  flatObjectsById: Map<string, FlatObjectMetadata>;
};

const RECORD_UPDATED_TIMELINE_TYPE_UNIVERSAL_IDENTIFIER =
  '20202020-0d1a-4f0e-8a55-1c0a2f0a2c02';

const TIMELINE_TARGET_COLUMN_BY_OBJECT: Record<RoboostMergeObjectName, string> =
  {
    company: 'targetCompanyId',
    person: 'targetPersonId',
    opportunity: 'targetOpportunityId',
    service: 'targetServiceId',
  };

const SKIPPED_FIELD_TYPES = new Set<string>([
  FieldMetadataType.TS_VECTOR,
  FieldMetadataType.POSITION,
]);

const KEPT_FIELD_NAMES = new Set(['id', 'createdBy', 'updatedBy', 'updatedAt']);

const FIXED_FIELD_NAMES = new Set([
  'createdAt',
  'emails',
  'domainName',
  'mergedRecordIds',
]);

const quote = (identifier: string) => `"${identifier.replace(/"/g, '""')}"`;

const isEmptyColumnValue = (value: unknown) =>
  value === null ||
  value === undefined ||
  value === '' ||
  (Array.isArray(value) && value.length === 0) ||
  (typeof value === 'object' &&
    !Array.isArray(value) &&
    !(value instanceof Date) &&
    Object.keys(value as object).length === 0);

const sameValue = (first: unknown, second: unknown) =>
  JSON.stringify(first ?? null) === JSON.stringify(second ?? null);

const toArray = (value: unknown): unknown[] =>
  Array.isArray(value) ? value : [];

const relationSettings = (field: OrmFlatFieldMetadata) =>
  field.settings as {
    relationType?: RelationType;
    joinColumnName?: string;
  } | null;

const subFieldName = (field: OrmFlatFieldMetadata, column: string) =>
  column.length > field.name.length
    ? column.charAt(field.name.length).toLowerCase() +
      column.slice(field.name.length + 1)
    : field.name;

// The value of a field in API shape (composite fields as objects), for history entries
export const toRoboostFieldValue = (
  mergeField: MergeField,
  row: RawRow,
): unknown => {
  const [firstColumn] = mergeField.columns;

  if (mergeField.columns.length === 1 && isDefined(firstColumn)) {
    return row[firstColumn];
  }

  return Object.fromEntries(
    mergeField.columns.map((column) => [
      subFieldName(mergeField.field, column),
      row[column],
    ]),
  );
};

@Injectable()
export class RoboostMergeService {
  private readonly logger = new Logger(RoboostMergeService.name);

  constructor(
    @InjectDataSource()
    private readonly coreDataSource: DataSource,
    private readonly workspaceCacheService: WorkspaceCacheService,
    private readonly roboostRecordVisibilityService: RoboostRecordVisibilityService,
    private readonly roboostMergeAfterEffectsService: RoboostMergeAfterEffectsService,
  ) {}

  assertMergeObject(objectName: string): RoboostMergeObjectName {
    if (
      !(ROBOOST_MERGE_OBJECT_NAMES as readonly string[]).includes(objectName)
    ) {
      throw new BadRequestException(
        'Only companies, contacts, deals and services can be merged',
      );
    }

    return objectName as RoboostMergeObjectName;
  }

  async getObjectContext(
    workspaceId: string,
    objectName: RoboostMergeObjectName,
  ): Promise<RoboostMergeObjectContext> {
    const { flatObjectMetadataMaps, flatFieldMetadataMapsOrm } =
      await this.workspaceCacheService.getOrRecompute(workspaceId, [
        'flatObjectMetadataMaps',
        'flatFieldMetadataMapsOrm',
      ]);
    const flatObjects = Object.values(
      flatObjectMetadataMaps.byUniversalIdentifier,
    ).filter(isDefined);
    const flatObject = flatObjects.find(
      (candidate) => candidate.nameSingular === objectName,
    );

    if (!isDefined(flatObject)) {
      throw new BadRequestException(`Object ${objectName} not found`);
    }

    const columnsByFieldId = getFieldMetadataIdToColumnNamesMap(
      flatObject,
      flatFieldMetadataMapsOrm,
    );
    const allFlatFields = Object.values(
      flatFieldMetadataMapsOrm.byUniversalIdentifier,
    ).filter(isDefined);
    const fields = flatObject.fieldIds
      .map((fieldId) =>
        findFlatEntityByIdInFlatEntityMaps({
          flatEntityId: fieldId,
          flatEntityMaps: flatFieldMetadataMapsOrm,
        }),
      )
      .filter(isDefined)
      .filter(
        (field) =>
          field.isActive !== false &&
          !SKIPPED_FIELD_TYPES.has(field.type) &&
          field.name !== 'deletedAt' &&
          !(
            (field.type === FieldMetadataType.RELATION ||
              field.type === FieldMetadataType.MORPH_RELATION) &&
            relationSettings(field)?.relationType !== RelationType.MANY_TO_ONE
          ),
      )
      .map((field) => ({
        field,
        columns: columnsByFieldId.get(field.id) ?? [],
      }))
      .filter(({ columns }) => columns.length > 0);

    return {
      workspaceId,
      schemaName: getWorkspaceSchemaName(workspaceId),
      objectName,
      flatObject,
      tableName: computeTableName(
        flatObject.nameSingular,
        flatObject.isCustom === true,
      ),
      fields,
      allFlatFields,
      flatObjectsById: new Map(
        flatObjects.map((object) => [object.id, object]),
      ),
    };
  }

  table(context: RoboostMergeObjectContext) {
    return `${quote(context.schemaName)}.${quote(context.tableName)}`;
  }

  async loadRow(
    context: RoboostMergeObjectContext,
    id: string,
    {
      withDeleted = false,
      manager,
    }: { withDeleted?: boolean; manager?: EntityManager } = {},
  ): Promise<RawRow | null> {
    const rows: RawRow[] = await (manager ?? this.coreDataSource).query(
      `SELECT * FROM ${this.table(context)} WHERE id = $1 ${withDeleted ? '' : 'AND "deletedAt" IS NULL'}`,
      [id],
    );

    return rows[0] ?? null;
  }

  async isAdmin(workspaceId: string, workspaceMemberId: string | null) {
    if (!isDefined(workspaceMemberId)) {
      return false;
    }

    const rows: unknown[] = await this.coreDataSource.query(
      `SELECT 1 FROM "${getWorkspaceSchemaName(workspaceId)}"."workspaceMember" wm
      JOIN core."userWorkspace" uw ON uw."userId" = wm."userId" AND uw."workspaceId" = $1 AND uw."deletedAt" IS NULL
      JOIN core."roleTarget" rt ON rt."userWorkspaceId" = uw.id
      JOIN core."role" r ON r.id = rt."roleId"
      WHERE wm.id = $2 AND r."universalIdentifier" = '20202020-02c2-43f2-b94d-cab1f2b532eb'
      LIMIT 1`,
      [workspaceId, workspaceMemberId],
    );

    return rows.length > 0;
  }

  async filterMergeableIds(
    workspaceId: string,
    workspaceMemberId: string | null,
    objectName: RoboostMergeObjectName,
    recordIds: string[],
  ) {
    if (!isDefined(workspaceMemberId)) {
      return recordIds;
    }

    return this.roboostRecordVisibilityService.filterVisibleRecordIds({
      workspaceId,
      workspaceMemberId,
      objectNameSingular: objectName,
      recordIds,
      isMerge: true,
    });
  }

  async assertCanMerge(
    workspaceId: string,
    actor: RoboostMergeActor,
    objectName: RoboostMergeObjectName,
    recordIds: string[],
  ) {
    const mergeable = await this.filterMergeableIds(
      workspaceId,
      actor.workspaceMemberId,
      objectName,
      recordIds,
    );

    if (recordIds.some((id) => !mergeable.includes(id))) {
      throw new ForbiddenException(
        'You do not have the Merge permission on both records',
      );
    }
  }

  private fieldMode(mergeField: MergeField): RoboostMergeFieldPlan['mode'] {
    const { field } = mergeField;

    if (FIXED_FIELD_NAMES.has(field.name)) {
      return 'fixed';
    }

    if (KEPT_FIELD_NAMES.has(field.name) || field.isSystem === true) {
      return 'kept';
    }

    if (field.isUIEditable === false) {
      return 'recalculated';
    }

    return 'choice';
  }

  private isEmptyField(mergeField: MergeField, row: RawRow) {
    if (mergeField.field.type === FieldMetadataType.CURRENCY) {
      return mergeField.columns
        .filter((column) => column.endsWith('AmountMicros'))
        .every((column) => isEmptyColumnValue(row[column]));
    }

    return mergeField.columns.every((column) =>
      isEmptyColumnValue(row[column]),
    );
  }

  // The stage furthest down the funnel is the option with the highest position
  private furthestSelectSide(
    mergeField: MergeField,
    primaryRow: RawRow,
    secondaryRow: RawRow,
  ): 'primary' | 'secondary' {
    const options = (mergeField.field.options ?? []) as {
      value: string;
      position: number;
    }[];
    const positionOf = (value: unknown) =>
      options.find((option) => option.value === value)?.position ?? -1;
    const column = mergeField.columns[0] ?? mergeField.field.name;

    return positionOf(secondaryRow[column]) > positionOf(primaryRow[column])
      ? 'secondary'
      : 'primary';
  }

  buildPlan(
    context: RoboostMergeObjectContext,
    primaryRow: RawRow,
    secondaryRow: RawRow,
  ): RoboostMergeFieldPlan[] {
    return context.fields.map((mergeField) => {
      const mode = this.fieldMode(mergeField);
      const isDifferent = mergeField.columns.some(
        (column) => !sameValue(primaryRow[column], secondaryRow[column]),
      );
      const isPrimaryEmpty = this.isEmptyField(mergeField, primaryRow);
      const isSecondaryEmpty = this.isEmptyField(mergeField, secondaryRow);
      let defaultSide: 'primary' | 'secondary' =
        isPrimaryEmpty && !isSecondaryEmpty ? 'secondary' : 'primary';

      if (
        mode === 'choice' &&
        mergeField.field.name === 'lifecycleStage' &&
        !isPrimaryEmpty &&
        !isSecondaryEmpty
      ) {
        defaultSide = this.furthestSelectSide(
          mergeField,
          primaryRow,
          secondaryRow,
        );
      }

      const note =
        mode === 'fixed'
          ? mergeField.field.name === 'createdAt'
            ? 'The oldest create date is kept'
            : mergeField.field.name === 'mergedRecordIds'
              ? 'The secondary record ID is added'
              : mergeField.field.name === 'emails'
                ? "The secondary's emails are added as additional emails"
                : "The secondary's domains are added as extra domains"
          : mode === 'recalculated'
            ? 'Recalculated after merge'
            : mode === 'kept'
              ? 'Kept automatically'
              : null;

      return {
        name: mergeField.field.name,
        mode,
        defaultSide: mode === 'choice' ? defaultSide : 'primary',
        isDifferent: isDifferent && !(isPrimaryEmpty && isSecondaryEmpty),
        note,
      };
    });
  }

  async getMergeCount(context: RoboostMergeObjectContext, row: RawRow) {
    const rows: { count: string }[] = await this.coreDataSource.query(
      `SELECT count(*)::text AS count FROM ${quote(context.schemaName)}."roboostMergeLog" WHERE "primaryId" = $1 AND status = 'MERGED'`,
      [row.id],
    );

    return Math.max(
      Number(rows[0]?.count ?? 0),
      toArray(row.mergedRecordIds).length,
    );
  }

  private async companyChain(
    context: RoboostMergeObjectContext,
    companyId: string,
    direction: 'up' | 'down',
  ): Promise<string[]> {
    const rows: { id: string }[] = await this.coreDataSource.query(
      direction === 'up'
        ? `WITH RECURSIVE chain AS (
            SELECT id, "parentCompanyId", 0 AS depth FROM ${this.table(context)} WHERE id = $1
            UNION ALL
            SELECT c.id, c."parentCompanyId", chain.depth + 1 FROM ${this.table(context)} c JOIN chain ON c.id = chain."parentCompanyId" WHERE chain.depth < 50
          ) SELECT id FROM chain WHERE id <> $1`
        : `WITH RECURSIVE chain AS (
            SELECT id, 0 AS depth FROM ${this.table(context)} WHERE id = $1
            UNION ALL
            SELECT c.id, chain.depth + 1 FROM ${this.table(context)} c JOIN chain ON c."parentCompanyId" = chain.id WHERE chain.depth < 50 AND c."deletedAt" IS NULL
          ) SELECT id FROM chain WHERE id <> $1`,
      [companyId],
    );

    return rows.map((row) => row.id);
  }

  async findBlockers(
    context: RoboostMergeObjectContext,
    primaryRow: RawRow,
    secondaryRow: RawRow,
  ): Promise<string[]> {
    const blockers: string[] = [];
    const mergeCount =
      (await this.getMergeCount(context, primaryRow)) +
      (await this.getMergeCount(context, secondaryRow)) +
      1;

    if (mergeCount > ROBOOST_MERGE_MAX_MERGES_PER_RECORD) {
      blockers.push(
        `These records already hold ${mergeCount - 1} merges together; the limit is ${ROBOOST_MERGE_MAX_MERGES_PER_RECORD}.`,
      );
    }

    if (
      context.objectName === 'company' &&
      context.fields.some(({ field }) => field.name === 'parentCompany')
    ) {
      const primaryId = primaryRow.id as string;
      const secondaryId = secondaryRow.id as string;
      const related = [
        ...(await this.companyChain(context, primaryId, 'up')),
        ...(await this.companyChain(context, primaryId, 'down')),
      ];

      if (related.includes(secondaryId)) {
        blockers.push(
          'These companies are in the same parent/child chain; merging them would make a company its own parent.',
        );
      }
    }

    return blockers;
  }

  // Values of the merged record, column by column, with the fixed rules applied
  computeMergedColumns(
    context: RoboostMergeObjectContext,
    primaryRow: RawRow,
    secondaryRow: RawRow,
    secondaryFieldNames: Set<string>,
  ): Record<string, unknown> {
    const merged: Record<string, unknown> = {};

    for (const mergeField of context.fields) {
      const { field, columns } = mergeField;
      const mode = this.fieldMode(mergeField);

      if (field.name === 'createdAt') {
        const primaryDate = new Date(primaryRow.createdAt as string).getTime();
        const secondaryDate = new Date(
          secondaryRow.createdAt as string,
        ).getTime();

        merged.createdAt =
          secondaryDate < primaryDate
            ? secondaryRow.createdAt
            : primaryRow.createdAt;
        continue;
      }

      if (field.name === 'mergedRecordIds') {
        merged.mergedRecordIds = [
          ...new Set(
            [
              ...toArray(primaryRow.mergedRecordIds),
              ...toArray(secondaryRow.mergedRecordIds),
              secondaryRow.id,
            ].map(String),
          ),
        ];
        continue;
      }

      if (field.type === FieldMetadataType.EMAILS && field.name === 'emails') {
        const primaryEmail =
          (primaryRow.emailsPrimaryEmail as string | null) ||
          (secondaryRow.emailsPrimaryEmail as string | null) ||
          '';
        const additional = [
          ...toArray(primaryRow.emailsAdditionalEmails),
          primaryRow.emailsPrimaryEmail,
          secondaryRow.emailsPrimaryEmail,
          ...toArray(secondaryRow.emailsAdditionalEmails),
        ]
          .filter((email): email is string => typeof email === 'string')
          .map((email) => email.trim().toLowerCase())
          .filter(
            (email) => email !== '' && email !== primaryEmail.toLowerCase(),
          );

        merged.emailsPrimaryEmail = primaryEmail;
        merged.emailsAdditionalEmails =
          additional.length > 0 ? [...new Set(additional)] : null;
        continue;
      }

      if (
        field.type === FieldMetadataType.LINKS &&
        field.name === 'domainName'
      ) {
        const usePrimary = !isEmptyColumnValue(
          primaryRow.domainNamePrimaryLinkUrl,
        );
        const source = usePrimary ? primaryRow : secondaryRow;
        const primaryDomain = normalizeDomain(
          String(source.domainNamePrimaryLinkUrl ?? ''),
        );
        const extras = [
          ...toArray(primaryRow.domainNameSecondaryLinks),
          { url: primaryRow.domainNamePrimaryLinkUrl },
          { url: secondaryRow.domainNamePrimaryLinkUrl },
          ...toArray(secondaryRow.domainNameSecondaryLinks),
        ]
          .map((link) =>
            normalizeDomain(String((link as { url?: unknown })?.url ?? '')),
          )
          .filter((domain) => domain !== '' && domain !== primaryDomain);

        merged.domainNamePrimaryLinkUrl = source.domainNamePrimaryLinkUrl;
        merged.domainNamePrimaryLinkLabel = source.domainNamePrimaryLinkLabel;
        merged.domainNameSecondaryLinks =
          extras.length > 0
            ? [...new Set(extras)].map((url) => ({ url, label: '' }))
            : null;
        continue;
      }

      if (mode !== 'choice') {
        continue;
      }

      const source = secondaryFieldNames.has(field.name)
        ? secondaryRow
        : primaryRow;

      for (const column of columns) {
        merged[column] = source[column];
      }
    }

    return merged;
  }

  async merge({
    workspaceId,
    actor,
    objectName: rawObjectName,
    primaryId,
    secondaryId,
    secondaryFieldNames: requestedSecondaryFieldNames,
    isBulk = false,
  }: {
    workspaceId: string;
    actor: RoboostMergeActor;
    objectName: string;
    primaryId: string;
    secondaryId: string;
    // Fields where the secondary's value wins; undefined applies the default choices
    secondaryFieldNames?: string[];
    isBulk?: boolean;
  }): Promise<{ mergeId: string }> {
    const objectName = this.assertMergeObject(rawObjectName);

    if (primaryId === secondaryId) {
      throw new BadRequestException('Pick two different records');
    }

    await this.assertCanMerge(workspaceId, actor, objectName, [
      primaryId,
      secondaryId,
    ]);

    const context = await this.getObjectContext(workspaceId, objectName);
    const primaryRow = await this.loadRow(context, primaryId);
    const secondaryRow = await this.loadRow(context, secondaryId);

    if (!isDefined(primaryRow) || !isDefined(secondaryRow)) {
      throw new BadRequestException('One of the records no longer exists');
    }

    const blockers = await this.findBlockers(context, primaryRow, secondaryRow);

    if (blockers.length > 0) {
      throw new BadRequestException(blockers.join(' '));
    }

    const plan = this.buildPlan(context, primaryRow, secondaryRow);
    const choiceNames = new Set(
      plan
        .filter((entry) => entry.mode === 'choice')
        .map((entry) => entry.name),
    );
    const secondaryFieldNames = new Set(
      (
        requestedSecondaryFieldNames ??
        plan
          .filter((entry) => entry.defaultSide === 'secondary')
          .map((entry) => entry.name)
      ).filter((name) => choiceNames.has(name)),
    );
    const merged = this.computeMergedColumns(
      context,
      primaryRow,
      secondaryRow,
      secondaryFieldNames,
    );
    const changedColumns = Object.keys(merged).filter(
      (column) => !sameValue(merged[column], primaryRow[column]),
    );
    const primaryChanges: RoboostMergeFieldChange[] = context.fields
      .filter(({ columns }) =>
        columns.some((column) => changedColumns.includes(column)),
      )
      .map((mergeField) => ({
        fieldName: mergeField.field.name,
        fieldLabel: mergeField.field.label,
        columns: Object.fromEntries(
          mergeField.columns.map((column) => [
            column,
            {
              before: primaryRow[column] ?? null,
              after: column in merged ? merged[column] : primaryRow[column],
            },
          ]),
        ),
      }));
    const primaryName = this.recordName(context, primaryRow);
    const secondaryName = this.recordName(context, secondaryRow);
    const now = new Date().toISOString();

    const result = await this.coreDataSource.transaction(async (manager) => {
      const [{ id: mergeId }]: { id: string }[] = await manager.query(
        `INSERT INTO ${quote(context.schemaName)}."roboostMergeLog"
          ("objectName", "primaryId", "secondaryId", "primaryName", "secondaryName", "mergedById", "mergedByName", "isBulk", "secondarySnapshot")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
        [
          objectName,
          primaryId,
          secondaryId,
          primaryName,
          secondaryName,
          actor.workspaceMemberId,
          actor.name,
          isBulk,
          JSON.stringify(secondaryRow),
        ],
      );

      // The secondary leaves first, so values unique among live records can move to the primary
      await manager.query(
        `UPDATE ${this.table(context)} SET "deletedAt" = $2 WHERE id = $1`,
        [secondaryId, now],
      );

      if (changedColumns.length > 0) {
        const assignments = changedColumns.map(
          (column, index) => `${quote(column)} = $${index + 2}`,
        );

        await manager.query(
          `UPDATE ${this.table(context)} SET ${assignments.join(', ')}, "updatedAt" = now() WHERE id = $1`,
          [
            primaryId,
            ...changedColumns.map((column) => this.toSqlValue(merged[column])),
          ],
        );
      }

      const movedLinks = await this.moveLinks({
        manager,
        context,
        fromId: secondaryId,
        toId: primaryId,
        now,
      });

      await this.writeHistory({
        manager,
        context,
        recordId: primaryId,
        mergeId,
        actor,
        changes: primaryChanges,
        event: {
          kind: 'merged',
          otherRecordId: secondaryId,
          otherRecordName: secondaryName,
        },
        now,
      });

      const segmentMembershipsAdded = movedLinks
        .filter((link) => link.tableName === 'segmentMember')
        .flatMap((link) => link.movedIds);

      await manager.query(
        `UPDATE ${quote(context.schemaName)}."roboostMergeLog"
        SET "primaryBefore" = $2, "primaryChanges" = $3, "movedLinks" = $4, "segmentMembershipsAdded" = $5
        WHERE id = $1`,
        [
          mergeId,
          JSON.stringify(
            Object.fromEntries(
              changedColumns.map((column) => [
                column,
                primaryRow[column] ?? null,
              ]),
            ),
          ),
          JSON.stringify(primaryChanges),
          JSON.stringify(movedLinks),
          JSON.stringify(segmentMembershipsAdded),
        ],
      );

      return { mergeId, movedLinks };
    });

    await this.roboostMergeAfterEffectsService.afterRecordsChanged({
      workspaceId,
      objectName,
      recordIds: [primaryId, secondaryId],
      movedLinks: result.movedLinks,
      relatedCompanyIds: [primaryRow.companyId, secondaryRow.companyId].filter(
        (id): id is string => typeof id === 'string',
      ),
    });

    this.logger.log(
      `Workspace ${workspaceId}: ${objectName} ${secondaryId} merged into ${primaryId} (${result.mergeId})`,
    );

    return { mergeId: result.mergeId };
  }

  recordName(context: RoboostMergeObjectContext, row: RawRow): string {
    if (context.objectName === 'person') {
      return (
        [row.nameFirstName, row.nameLastName]
          .filter((part) => typeof part === 'string' && part.trim() !== '')
          .join(' ')
          .trim() || String(row.emailsPrimaryEmail ?? row.id)
      );
    }

    return String(row.name ?? row.id);
  }

  toSqlValue(value: unknown) {
    if (value === undefined) {
      return null;
    }

    if (
      value !== null &&
      typeof value === 'object' &&
      !(value instanceof Date)
    ) {
      return Array.isArray(value) &&
        value.every((item) => typeof item === 'string')
        ? value
        : JSON.stringify(value);
    }

    return value;
  }

  // Every MANY_TO_ONE relation that points at this object, as table + join column
  linkColumns(context: RoboostMergeObjectContext) {
    return context.allFlatFields
      .filter(
        (field) =>
          (field.type === FieldMetadataType.RELATION ||
            field.type === FieldMetadataType.MORPH_RELATION) &&
          field.relationTargetObjectMetadataId === context.flatObject.id &&
          relationSettings(field)?.relationType === RelationType.MANY_TO_ONE &&
          isDefined(relationSettings(field)?.joinColumnName) &&
          field.isActive !== false,
      )
      .map((field) => {
        const owner = context.flatObjectsById.get(field.objectMetadataId);

        return isDefined(owner)
          ? {
              tableName: computeTableName(
                owner.nameSingular,
                owner.isCustom === true,
              ),
              columnName: relationSettings(field)?.joinColumnName as string,
            }
          : null;
      })
      .filter(isDefined)
      .filter(
        (link, index, links) =>
          links.findIndex(
            (candidate) =>
              candidate.tableName === link.tableName &&
              candidate.columnName === link.columnName,
          ) === index,
      );
  }

  // Other columns of each unique index that contains the join column: a row clashing there is a duplicate link
  private async uniqueKeyPeers(
    manager: EntityManager,
    schemaName: string,
    tableName: string,
    columnName: string,
  ): Promise<string[][]> {
    const indexes: { indexdef: string }[] = await manager.query(
      `SELECT indexdef FROM pg_indexes WHERE schemaname = $1 AND tablename = $2 AND indexdef LIKE 'CREATE UNIQUE INDEX%'`,
      [schemaName, tableName],
    );

    return indexes
      .map(({ indexdef }) => {
        const match = indexdef.match(/\(([^)]*)\)/);

        return (match?.[1] ?? '')
          .split(',')
          .map((part) => part.trim().replace(/^"|"$/g, ''));
      })
      .filter((columns) => columns.includes(columnName) && columns.length > 1)
      .map((columns) => columns.filter((column) => column !== columnName));
  }

  async moveLinks({
    manager,
    context,
    fromId,
    toId,
    now,
    onlyIds,
  }: {
    manager: EntityManager;
    context: RoboostMergeObjectContext;
    fromId: string;
    toId: string;
    now: string;
    onlyIds?: Map<string, string[]>;
  }): Promise<RoboostMergeMovedLink[]> {
    const movedLinks: RoboostMergeMovedLink[] = [];

    for (const { tableName, columnName } of this.linkColumns(context)) {
      const key = `${tableName}.${columnName}`;
      const restrictTo = onlyIds?.get(key);

      if (isDefined(onlyIds) && !isDefined(restrictTo)) {
        continue;
      }

      const table = `${quote(context.schemaName)}.${quote(tableName)}`;
      const rows: { id: string }[] = await manager.query(
        `SELECT id FROM ${table} WHERE ${quote(columnName)} = $1 AND "deletedAt" IS NULL AND id <> $2 ${
          isDefined(restrictTo) ? 'AND id = ANY($3::uuid[])' : ''
        }`,
        isDefined(restrictTo) ? [fromId, toId, restrictTo] : [fromId, toId],
      );

      if (rows.length === 0) {
        continue;
      }

      const ids = rows.map((row) => row.id);
      const peerGroups = await this.uniqueKeyPeers(
        manager,
        context.schemaName,
        tableName,
        columnName,
      );
      let clashingIds: string[] = [];

      for (const peers of peerGroups) {
        const match = peers
          .map(
            (peer) =>
              `other.${quote(peer)} IS NOT DISTINCT FROM moving.${quote(peer)}`,
          )
          .join(' AND ');
        const clashes: { id: string }[] = await manager.query(
          `SELECT moving.id FROM ${table} moving
          WHERE moving.id = ANY($1::uuid[]) AND EXISTS (
            SELECT 1 FROM ${table} other
            WHERE other.${quote(columnName)} = $2 AND other."deletedAt" IS NULL AND ${match}
          )`,
          [ids, toId],
        );

        clashingIds = [...clashingIds, ...clashes.map((row) => row.id)];
      }

      clashingIds = [...new Set(clashingIds)];
      const movingIds = ids.filter((id) => !clashingIds.includes(id));

      if (clashingIds.length > 0) {
        await manager.query(
          `UPDATE ${table} SET "deletedAt" = $2 WHERE id = ANY($1::uuid[])`,
          [clashingIds, now],
        );
      }

      if (movingIds.length > 0) {
        await manager.query(
          `UPDATE ${table} SET ${quote(columnName)} = $2 WHERE id = ANY($1::uuid[])`,
          [movingIds, toId],
        );
      }

      movedLinks.push({
        tableName,
        columnName,
        movedIds: movingIds,
        softDeletedIds: clashingIds,
      });
    }

    return movedLinks;
  }

  async writeHistory({
    manager,
    context,
    recordId,
    mergeId,
    actor,
    changes,
    event,
    now,
  }: {
    manager: EntityManager;
    context: RoboostMergeObjectContext;
    recordId: string;
    mergeId: string;
    actor: RoboostMergeActor;
    changes: RoboostMergeFieldChange[];
    event: {
      kind: 'merged' | 'unmerged' | 'unmergedFrom';
      otherRecordId: string;
      otherRecordName: string;
    };
    now: string;
  }) {
    const { flatTimelineActivityTypeMaps } =
      await this.workspaceCacheService.getOrRecompute(context.workspaceId, [
        'flatTimelineActivityTypeMaps',
      ]);
    const timelineType =
      flatTimelineActivityTypeMaps.byUniversalIdentifier[
        RECORD_UPDATED_TIMELINE_TYPE_UNIVERSAL_IDENTIFIER
      ];

    if (!isDefined(timelineType)) {
      this.logger.warn(
        `Workspace ${context.workspaceId}: record updated timeline type missing; merge history not written`,
      );

      return;
    }

    const resolvedType = toResolvedTimelineActivityType(timelineType);
    const targetColumn = TIMELINE_TARGET_COLUMN_BY_OBJECT[context.objectName];
    const updatedBy = {
      source: FieldActorSource.MANUAL,
      workspaceMemberId: actor.workspaceMemberId,
      name: actor.name ?? '',
      context: { roboostMergeId: mergeId },
    };
    const fieldsByName = new Map(
      context.fields.map((mergeField) => [mergeField.field.name, mergeField]),
    );
    const rows = [
      ...changes
        .filter((change) => fieldsByName.has(change.fieldName))
        .map((change) => {
          const mergeField = fieldsByName.get(change.fieldName) as MergeField;
          const before = Object.fromEntries(
            Object.entries(change.columns).map(([column, value]) => [
              column,
              value.before,
            ]),
          );
          const after = Object.fromEntries(
            Object.entries(change.columns).map(([column, value]) => [
              column,
              value.after,
            ]),
          );

          return {
            properties: {
              diff: {
                [change.fieldName]: {
                  before: toRoboostFieldValue(mergeField, before),
                  after: toRoboostFieldValue(mergeField, after),
                },
              },
              updatedBy,
            },
          };
        }),
      {
        properties: {
          roboostEvent: event.kind,
          roboostMergeId: mergeId,
          otherRecordId: event.otherRecordId,
          otherRecordName: event.otherRecordName,
          actorName: actor.name,
          updatedBy,
        },
      },
    ];

    for (const row of rows) {
      await manager.query(
        `INSERT INTO ${quote(context.schemaName)}."timelineActivity"
          (${quote(targetColumn)}, "happensAt", "timelineActivityTypeId", "timelineActivityTypeSnapshot", properties, "workspaceMemberId", "linkedRecordCachedName")
        VALUES ($1, $2, $3, $4, $5, $6, '')`,
        [
          recordId,
          now,
          resolvedType.id,
          JSON.stringify(resolvedType.snapshot),
          JSON.stringify(row.properties),
          actor.workspaceMemberId,
        ],
      );
    }
  }

  async candidates({
    workspaceId,
    actor,
    objectName: rawObjectName,
    excludeId,
    search,
  }: {
    workspaceId: string;
    actor: RoboostMergeActor;
    objectName: string;
    excludeId: string;
    search: string;
  }) {
    const objectName = this.assertMergeObject(rawObjectName);
    const context = await this.getObjectContext(workspaceId, objectName);
    const pattern = `%${search.trim().replace(/[%_]/g, '')}%`;
    const searchCondition =
      objectName === 'person'
        ? `concat_ws(' ', "nameFirstName", "nameLastName") ILIKE $2 OR "emailsPrimaryEmail" ILIKE $2 OR "emailsAdditionalEmails"::text ILIKE $2`
        : objectName === 'company'
          ? `name ILIKE $2 OR "domainNamePrimaryLinkUrl" ILIKE $2 OR "domainNameSecondaryLinks"::text ILIKE $2`
          : `name ILIKE $2`;
    const rows: RawRow[] = await this.coreDataSource.query(
      `SELECT * FROM ${this.table(context)} WHERE "deletedAt" IS NULL AND id <> $1 AND (${searchCondition}) ORDER BY "createdAt" DESC LIMIT 40`,
      [excludeId, pattern],
    );
    const visible = new Set(
      await this.roboostRecordVisibilityService.filterVisibleRecordIds({
        workspaceId,
        workspaceMemberId: actor.workspaceMemberId ?? '',
        objectNameSingular: objectName,
        recordIds: rows.map((row) => row.id as string),
      }),
    );
    const mergeable = new Set(
      await this.filterMergeableIds(
        workspaceId,
        actor.workspaceMemberId,
        objectName,
        rows.map((row) => row.id as string),
      ),
    );

    return rows
      .filter(
        (row) =>
          visible.has(row.id as string) && mergeable.has(row.id as string),
      )
      .slice(0, 20)
      .map((row) => ({
        id: row.id as string,
        name: this.recordName(context, row),
        keyText: this.keyText(context, row),
        createdAt: new Date(row.createdAt as string).toISOString(),
      }));
  }

  keyText(context: RoboostMergeObjectContext, row: RawRow): string {
    switch (context.objectName) {
      case 'person':
        return String(row.emailsPrimaryEmail ?? '');
      case 'company':
        return String(row.domainNamePrimaryLinkUrl ?? '');
      case 'opportunity': {
        const amount = isDefined(row.amountAmountMicros)
          ? `${Math.round(Number(row.amountAmountMicros) / 1_000_000).toLocaleString('en-US')} ${row.amountCurrencyCode ?? ''}`.trim()
          : '';

        return [row.stage, amount]
          .filter((part) => isDefined(part) && part !== '')
          .join(' · ');
      }
      default:
        return String(row.stage ?? '');
    }
  }

  async preview({
    workspaceId,
    actor,
    objectName: rawObjectName,
    primaryId,
    secondaryId,
  }: {
    workspaceId: string;
    actor: RoboostMergeActor;
    objectName: string;
    primaryId: string;
    secondaryId: string;
  }) {
    const objectName = this.assertMergeObject(rawObjectName);

    await this.assertCanMerge(workspaceId, actor, objectName, [
      primaryId,
      secondaryId,
    ]);

    const context = await this.getObjectContext(workspaceId, objectName);
    const primaryRow = await this.loadRow(context, primaryId);
    const secondaryRow = await this.loadRow(context, secondaryId);

    if (!isDefined(primaryRow) || !isDefined(secondaryRow)) {
      throw new BadRequestException('One of the records no longer exists');
    }

    const companyField = context.fields.find(
      ({ field }) => field.name === ROBOOST_MERGE_COMPANY_FIELD_NAME,
    );
    const companyColumn = companyField?.columns[0];
    const primaryCompanyId = isDefined(companyColumn)
      ? (primaryRow[companyColumn] as string | null)
      : null;
    const secondaryCompanyId = isDefined(companyColumn)
      ? (secondaryRow[companyColumn] as string | null)
      : null;

    return {
      plan: this.buildPlan(context, primaryRow, secondaryRow),
      blockers: await this.findBlockers(context, primaryRow, secondaryRow),
      companyConflict:
        isDefined(primaryCompanyId) &&
        isDefined(secondaryCompanyId) &&
        primaryCompanyId !== secondaryCompanyId
          ? { primaryCompanyId, secondaryCompanyId }
          : null,
      primaryKeyText: this.keyText(context, primaryRow),
      secondaryKeyText: this.keyText(context, secondaryRow),
    };
  }

  // The record a merged record now lives in, following later merges
  async mergedInto(
    workspaceId: string,
    objectName: string,
    recordId: string,
  ): Promise<{ primaryId: string; primaryName: string | null } | null> {
    if (
      !(ROBOOST_MERGE_OBJECT_NAMES as readonly string[]).includes(objectName)
    ) {
      return null;
    }

    const schema = quote(getWorkspaceSchemaName(workspaceId));
    const [{ exists }]: { exists: string | null }[] =
      await this.coreDataSource.query(
        `SELECT to_regclass($1)::text AS exists`,
        [`${schema}."roboostMergeLog"`],
      );

    if (!isDefined(exists)) {
      return null;
    }

    let currentId = recordId;
    let result: { primaryId: string; primaryName: string | null } | null = null;

    for (let hop = 0; hop < 10; hop++) {
      const rows: { primaryId: string; primaryName: string | null }[] =
        await this.coreDataSource.query(
          `SELECT "primaryId", "primaryName" FROM ${schema}."roboostMergeLog"
          WHERE "objectName" = $1 AND "secondaryId" = $2 AND status IN ('MERGED', 'EXPIRED')
          ORDER BY "mergedAt" DESC LIMIT 1`,
          [objectName, currentId],
        );

      if (rows.length === 0) {
        break;
      }

      result = rows[0];
      currentId = rows[0].primaryId;
    }

    return result;
  }
}
