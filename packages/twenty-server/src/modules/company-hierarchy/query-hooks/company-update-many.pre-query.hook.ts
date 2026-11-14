import { msg } from '@lingui/core/macro';
import { isNonEmptyString } from '@sniptt/guards';

import { type WorkspacePreQueryHookInstance } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/interfaces/workspace-query-hook.interface';
import { type UpdateManyResolverArgs } from 'src/engine/api/graphql/workspace-resolver-builder/interfaces/workspace-resolvers-builder.interface';

import {
  CommonQueryRunnerException,
  CommonQueryRunnerExceptionCode,
} from 'src/engine/api/common/common-query-runners/errors/common-query-runner.exception';
import { WorkspaceQueryHook } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/decorators/workspace-query-hook.decorator';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { type CompanyWorkspaceEntity } from 'src/modules/company/standard-objects/company.workspace-entity';

// A filtered bulk write can't be checked for loops record by record, so it may only clear parents
@WorkspaceQueryHook(`company.updateMany`)
export class CompanyUpdateManyPreQueryHook implements WorkspacePreQueryHookInstance {
  async execute(
    _authContext: WorkspaceAuthContext,
    _objectName: string,
    payload: UpdateManyResolverArgs<Partial<CompanyWorkspaceEntity>>,
  ): Promise<UpdateManyResolverArgs<Partial<CompanyWorkspaceEntity>>> {
    if (isNonEmptyString(payload.data.parentCompanyId)) {
      throw new CommonQueryRunnerException(
        'Bulk updates cannot set a parent company',
        CommonQueryRunnerExceptionCode.BAD_REQUEST,
        {
          userFriendlyMessage: msg`Set the parent company one company at a time.`,
        },
      );
    }

    return payload;
  }
}
