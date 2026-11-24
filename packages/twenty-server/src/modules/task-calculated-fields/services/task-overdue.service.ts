import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';

import { isDefined } from 'twenty-shared/utils';
import { DataSource } from 'typeorm';

import { getWorkspaceSchemaName } from 'src/engine/workspace-datasource/utils/get-workspace-schema-name.util';

export type NewlyOverdueTask = {
  id: string;
  title: string | null;
  dueAt: string | null;
  assigneeId: string | null;
};

type OverdueChangeRow = NewlyOverdueTask & {
  isOverdue: boolean;
  deletedAt: string | null;
};

const IS_OVERDUE_EXPRESSION = `("dueAt" IS NOT NULL AND "dueAt" < now() AND "status" IS DISTINCT FROM 'DONE')`;

@Injectable()
export class TaskOverdueService {
  constructor(
    @InjectDataSource()
    private readonly coreDataSource: DataSource,
  ) {}

  // Writes only the rows whose value changes; returns the tasks that just became overdue
  async recomputeOverdue(workspaceId: string): Promise<NewlyOverdueTask[]> {
    const schema = `"${getWorkspaceSchemaName(workspaceId)}"`;

    const [rows] = await this.coreDataSource.query<
      [OverdueChangeRow[], number]
    >(
      `UPDATE ${schema}."task"
       SET "isOverdue" = ${IS_OVERDUE_EXPRESSION}
       WHERE "isOverdue" IS DISTINCT FROM ${IS_OVERDUE_EXPRESSION}
       RETURNING id, title, "dueAt", "assigneeId", "isOverdue", "deletedAt"`,
    );

    return rows
      .filter((row) => row.isOverdue && !isDefined(row.deletedAt))
      .map(({ id, title, dueAt, assigneeId }) => ({
        id,
        title,
        dueAt,
        assigneeId,
      }));
  }
}
