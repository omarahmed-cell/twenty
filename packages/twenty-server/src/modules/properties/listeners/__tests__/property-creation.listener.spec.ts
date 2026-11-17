import { type WorkspaceOrmManager } from 'src/engine/twenty-orm/workspace-orm.manager';
import { PropertyCreationListener } from 'src/modules/properties/listeners/property-creation.listener';
import { type PropertyLogicConfigService } from 'src/modules/properties/services/property-logic-config.service';

const FIELD = { id: 'field-id', objectMetadataId: 'company-object-id' };

const buildListener = () => {
  const insert = jest.fn().mockResolvedValue(undefined);
  const findOne = jest.fn().mockResolvedValue({
    id: 'member-id',
    name: { firstName: 'Menna', lastName: 'Admin' },
  });

  return {
    listener: new PropertyCreationListener(
      {
        executeInWorkspaceContext: (run: () => Promise<unknown>) => run(),
        getRepository: () => ({ insert, findOne }),
      } as unknown as WorkspaceOrmManager,
      { invalidate: jest.fn() } as unknown as PropertyLogicConfigService,
    ),
    insert,
  };
};

const buildBatch = (actor: { userId?: string; apiKeyId?: string }) =>
  ({
    name: 'metadata.fieldMetadata.created',
    workspaceId: 'workspace-id',
    metadataName: 'fieldMetadata',
    type: 'created',
    events: [{ properties: { after: FIELD } }],
    ...actor,
  }) as never;

describe('PropertyCreationListener', () => {
  it('records the workspace member who created a field', async () => {
    const { listener, insert } = buildListener();

    await listener.handleFieldCreated(buildBatch({ userId: 'user-id' }));

    expect(insert).toHaveBeenCalledWith([
      {
        fieldMetadataId: 'field-id',
        objectMetadataId: 'company-object-id',
        createdBy: expect.objectContaining({
          source: 'MANUAL',
          workspaceMemberId: 'member-id',
          name: 'Menna Admin',
        }),
      },
    ]);
  });

  it('records API for a field created with an API key', async () => {
    const { listener, insert } = buildListener();

    await listener.handleFieldCreated(buildBatch({ apiKeyId: 'key-id' }));

    expect(insert).toHaveBeenCalledWith([
      expect.objectContaining({
        createdBy: expect.objectContaining({ source: 'API', name: 'API' }),
      }),
    ]);
  });

  it('records nothing for fields the system creates', async () => {
    const { listener, insert } = buildListener();

    await listener.handleFieldCreated(buildBatch({}));

    expect(insert).not.toHaveBeenCalled();
  });
});
