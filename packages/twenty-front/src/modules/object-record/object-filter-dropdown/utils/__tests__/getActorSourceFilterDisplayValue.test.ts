import { ACTOR_SOURCE_FILTER_OPTIONS } from '@/object-record/object-filter-dropdown/constants/ActorSourceFilterOptions';
import { getActorSourceFilterDisplayValue } from '@/object-record/object-filter-dropdown/utils/getActorSourceFilterDisplayValue';
import { getActorSourceMultiSelectOptions } from '@/object-record/object-filter-dropdown/utils/getActorSourceMultiSelectOptions';
import { i18n } from '@lingui/core';
import { SOURCE_LOCALE } from 'twenty-shared/translations';
import { FieldActorSource } from 'twenty-shared/types';

describe('getActorSourceFilterDisplayValue', () => {
  afterEach(() => {
    i18n.activate(SOURCE_LOCALE);
  });

  it('should join up to three source names', () => {
    expect(getActorSourceFilterDisplayValue(['User', 'Api', 'Email'])).toBe(
      'User, Api, Email',
    );
  });

  it('should count the sources when there are more than three', () => {
    expect(
      getActorSourceFilterDisplayValue(['User', 'Api', 'Email', 'System']),
    ).toBe('4 source types');
  });

  it('should translate the option names but keep the English names to save', () => {
    const manualOption = ACTOR_SOURCE_FILTER_OPTIONS.find(
      (actorSourceFilterOption) => actorSourceFilterOption.id === 'MANUAL',
    );

    i18n.load('fr-FR', { [manualOption?.label.id ?? '']: 'Manuel' });
    i18n.activate('fr-FR');

    expect(
      getActorSourceMultiSelectOptions(['MANUAL']).find(
        (option) => option.id === 'MANUAL',
      ),
    ).toMatchObject({ name: 'Manuel', isSelected: true });
    expect(manualOption?.name).toBe('Manual');
  });

  it('should label the Forms and Document app sources', () => {
    const options = getActorSourceMultiSelectOptions(['FORMS']);

    expect(options.find((option) => option.id === 'FORMS')).toMatchObject({
      name: 'Forms',
      isSelected: true,
    });
    expect(
      options.find((option) => option.id === 'DOCUMENT_APP'),
    ).toMatchObject({ name: 'Document app', isSelected: false });
  });

  it('should offer every source from the shared actor source list', () => {
    expect(
      ACTOR_SOURCE_FILTER_OPTIONS.map(
        (actorSourceFilterOption) => actorSourceFilterOption.id,
      ).sort(),
    ).toEqual(Object.values(FieldActorSource).sort());
  });

  it('should label every source', () => {
    expect(
      getActorSourceMultiSelectOptions([]).map((option) => option.name),
    ).toEqual([
      'Manual',
      'Import',
      'API',
      'Email',
      'Calendar',
      'Workflow',
      'System',
      'Agent',
      'Webhook',
      'Application',
      'Forms',
      'Document app',
    ]);
  });
});
