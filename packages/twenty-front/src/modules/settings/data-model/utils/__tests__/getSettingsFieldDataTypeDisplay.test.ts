import {
  getSettingsFieldDataTypeDisplay,
  getSettingsFieldDataTypeText,
} from '@/settings/data-model/utils/getSettingsFieldDataTypeDisplay';
import { type MessageDescriptor } from '@lingui/core';
import { FieldMetadataType } from '~/generated-metadata/graphql';

const translate = (descriptor: MessageDescriptor) =>
  descriptor.message ?? descriptor.id;

describe('getSettingsFieldDataTypeDisplay', () => {
  it('labels a formula field as a Calculation with its output type', () => {
    const display = getSettingsFieldDataTypeDisplay(
      {
        type: FieldMetadataType.NUMBER,
        settings: {
          type: 'percentage',
          formula: { expression: 'a / b' },
        },
      },
      translate,
    );

    expect(display).toEqual({
      label: 'Calculation',
      labelDetail: 'Number · %',
      iconName: 'IconCalculator',
    });
    expect(getSettingsFieldDataTypeText(display)).toBe(
      'Calculation · Number · %',
    );
  });

  it('labels a synced field as Sync with its output type', () => {
    const display = getSettingsFieldDataTypeDisplay(
      {
        type: FieldMetadataType.TEXT,
        settings: {
          sync: {
            relationFieldMetadataId: 'relation',
            sourceFieldMetadataId: 'source',
          },
        },
      },
      translate,
    );

    expect(getSettingsFieldDataTypeText(display)).toBe('Sync · Text');
    expect(display.iconName).toBe('IconRefresh');
  });

  it('keeps the plain type for other fields', () => {
    expect(
      getSettingsFieldDataTypeDisplay(
        { type: FieldMetadataType.NUMBER, settings: { type: 'number' } },
        translate,
      ),
    ).toEqual({ label: 'Number', labelDetail: undefined });
    expect(
      getSettingsFieldDataTypeText(
        getSettingsFieldDataTypeDisplay(
          { type: FieldMetadataType.NUMBER, settings: { type: 'percentage' } },
          translate,
        ),
      ),
    ).toBe('Number · %');
  });
});
