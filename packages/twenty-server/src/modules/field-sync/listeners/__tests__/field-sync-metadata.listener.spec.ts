import { FieldMetadataType } from 'twenty-shared/types';

import { FieldSyncMetadataListener } from 'src/modules/field-sync/listeners/field-sync-metadata.listener';
import { type ResolvedFieldSyncConfig } from 'src/modules/field-sync/types/resolved-field-sync-config.type';

const CONFIG: ResolvedFieldSyncConfig = {
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

const SYNC_SETTINGS = {
  sync: {
    relationFieldMetadataId: 'relation-field',
    sourceFieldMetadataId: 'source-field',
  },
};

const OPTIONS = [{ id: 'option', value: 'UAE' }];

const buildField = (overrides: Record<string, unknown>) => ({
  id: 'other-field',
  type: FieldMetadataType.MULTI_SELECT,
  isActive: true,
  settings: null,
  options: OPTIONS,
  label: 'Label',
  ...overrides,
});

const setup = () => {
  const add = jest.fn();

  const listener = new FieldSyncMetadataListener(
    { getConfigs: async () => [CONFIG] } as never,
    { add } as never,
  );

  const handleUpdate = (
    before: Record<string, unknown>,
    after: Record<string, unknown>,
  ) =>
    listener.handleFieldUpdated({
      workspaceId: 'workspace',
      events: [
        {
          type: 'updated',
          properties: { before: buildField(before), after: buildField(after) },
        },
      ],
    } as never);

  return {
    listener,
    handleUpdate,
    backfills: () => add.mock.calls.map(([, data]) => data),
  };
};

const backfillOf = (extra: Record<string, unknown> = {}) => ({
  type: 'BACKFILL',
  workspaceId: 'workspace',
  targetFieldId: 'target-field',
  ...extra,
});

describe('FieldSyncMetadataListener', () => {
  it('backfills a newly created sync field', async () => {
    const { listener, backfills } = setup();

    await listener.handleFieldCreated({
      workspaceId: 'workspace',
      events: [
        {
          type: 'created',
          properties: {
            after: buildField({ id: 'target-field', settings: SYNC_SETTINGS }),
          },
        },
      ],
    } as never);

    expect(backfills()).toEqual([backfillOf()]);
  });

  it('backfills when the sync config changes', async () => {
    const { handleUpdate, backfills } = setup();

    await handleUpdate(
      { id: 'target-field', settings: SYNC_SETTINGS },
      {
        id: 'target-field',
        settings: {
          sync: { ...SYNC_SETTINGS.sync, sourceFieldMetadataId: 'another' },
        },
      },
    );

    expect(backfills()).toEqual([backfillOf()]);
  });

  it('ignores a label edit on a sync field', async () => {
    const { handleUpdate, backfills } = setup();

    await handleUpdate(
      { id: 'target-field', settings: SYNC_SETTINGS },
      { id: 'target-field', settings: SYNC_SETTINGS, label: 'New label' },
    );

    expect(backfills()).toEqual([]);
  });

  it('passes the previous options when source options change', async () => {
    const { handleUpdate, backfills } = setup();

    await handleUpdate(
      { id: 'source-field' },
      { id: 'source-field', options: [{ id: 'option', value: 'EMIRATES' }] },
    );

    expect(backfills()).toEqual([backfillOf({ sourceOptionsBefore: OPTIONS })]);
  });

  it("does not backfill when the sync's own options are rewritten", async () => {
    const { handleUpdate, backfills } = setup();

    await handleUpdate(
      { id: 'target-field', settings: SYNC_SETTINGS },
      {
        id: 'target-field',
        settings: SYNC_SETTINGS,
        options: [{ id: 'option', value: 'EMIRATES' }],
      },
    );

    expect(backfills()).toEqual([]);
  });

  it.each(['source-field', 'relation-field'])(
    'catches up when %s is reactivated',
    async (id) => {
      const { handleUpdate, backfills } = setup();

      await handleUpdate({ id, isActive: false }, { id, isActive: true });

      expect(backfills()).toEqual([backfillOf()]);
    },
  );

  it.each(['source-field', 'relation-field'])(
    'catches up when %s is renamed',
    async (id) => {
      const { handleUpdate, backfills } = setup();

      await handleUpdate({ id, name: 'before' }, { id, name: 'after' });

      expect(backfills()).toEqual([backfillOf()]);
    },
  );

  it('catches up when the sync field itself is renamed', async () => {
    const { handleUpdate, backfills } = setup();

    await handleUpdate(
      { id: 'target-field', name: 'before', settings: SYNC_SETTINGS },
      { id: 'target-field', name: 'after', settings: SYNC_SETTINGS },
    );

    expect(backfills()).toEqual([backfillOf()]);
  });

  it('does nothing when a source is deactivated', async () => {
    const { handleUpdate, backfills } = setup();

    await handleUpdate(
      { id: 'source-field', isActive: true },
      { id: 'source-field', isActive: false },
    );

    expect(backfills()).toEqual([]);
  });
});
