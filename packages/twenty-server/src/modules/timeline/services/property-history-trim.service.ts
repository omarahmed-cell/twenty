import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';

import { isDefined, uncapitalize } from 'twenty-shared/utils';
import { DataSource } from 'typeorm';

import { getWorkspaceSchemaName } from 'src/engine/workspace-datasource/utils/get-workspace-schema-name.util';
import { PropertyHistoryLimitsService } from 'src/modules/timeline/services/property-history-limits.service';
import { buildFieldHistoryRowCondition } from 'src/modules/timeline/utils/build-trim-field-history-query.util';
import { getPropertyHistoryLimit } from 'src/modules/timeline/utils/get-property-history-limit.util';
import {
  type FieldHistoryGroup,
  trimFieldHistory,
} from 'src/modules/timeline/utils/trim-field-history.util';

const GROUPS_PER_BATCH = 200;
const MAX_BATCHES_PER_OBJECT = 500;
// Short pauses between batches keep the nightly catch-up from crowding out live traffic
const PAUSE_BETWEEN_BATCHES_MS = 200;

const TARGET_COLUMN_NAME_PATTERN = /^target([A-Z]\w*)Id$/;

@Injectable()
export class PropertyHistoryTrimService {
  private readonly logger = new Logger(PropertyHistoryTrimService.name);

  constructor(
    @InjectDataSource()
    private readonly coreDataSource: DataSource,
    private readonly propertyHistoryLimitsService: PropertyHistoryLimitsService,
  ) {}

  // Catches what trim-on-write cannot: lowered limits and rows written without record events
  async trimWorkspace(workspaceId: string): Promise<number> {
    const schemaName = getWorkspaceSchemaName(workspaceId);
    const limits =
      await this.propertyHistoryLimitsService.getLimits(workspaceId);
    const columns: { columnName: string }[] = await this.coreDataSource.query(
      `SELECT column_name AS "columnName" FROM information_schema.columns
      WHERE table_schema = $1 AND table_name = 'timelineActivity'`,
      [schemaName],
    );
    let removedCount = 0;

    for (const { columnName } of columns) {
      const match = TARGET_COLUMN_NAME_PATTERN.exec(columnName);

      if (!isDefined(match)) {
        continue;
      }

      removedCount += await this.trimObject({
        schemaName,
        targetColumnName: columnName,
        limit: getPropertyHistoryLimit(limits, uncapitalize(match[1])),
      });
    }

    if (removedCount > 0) {
      this.logger.log(
        `Workspace ${workspaceId}: removed ${removedCount} field change(s) beyond the property history limits`,
      );
    }

    return removedCount;
  }

  private async trimObject({
    schemaName,
    targetColumnName,
    limit,
  }: {
    schemaName: string;
    targetColumnName: string;
    limit: number;
  }): Promise<number> {
    let removedCount = 0;

    for (let batch = 0; batch < MAX_BATCHES_PER_OBJECT; batch++) {
      const groups: FieldHistoryGroup[] = await this.coreDataSource.query(
        `SELECT t."${targetColumnName}" AS "recordId", k AS "fieldName"
        FROM "${schemaName}"."timelineActivity" t
        CROSS JOIN LATERAL jsonb_object_keys(t.properties->'diff') k
        WHERE t."${targetColumnName}" IS NOT NULL AND ${buildFieldHistoryRowCondition('t')}
        GROUP BY 1, 2
        HAVING count(*) > $1
        LIMIT $2`,
        [limit, GROUPS_PER_BATCH],
      );

      if (groups.length === 0) {
        break;
      }

      const removedInBatch = await trimFieldHistory({
        executeQuery: (sql, parameters) =>
          this.coreDataSource.query(sql, parameters),
        schemaName,
        targetColumnName,
        groups,
        limit,
      });

      removedCount += removedInBatch;

      if (removedInBatch === 0) {
        break;
      }

      await new Promise((resolve) =>
        setTimeout(resolve, PAUSE_BETWEEN_BATCHES_MS),
      );
    }

    return removedCount;
  }
}
