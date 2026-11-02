import {
  areSyncedFieldOptionsEqual,
  buildSyncedFieldOptions,
  type SyncedFieldOption,
} from 'src/modules/field-sync/utils/build-synced-field-options.util';

const buildOption = (
  id: string,
  value: string,
  overrides: Partial<SyncedFieldOption> = {},
): SyncedFieldOption => ({
  id,
  value,
  label: value,
  color: 'blue',
  position: 0,
  ...overrides,
});

describe('buildSyncedFieldOptions', () => {
  it('keeps target ids for unchanged values and copies label, color and position', () => {
    const [option] = buildSyncedFieldOptions({
      sourceOptions: [
        buildOption('source-uae', 'UAE', {
          label: 'Emirates',
          color: 'red',
          position: 3,
        }),
      ],
      targetOptions: [buildOption('target-uae', 'UAE')],
    });

    expect(option).toEqual({
      id: 'target-uae',
      value: 'UAE',
      label: 'Emirates',
      color: 'red',
      position: 3,
    });
  });

  it('keeps the target id through a rename so stored values migrate', () => {
    const [option] = buildSyncedFieldOptions({
      sourceOptions: [buildOption('source-1', 'EMIRATES')],
      sourceOptionsBefore: [buildOption('source-1', 'UAE')],
      targetOptions: [buildOption('target-1', 'UAE')],
    });

    expect(option.id).toBe('target-1');
    expect(option.value).toBe('EMIRATES');
  });

  it('follows two options that swap values', () => {
    const options = buildSyncedFieldOptions({
      sourceOptions: [
        buildOption('source-1', 'B'),
        buildOption('source-2', 'A'),
      ],
      sourceOptionsBefore: [
        buildOption('source-1', 'A'),
        buildOption('source-2', 'B'),
      ],
      targetOptions: [
        buildOption('target-a', 'A'),
        buildOption('target-b', 'B'),
      ],
    });

    expect(options.map(({ id, value }) => [id, value])).toEqual([
      ['target-a', 'B'],
      ['target-b', 'A'],
    ]);
  });

  it('does not reuse an id already claimed by a rename', () => {
    const options = buildSyncedFieldOptions({
      sourceOptions: [
        buildOption('source-new', 'A'),
        buildOption('source-1', 'C'),
      ],
      sourceOptionsBefore: [buildOption('source-1', 'A')],
      targetOptions: [buildOption('target-a', 'A')],
    });

    expect(options[1].id).toBe('target-a');
    expect(options[0].id).not.toBe('target-a');
  });

  it('adds new options and drops removed ones', () => {
    const options = buildSyncedFieldOptions({
      sourceOptions: [buildOption('source-new', 'NEW')],
      targetOptions: [buildOption('target-old', 'OLD')],
    });

    expect(options).toHaveLength(1);
    expect(options[0].value).toBe('NEW');
    expect(options[0].id).not.toBe('target-old');
  });
});

describe('areSyncedFieldOptionsEqual', () => {
  it('ignores properties that are not synced', () => {
    expect(
      areSyncedFieldOptionsEqual(
        [buildOption('id', 'A')],
        [{ ...buildOption('id', 'A'), extra: true } as SyncedFieldOption],
      ),
    ).toBe(true);
  });

  it('detects a changed label', () => {
    expect(
      areSyncedFieldOptionsEqual(
        [buildOption('id', 'A')],
        [buildOption('id', 'A', { label: 'Changed' })],
      ),
    ).toBe(false);
  });
});
