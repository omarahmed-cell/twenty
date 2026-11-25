import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';

import { ROBOOST_MERGE_OBJECT_NAMES } from 'twenty-shared/constants';
import { isDefined } from 'twenty-shared/utils';
import { DataSource } from 'typeorm';

import { type WorkspacePreQueryHookInstance } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/interfaces/workspace-query-hook.interface';

import { WorkspaceQueryHook } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/decorators/workspace-query-hook.decorator';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { getWorkspaceSchemaName } from 'src/engine/workspace-datasource/utils/get-workspace-schema-name.util';

// A merged record comes back only through Unmerge, never through a normal restore from the trash
@Injectable()
export class RoboostMergeRestoreGuardService {
  constructor(
    @InjectDataSource()
    private readonly coreDataSource: DataSource,
  ) {}

  async assertNotMerged(
    authContext: WorkspaceAuthContext,
    objectName: string,
    payload: { id?: string; filter?: { id?: { eq?: string; in?: string[] } } },
  ) {
    if (
      !(ROBOOST_MERGE_OBJECT_NAMES as readonly string[]).includes(objectName)
    ) {
      return;
    }

    const ids = [
      payload.id,
      payload.filter?.id?.eq,
      ...(payload.filter?.id?.in ?? []),
    ].filter((id): id is string => isDefined(id));

    if (ids.length === 0) {
      return;
    }

    const schema = `"${getWorkspaceSchemaName(authContext.workspace.id)}"`;
    const [{ exists }]: { exists: string | null }[] =
      await this.coreDataSource.query(
        `SELECT to_regclass($1)::text AS exists`,
        [`${schema}."roboostMergeLog"`],
      );

    if (!isDefined(exists)) {
      return;
    }

    const merged: unknown[] = await this.coreDataSource.query(
      `SELECT 1 FROM ${schema}."roboostMergeLog" WHERE "secondaryId" = ANY($1::uuid[]) AND status = 'MERGED' LIMIT 1`,
      [ids],
    );

    if (merged.length > 0) {
      throw new BadRequestException(
        'This record was merged into another one. An admin can bring it back with Unmerge from the merge history.',
      );
    }
  }
}

@WorkspaceQueryHook(`*.restoreOne`)
export class RoboostMergeRestoreOnePreQueryHook implements WorkspacePreQueryHookInstance {
  constructor(private readonly guard: RoboostMergeRestoreGuardService) {}

  async execute<TPayload>(
    authContext: WorkspaceAuthContext,
    objectName: string,
    payload: TPayload,
  ): Promise<TPayload> {
    await this.guard.assertNotMerged(authContext, objectName, payload as never);

    return payload;
  }
}

@WorkspaceQueryHook(`*.restoreMany`)
export class RoboostMergeRestoreManyPreQueryHook implements WorkspacePreQueryHookInstance {
  constructor(private readonly guard: RoboostMergeRestoreGuardService) {}

  async execute<TPayload>(
    authContext: WorkspaceAuthContext,
    objectName: string,
    payload: TPayload,
  ): Promise<TPayload> {
    await this.guard.assertNotMerged(authContext, objectName, payload as never);

    return payload;
  }
}
