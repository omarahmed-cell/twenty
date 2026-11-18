import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';

import { DataSource } from 'typeorm';

import { getWorkspaceSchemaName } from 'src/engine/workspace-datasource/utils/get-workspace-schema-name.util';

const IS_OVERDUE_EXPRESSION = `("dueAt" IS NOT NULL AND "dueAt" < now() AND "status" IS DISTINCT FROM 'DONE')`;

@Injectable()
export class TaskOverdueService {
  constructor(
    @InjectDataSource()
    private readonly coreDataSource: DataSource,
  ) {}

  // Writes only the rows whose value changes, so the 15-minute run stays cheap
  async recomputeOverdue(workspaceId: string): Promise<number> {
    const schema = `"${getWorkspaceSchemaName(workspaceId)}"`;

    const [, changedCount] = await this.coreDataSource.query<
      [unknown[], number]
    >(
      `UPDATE ${schema}."task"
       SET "isOverdue" = ${IS_OVERDUE_EXPRESSION}
       WHERE "isOverdue" IS DISTINCT FROM ${IS_OVERDUE_EXPRESSION}`,
    );

    return changedCount;
  }
}
