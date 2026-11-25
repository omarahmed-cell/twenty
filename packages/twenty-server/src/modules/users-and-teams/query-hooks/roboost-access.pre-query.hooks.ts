import { ForbiddenException, Injectable } from '@nestjs/common';

import { isDefined } from 'twenty-shared/utils';

import { type WorkspacePreQueryHookInstance } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/interfaces/workspace-query-hook.interface';
import { type CreateManyResolverArgs } from 'src/engine/api/graphql/workspace-resolver-builder/interfaces/workspace-resolvers-builder.interface';

import { WorkspaceQueryHook } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/decorators/workspace-query-hook.decorator';
import { isUserAuthContext } from 'src/engine/core-modules/auth/guards/is-user-auth-context.guard';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { RoboostRecordVisibilityService } from 'src/engine/metadata-modules/role/services/roboost-record-visibility.service';
import { RoboostUsersService } from 'src/modules/users-and-teams/services/roboost-users.service';

const TEAM_OBJECT_NAMES = ['team', 'teamMembership'];

// A delete that names one record is a normal delete; anything wider is a bulk delete
const isSingleRecordFilter = (filter: unknown): boolean => {
  const idFilter = (filter as { id?: { eq?: unknown; in?: unknown[] } } | null)
    ?.id;

  if (!isDefined(idFilter)) {
    return false;
  }

  return (
    isDefined(idFilter.eq) ||
    (Array.isArray(idFilter.in) && idFilter.in.length <= 1)
  );
};

@Injectable()
export class RoboostAccessHookService {
  constructor(
    private readonly roboostRecordVisibilityService: RoboostRecordVisibilityService,
    private readonly roboostUsersService: RoboostUsersService,
  ) {}

  async assertToggle(
    authContext: WorkspaceAuthContext,
    toggleKey: string,
    message: string,
  ) {
    if (
      isUserAuthContext(authContext) &&
      !(await this.roboostRecordVisibilityService.hasToggle(
        authContext.workspace.id,
        authContext.workspaceMemberId,
        toggleKey,
      ))
    ) {
      throw new ForbiddenException(message);
    }
  }

  // Teams are managed only by admins in Settings > Users & Teams; record view cards need Customize cards
  async assertTeamWrite(authContext: WorkspaceAuthContext, objectName: string) {
    if (
      TEAM_OBJECT_NAMES.includes(objectName) &&
      isUserAuthContext(authContext)
    ) {
      await this.roboostUsersService.assertAdmin(
        authContext.workspace.id,
        authContext.workspaceMemberId,
      );
    }

    if (objectName === 'recordLayout') {
      await this.assertToggle(
        authContext,
        'customizeCards',
        'Customize cards is turned off for this user',
      );
    }
  }

  async assertBulkDelete(authContext: WorkspaceAuthContext, filter: unknown) {
    if (!isSingleRecordFilter(filter)) {
      await this.assertToggle(
        authContext,
        'bulkDelete',
        'Bulk delete is turned off for this user',
      );
    }
  }
}

@Injectable()
abstract class RoboostTeamWriteHook implements WorkspacePreQueryHookInstance {
  constructor(protected readonly hookService: RoboostAccessHookService) {}

  async execute<TPayload>(
    authContext: WorkspaceAuthContext,
    objectName: string,
    payload: TPayload,
  ): Promise<TPayload> {
    await this.hookService.assertTeamWrite(authContext, objectName);

    return payload;
  }
}

@WorkspaceQueryHook(`*.createOne`)
export class RoboostCreateOneAccessHook extends RoboostTeamWriteHook {}

@WorkspaceQueryHook(`*.updateOne`)
export class RoboostUpdateOneAccessHook extends RoboostTeamWriteHook {}

@WorkspaceQueryHook(`*.updateMany`)
export class RoboostUpdateManyAccessHook extends RoboostTeamWriteHook {}

@WorkspaceQueryHook(`*.deleteOne`)
export class RoboostDeleteOneAccessHook extends RoboostTeamWriteHook {}

@WorkspaceQueryHook(`*.destroyOne`)
export class RoboostDestroyOneAccessHook extends RoboostTeamWriteHook {}

@WorkspaceQueryHook(`*.deleteMany`)
export class RoboostDeleteManyAccessHook extends RoboostTeamWriteHook {
  override async execute<TPayload>(
    authContext: WorkspaceAuthContext,
    objectName: string,
    payload: TPayload,
  ): Promise<TPayload> {
    await this.hookService.assertBulkDelete(
      authContext,
      (payload as { filter?: unknown }).filter,
    );

    return super.execute(authContext, objectName, payload);
  }
}

@WorkspaceQueryHook(`*.destroyMany`)
export class RoboostDestroyManyAccessHook extends RoboostTeamWriteHook {
  override async execute<TPayload>(
    authContext: WorkspaceAuthContext,
    objectName: string,
    payload: TPayload,
  ): Promise<TPayload> {
    await this.hookService.assertBulkDelete(
      authContext,
      (payload as { filter?: unknown }).filter,
    );

    return super.execute(authContext, objectName, payload);
  }
}

// The import dialog creates records in batches with upsert; nothing else in the app does
@WorkspaceQueryHook(`*.createMany`)
export class RoboostCreateManyAccessHook extends RoboostTeamWriteHook {
  override async execute<TPayload>(
    authContext: WorkspaceAuthContext,
    objectName: string,
    payload: TPayload,
  ): Promise<TPayload> {
    const createManyPayload = payload as unknown as CreateManyResolverArgs;

    if (
      createManyPayload.upsert === true &&
      createManyPayload.data.length > 1
    ) {
      await this.hookService.assertToggle(
        authContext,
        'import',
        'Import is turned off for this user',
      );
    }

    return super.execute(authContext, objectName, payload);
  }
}

export const ROBOOST_ACCESS_QUERY_HOOKS = [
  RoboostCreateOneAccessHook,
  RoboostCreateManyAccessHook,
  RoboostUpdateOneAccessHook,
  RoboostUpdateManyAccessHook,
  RoboostDeleteOneAccessHook,
  RoboostDeleteManyAccessHook,
  RoboostDestroyOneAccessHook,
  RoboostDestroyManyAccessHook,
];
