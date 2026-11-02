import { FieldMetadataType } from 'twenty-shared/types';

import { FieldSyncService } from 'src/modules/field-sync/services/field-sync.service';
import { type ResolvedFieldSyncConfig } from 'src/modules/field-sync/types/resolved-field-sync-config.type';

type TestRecord = Record<string, unknown> & { id: string };

const buildService = ({
  config,
  targets,
  sources,
}: {
  config: ResolvedFieldSyncConfig;
  targets: TestRecord[];
  sources: TestRecord[];
}) => {
  const update = jest.fn();

  const workspaceOrmManager = {
    executeInWorkspaceContext: (callback: () => Promise<void>) => callback(),
    getRepository: (objectNameSingular: string) => ({
      find: async () =>
        objectNameSingular === config.targetObjectNameSingular
          ? targets
          : sources,
      update,
    }),
  };

  const service = new FieldSyncService(
    workspaceOrmManager as never,
    {} as never,
  );

  jest.spyOn(service, 'getConfigs').mockResolvedValue([config]);

  return { service, update };
};

const buildConfig = (
  sourceFieldType: FieldMetadataType,
): ResolvedFieldSyncConfig => ({
  targetFieldId: 'target-field',
  targetFieldName: 'synced',
  targetObjectNameSingular: 'opportunity',
  joinColumnName: 'companyId',
  sourceObjectNameSingular: 'company',
  sourceFieldName: 'value',
  sourceFieldType,
});

const sync = (service: FieldSyncService) =>
  service.syncTargetRecords({
    workspaceId: 'workspace',
    targetFieldId: 'target-field',
    targetRecordIds: ['deal'],
  });

describe('FieldSyncService', () => {
  it.each([
    { sourceFieldType: FieldMetadataType.MULTI_SELECT, empty: [] },
    { sourceFieldType: FieldMetadataType.TEXT, empty: '' },
  ])(
    'does not rewrite a $sourceFieldType target the ORM reads back as empty',
    async ({ sourceFieldType, empty }) => {
      const { service, update } = buildService({
        config: buildConfig(sourceFieldType),
        targets: [{ id: 'deal', companyId: 'company', synced: empty }],
        sources: [{ id: 'company', value: empty }],
      });

      await sync(service);

      expect(update).not.toHaveBeenCalled();
    },
  );

  it('does not rewrite a target that already matches its source', async () => {
    const { service, update } = buildService({
      config: buildConfig(FieldMetadataType.MULTI_SELECT),
      targets: [{ id: 'deal', companyId: 'company', synced: ['UAE'] }],
      sources: [{ id: 'company', value: ['UAE'] }],
    });

    await sync(service);

    expect(update).not.toHaveBeenCalled();
  });

  it('writes when the source value differs', async () => {
    const { service, update } = buildService({
      config: buildConfig(FieldMetadataType.MULTI_SELECT),
      targets: [{ id: 'deal', companyId: 'company', synced: [] }],
      sources: [{ id: 'company', value: ['UAE'] }],
    });

    await sync(service);

    expect(update).toHaveBeenCalledTimes(1);
    expect(update.mock.calls[0][1]).toEqual({ synced: ['UAE'] });
  });

  it('clears a target whose source became empty', async () => {
    const { service, update } = buildService({
      config: buildConfig(FieldMetadataType.MULTI_SELECT),
      targets: [{ id: 'deal', companyId: 'company', synced: ['UAE'] }],
      sources: [{ id: 'company', value: [] }],
    });

    await sync(service);

    expect(update.mock.calls[0][1]).toEqual({ synced: null });
  });
});
