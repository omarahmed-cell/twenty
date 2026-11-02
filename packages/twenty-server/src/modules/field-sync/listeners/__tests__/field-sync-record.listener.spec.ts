import { FieldMetadataType } from 'twenty-shared/types';

import { FieldSyncRecordListener } from 'src/modules/field-sync/listeners/field-sync-record.listener';
import { type ResolvedFieldSyncConfig } from 'src/modules/field-sync/types/resolved-field-sync-config.type';

const TO_MANY_CONFIG: ResolvedFieldSyncConfig = {
  cardinality: 'TO_MANY',
  policy: 'MOST_RECENTLY_CREATED',
  sourceJoinColumnName: 'companyId',
  targetFieldId: 'target-field',
  targetFieldName: 'latestStage',
  targetObjectNameSingular: 'company',
  relationFieldId: 'relation-field',
  sourceObjectNameSingular: 'opportunity',
  sourceFieldId: 'source-field',
  sourceFieldName: 'stage',
  sourceFieldType: FieldMetadataType.SELECT,
};

const TO_ONE_CONFIG: ResolvedFieldSyncConfig = {
  cardinality: 'TO_ONE',
  joinColumnName: 'companyId',
  targetFieldId: 'target-field',
  targetFieldName: 'operatesIn',
  targetObjectNameSingular: 'opportunity',
  relationFieldId: 'relation-field',
  sourceObjectNameSingular: 'company',
  sourceFieldId: 'source-field',
  sourceFieldName: 'operatesIn',
  sourceFieldType: FieldMetadataType.MULTI_SELECT,
};

const setup = (config: ResolvedFieldSyncConfig) => {
  const add = jest.fn();

  const listener = new FieldSyncRecordListener(
    { getConfigs: async () => [config] } as never,
    { add } as never,
  );

  const enqueuedTasks = () => add.mock.calls.map(([, data]) => data);

  return { listener, enqueuedTasks };
};

const buildPayload = (
  objectNameSingular: string,
  properties: Record<string, unknown>,
) =>
  ({
    workspaceId: 'workspace',
    objectMetadata: { nameSingular: objectNameSingular },
    events: [{ recordId: 'record', properties }],
  }) as never;

const expectedTargets = (targetRecordIds: string[]) =>
  expect.objectContaining({ type: 'TARGETS', targetRecordIds });

describe('FieldSyncRecordListener', () => {
  describe('to-many sync, on source events', () => {
    it('recomputes the linked target when a source is created', async () => {
      const { listener, enqueuedTasks } = setup(TO_MANY_CONFIG);

      await listener.handleCreated(
        buildPayload('opportunity', { after: { companyId: 'company' } }),
      );

      expect(enqueuedTasks()).toEqual([expectedTargets(['company'])]);
    });

    it('recomputes both targets when a source moves', async () => {
      const { listener, enqueuedTasks } = setup(TO_MANY_CONFIG);

      await listener.handleUpdated(
        buildPayload('opportunity', {
          before: { companyId: 'old-company' },
          after: { companyId: 'new-company' },
          updatedFields: ['company', 'companyId'],
        }),
      );

      expect(enqueuedTasks()).toEqual([
        expectedTargets(['old-company', 'new-company']),
      ]);
    });

    it('recomputes the target when the synced property changes', async () => {
      const { listener, enqueuedTasks } = setup(TO_MANY_CONFIG);

      await listener.handleUpdated(
        buildPayload('opportunity', {
          before: { companyId: 'company' },
          after: { companyId: 'company' },
          updatedFields: ['stage'],
        }),
      );

      expect(enqueuedTasks()).toEqual([expectedTargets(['company'])]);
    });

    it('ignores updates to other properties', async () => {
      const { listener, enqueuedTasks } = setup(TO_MANY_CONFIG);

      await listener.handleUpdated(
        buildPayload('opportunity', {
          before: { companyId: 'company' },
          after: { companyId: 'company' },
          updatedFields: ['name'],
        }),
      );

      expect(enqueuedTasks()).toEqual([]);
    });

    it.each(['handleDeleted', 'handleDestroyed'] as const)(
      'recomputes the target on %s',
      async (handler) => {
        const { listener, enqueuedTasks } = setup(TO_MANY_CONFIG);

        await listener[handler](
          buildPayload('opportunity', { before: { companyId: 'company' } }),
        );

        expect(enqueuedTasks()).toEqual([expectedTargets(['company'])]);
      },
    );

    it('skips sources with no linked target', async () => {
      const { listener, enqueuedTasks } = setup(TO_MANY_CONFIG);

      await listener.handleCreated(
        buildPayload('opportunity', { after: { companyId: null } }),
      );

      expect(enqueuedTasks()).toEqual([]);
    });
  });

  it("does not react to a to-many sync's own write", async () => {
    const { listener, enqueuedTasks } = setup(TO_MANY_CONFIG);

    await listener.handleUpdated(
      buildPayload('company', { updatedFields: ['latestStage'] }),
    );

    expect(enqueuedTasks()).toEqual([]);
  });

  it("does not react to a to-one sync's own write", async () => {
    const { listener, enqueuedTasks } = setup(TO_ONE_CONFIG);

    await listener.handleUpdated(
      buildPayload('opportunity', { updatedFields: ['operatesIn'] }),
    );

    expect(enqueuedTasks()).toEqual([]);
  });

  // The ORM emits UPSERTED on every write, even without a diff, which once caused an endless job loop.
  it('has no handler for UPSERTED events', () => {
    expect(
      Object.getOwnPropertyNames(FieldSyncRecordListener.prototype),
    ).not.toContain('handleUpserted');
  });
});
