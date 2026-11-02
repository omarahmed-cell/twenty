import { FieldMetadataType, type FieldSyncPolicy } from 'twenty-shared/types';

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
      find: async ({ order }: { order?: { createdAt?: 'ASC' | 'DESC' } }) => {
        if (objectNameSingular === config.targetObjectNameSingular) {
          return targets;
        }

        const direction = order?.createdAt === 'DESC' ? -1 : 1;

        return [...sources].sort(
          (left, right) =>
            direction *
            String(left.createdAt).localeCompare(String(right.createdAt)),
        );
      },
      update,
    }),
  };

  const service = new FieldSyncService(
    workspaceOrmManager as never,
    {} as never,
    {} as never,
  );

  jest.spyOn(service, 'getConfigs').mockResolvedValue([config]);

  return { service, update };
};

const buildConfig = (
  sourceFieldType: FieldMetadataType,
): ResolvedFieldSyncConfig => ({
  cardinality: 'TO_ONE',
  targetFieldId: 'target-field',
  targetFieldName: 'synced',
  targetObjectNameSingular: 'opportunity',
  joinColumnName: 'companyId',
  relationFieldId: 'relation-field',
  sourceObjectNameSingular: 'company',
  sourceFieldId: 'source-field',
  sourceFieldName: 'value',
  sourceFieldType,
});

const buildToManyConfig = (
  policy: FieldSyncPolicy,
): ResolvedFieldSyncConfig => ({
  cardinality: 'TO_MANY',
  policy,
  sourceJoinColumnName: 'dealId',
  targetFieldId: 'target-field',
  targetFieldName: 'synced',
  targetObjectNameSingular: 'opportunity',
  relationFieldId: 'relation-field',
  sourceObjectNameSingular: 'task',
  sourceFieldId: 'source-field',
  sourceFieldName: 'value',
  sourceFieldType: FieldMetadataType.TEXT,
});

const toManySources = [
  { id: 'middle', dealId: 'deal', createdAt: '2026-02-01', value: 'middle' },
  { id: 'newest', dealId: 'deal', createdAt: '2026-03-01', value: 'newest' },
  { id: 'oldest', dealId: 'deal', createdAt: '2026-01-01', value: 'oldest' },
];

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

  it.each([
    { policy: 'FIRST_CREATED' as const, expected: 'oldest' },
    { policy: 'MOST_RECENTLY_CREATED' as const, expected: 'newest' },
  ])(
    'picks the $expected record for a to-many $policy sync',
    async ({ policy, expected }) => {
      const { service, update } = buildService({
        config: buildToManyConfig(policy),
        targets: [{ id: 'deal', synced: '' }],
        sources: toManySources,
      });

      await sync(service);

      expect(update.mock.calls[0][1]).toEqual({ synced: expected });
    },
  );

  it('clears a to-many target with no associated records left', async () => {
    const { service, update } = buildService({
      config: buildToManyConfig('FIRST_CREATED'),
      targets: [{ id: 'deal', synced: 'oldest' }],
      sources: [],
    });

    await sync(service);

    expect(update.mock.calls[0][1]).toEqual({ synced: null });
  });

  it('does not rewrite a to-many target that already matches', async () => {
    const { service, update } = buildService({
      config: buildToManyConfig('MOST_RECENTLY_CREATED'),
      targets: [{ id: 'deal', synced: 'newest' }],
      sources: toManySources,
    });

    await sync(service);

    expect(update).not.toHaveBeenCalled();
  });
});
