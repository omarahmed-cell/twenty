import { i18n } from '@lingui/core';

import { getRoboostCreatedTitle } from '@/roboost-app/timeline/utils/getRoboostCreatedTitle';

beforeEach(() => {
  i18n.load('en', {});
  i18n.activate('en');
});

describe('getRoboostCreatedTitle', () => {
  it('names the import file for an imported record', () => {
    expect(
      getRoboostCreatedTitle({
        objectLabel: 'Contact',
        importSource: { isImport: true, importName: 'Leads March.csv' },
        i18n,
      }),
    ).toBe('Created from import "Leads March.csv"');
  });

  it('says an import when the file name is not known', () => {
    expect(
      getRoboostCreatedTitle({
        objectLabel: 'Contact',
        importSource: { isImport: true, importName: null },
        i18n,
      }),
    ).toBe('Created from an import');
  });

  it('keeps the usual line for records not created by an import', () => {
    expect(
      getRoboostCreatedTitle({
        objectLabel: 'Company',
        importSource: { isImport: false, importName: null },
        i18n,
      }),
    ).toBe('Company created');
    expect(
      getRoboostCreatedTitle({
        objectLabel: 'Company',
        importSource: null,
        i18n,
      }),
    ).toBe('Company created');
  });
});
