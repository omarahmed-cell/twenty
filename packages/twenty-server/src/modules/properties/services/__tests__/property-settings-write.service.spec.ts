import { In } from 'typeorm';

import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { type WorkspaceOrmManager } from 'src/engine/twenty-orm/workspace-orm.manager';
import { type PipelineAccessService } from 'src/modules/pipeline/services/pipeline-access.service';
import { type PropertyLogicConfigService } from 'src/modules/properties/services/property-logic-config.service';
import {
  getDeletedRecordIds,
  PropertySettingsWriteService,
} from 'src/modules/properties/services/property-settings-write.service';

const USER_CONTEXT = {
  type: 'user',
  workspace: { id: 'workspace-id' },
} as unknown as WorkspaceAuthContext;

const buildService = ({ isAdmin = true }: { isAdmin?: boolean } = {}) => {
  const deleteMemberships = jest.fn().mockResolvedValue(undefined);
  const invalidate = jest.fn();

  return {
    service: new PropertySettingsWriteService(
      {
        executeInWorkspaceContext: (run: () => Promise<unknown>) => run(),
        getRepository: () => ({ delete: deleteMemberships }),
      } as unknown as WorkspaceOrmManager,
      {
        canEditPipelines: jest.fn().mockResolvedValue(isAdmin),
      } as unknown as PipelineAccessService,
      { invalidate } as unknown as PropertyLogicConfigService,
    ),
    deleteMemberships,
    invalidate,
  };
};

describe('PropertySettingsWriteService', () => {
  it('lets Admins change groups and rules', async () => {
    const { service } = buildService();

    await expect(
      service.assertCanWrite(USER_CONTEXT, 'propertyGroup'),
    ).resolves.toBeUndefined();
  });

  it('keeps groups and rules read-only for other roles', async () => {
    const { service } = buildService({ isAdmin: false });

    await expect(
      service.assertCanWrite(USER_CONTEXT, 'propertyLogicRule'),
    ).rejects.toThrow();
  });

  it('lets only the server record who created a property', async () => {
    const { service } = buildService();

    await expect(
      service.assertCanWrite(USER_CONTEXT, 'propertyCreation'),
    ).rejects.toThrow();
    await expect(
      service.assertCanWrite(
        {
          type: 'system',
          workspace: { id: 'workspace-id' },
        } as unknown as WorkspaceAuthContext,
        'propertyCreation',
      ),
    ).resolves.toBeUndefined();
  });

  it('frees the properties of a deleted group instead of deleting them', async () => {
    const { service, deleteMemberships } = buildService();

    await service.releaseGroupMembers({
      workspaceId: 'workspace-id',
      propertyGroupIds: getDeletedRecordIds({ id: 'dms-group' }),
    });

    expect(deleteMemberships).toHaveBeenCalledWith({
      propertyGroupId: In(['dms-group']),
    });
  });

  it('moves a property out of its previous group when it joins another', async () => {
    const { service, deleteMemberships } = buildService();

    await service.releaseFieldsFromOtherGroups({
      workspaceId: 'workspace-id',
      memberships: [{ fieldMetadataId: 'uses-aggregators' }],
    });

    expect(deleteMemberships).toHaveBeenCalledWith({
      fieldMetadataId: In(['uses-aggregators']),
    });
  });

  it('reads deleted ids from one record or many', () => {
    expect(getDeletedRecordIds([{ id: 'a' }, { id: 'b' }, null])).toEqual([
      'a',
      'b',
    ]);
  });
});
