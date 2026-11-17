import {
  getSettingsFieldDataTypeDisplay,
  getSettingsFieldDataTypeText,
} from '@/settings/data-model/utils/getSettingsFieldDataTypeDisplay';
import { type MessageDescriptor } from '@lingui/core';
import {
  IllustrationIconCalculator,
  IllustrationIconSync,
} from 'twenty-ui/icon';
import { FieldMetadataType } from '~/generated-metadata/graphql';

const translate = (descriptor: MessageDescriptor) =>
  descriptor.message ?? descriptor.id;

describe('getSettingsFieldDataTypeDisplay', () => {
  it('labels a formula field as a Calculation with its output type', () => {
    const display = getSettingsFieldDataTypeDisplay(
      {
        name: 'ratio',
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
      Icon: IllustrationIconCalculator,
    });
    expect(getSettingsFieldDataTypeText(display)).toBe(
      'Calculation · Number · %',
    );
  });

  it('labels a synced field as Sync with its output type', () => {
    const display = getSettingsFieldDataTypeDisplay(
      {
        name: 'syncedName',
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
    expect(display.Icon).toBe(IllustrationIconSync);
  });

  it('labels fields the server fills as a Calculation', () => {
    expect(
      getSettingsFieldDataTypeText(
        getSettingsFieldDataTypeDisplay(
          {
            name: 'numberOfOpenDeals',
            type: FieldMetadataType.NUMBER,
            settings: null,
            isUIEditable: false,
          },
          translate,
        ),
      ),
    ).toBe('Calculation · Number');
    expect(
      getSettingsFieldDataTypeText(
        getSettingsFieldDataTypeDisplay(
          {
            name: 'dateEnteredSalesDiscoveryStage',
            type: FieldMetadataType.DATE_TIME,
            settings: null,
            isUIEditable: false,
          },
          translate,
        ),
      ),
    ).toBe('Calculation · Date and Time');
  });

  it('keeps the plain type for other fields', () => {
    expect(
      getSettingsFieldDataTypeDisplay(
        {
          name: 'employees',
          type: FieldMetadataType.NUMBER,
          settings: { type: 'number' },
        },
        translate,
      ),
    ).toEqual({ label: 'Number', labelDetail: undefined });
    expect(
      getSettingsFieldDataTypeText(
        getSettingsFieldDataTypeDisplay(
          {
            name: 'share',
            type: FieldMetadataType.NUMBER,
            settings: { type: 'percentage' },
          },
          translate,
        ),
      ),
    ).toBe('Number · %');
  });
});
