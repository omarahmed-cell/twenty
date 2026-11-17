import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';

import { type ObjectRecordCreateEvent } from 'twenty-shared/database-events';
import { STANDARD_OBJECTS } from 'twenty-shared/metadata';
import { isDefined } from 'twenty-shared/utils';
import { DataSource } from 'typeorm';

import { OnDatabaseBatchEvent } from 'src/engine/api/graphql/graphql-query-runner/decorators/on-database-batch-event.decorator';
import { DatabaseEventAction } from 'src/engine/api/graphql/graphql-query-runner/enums/database-event-action';
import { isRecordSourceObjectName } from 'src/engine/core-modules/actor/utils/is-record-source-object-name.util';
import { WorkspaceManyOrAllFlatEntityMapsCacheService } from 'src/engine/metadata-modules/flat-entity/services/workspace-many-or-all-flat-entity-maps-cache.service';
import { getWorkspaceSchemaName } from 'src/engine/workspace-datasource/utils/get-workspace-schema-name.util';
import { type WorkspaceEventBatch } from 'src/engine/workspace-event-emitter/types/workspace-event-batch.type';
import { computePostgresEnumName } from 'src/engine/workspace-manager/workspace-migration/utils/compute-postgres-enum-name.util';
import { collectRecordsMissingRecordSource } from 'src/modules/record-source/utils/collect-records-missing-record-source.util';

type RecordCreateEventBatch = WorkspaceEventBatch<
  ObjectRecordCreateEvent<Record<string, unknown>>
>;

// Records written straight through the ORM (sync jobs, internal services) skip the query runner hooks
@Injectable()
export class RecordSourceListener {
  constructor(
    @InjectDataSource()
    private readonly coreDataSource: DataSource,
    private readonly flatEntityMapsCacheService: WorkspaceManyOrAllFlatEntityMapsCacheService,
  ) {}

  @OnDatabaseBatchEvent('*', DatabaseEventAction.CREATED)
  async handleCreated(batch: RecordCreateEventBatch) {
    const objectNameSingular = batch.objectMetadata.nameSingular;

    if (
      !isRecordSourceObjectName(objectNameSingular) ||
      batch.objectMetadata.universalIdentifier !==
        STANDARD_OBJECTS[objectNameSingular].universalIdentifier
    ) {
      return;
    }

    const recordIds = collectRecordsMissingRecordSource(batch.events);

    if (recordIds.length === 0) {
      return;
    }

    const { flatFieldMetadataMaps } =
      await this.flatEntityMapsCacheService.getOrRecomputeManyOrAllFlatEntityMaps(
        {
          workspaceId: batch.workspaceId,
          flatMapsKeys: ['flatFieldMetadataMaps'],
        },
      );

    const recordSourceField =
      flatFieldMetadataMaps.byUniversalIdentifier[
        STANDARD_OBJECTS[objectNameSingular].fields.recordSource
          .universalIdentifier
      ];

    if (!isDefined(recordSourceField)) {
      return;
    }

    const schemaName = getWorkspaceSchemaName(batch.workspaceId);
    const recordSourceEnumName = computePostgresEnumName({
      tableName: objectNameSingular,
      columnName: 'recordSource',
    });

    await this.coreDataSource.query(
      `UPDATE "${schemaName}"."${objectNameSingular}"
      SET "recordSource" = "createdBySource"::text::"${schemaName}"."${recordSourceEnumName}"
      WHERE "id" = ANY($1::uuid[]) AND "recordSource" IS NULL AND "createdBySource" IS NOT NULL`,
      [recordIds],
    );
  }
}
