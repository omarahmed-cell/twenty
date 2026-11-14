import { type WorkspacePreQueryHookInstance } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/interfaces/workspace-query-hook.interface';
import { type CreateOneResolverArgs } from 'src/engine/api/graphql/workspace-resolver-builder/interfaces/workspace-resolvers-builder.interface';

import { WorkspaceQueryHook } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/decorators/workspace-query-hook.decorator';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { CompanyHierarchyValidationService } from 'src/modules/company-hierarchy/services/company-hierarchy-validation.service';
import { getCompanyParentAssignment } from 'src/modules/company-hierarchy/utils/get-company-parent-assignment.util';
import { type CompanyWorkspaceEntity } from 'src/modules/company/standard-objects/company.workspace-entity';

@WorkspaceQueryHook(`company.createOne`)
export class CompanyCreateOnePreQueryHook implements WorkspacePreQueryHookInstance {
  constructor(
    private readonly companyHierarchyValidationService: CompanyHierarchyValidationService,
  ) {}

  async execute(
    authContext: WorkspaceAuthContext,
    _objectName: string,
    payload: CreateOneResolverArgs<Partial<CompanyWorkspaceEntity>>,
  ): Promise<CreateOneResolverArgs<Partial<CompanyWorkspaceEntity>>> {
    const assignment = getCompanyParentAssignment(payload.data);

    await this.companyHierarchyValidationService.assertValidParentAssignments({
      workspaceId: authContext.workspace.id,
      assignments: assignment === null ? [] : [assignment],
    });

    return payload;
  }
}
