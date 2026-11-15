import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { getFieldFormulaSettings } from '@/settings/data-model/fields/forms/formula/utils/validateFormula';
import { getFieldSyncSettings } from '@/settings/data-model/fields/forms/sync/utils/getSyncFormValueFromField';
import { type SettingsFieldType } from '@/settings/data-model/types/SettingsFieldType';
import { getSettingsFieldTypeConfig } from '@/settings/data-model/utils/getSettingsFieldTypeConfig';
import { type MessageDescriptor } from '@lingui/core';
import { t } from '@lingui/core/macro';
import { isDefined } from 'twenty-shared/utils';

export type SettingsFieldDataTypeDisplay = {
  label: string;
  labelDetail?: string;
  iconName?: string;
};

// Display only: a calculated or synced field keeps its output type as its stored type.
export const getSettingsFieldDataTypeDisplay = (
  fieldMetadataItem: Pick<FieldMetadataItem, 'type' | 'settings'>,
  translate: (descriptor: MessageDescriptor) => string,
): SettingsFieldDataTypeDisplay => {
  const fieldTypeConfig = getSettingsFieldTypeConfig(
    fieldMetadataItem.type as SettingsFieldType,
  );
  const typeLabel = isDefined(fieldTypeConfig)
    ? translate(fieldTypeConfig.label)
    : '';
  const isPercentage =
    (fieldMetadataItem.settings as { type?: string } | null | undefined)
      ?.type === 'percentage';
  const outputTypeDetail = [typeLabel, ...(isPercentage ? ['%'] : [])]
    .filter((part) => part !== '')
    .join(' · ');

  if (isDefined(getFieldFormulaSettings(fieldMetadataItem))) {
    return {
      label: t`Calculation`,
      labelDetail: outputTypeDetail,
      iconName: 'IconCalculator',
    };
  }

  if (isDefined(getFieldSyncSettings(fieldMetadataItem))) {
    return {
      label: t`Sync`,
      labelDetail: outputTypeDetail,
      iconName: 'IconRefresh',
    };
  }

  return {
    label: typeLabel,
    labelDetail: isPercentage ? '%' : undefined,
  };
};

export const getSettingsFieldDataTypeText = ({
  label,
  labelDetail,
}: SettingsFieldDataTypeDisplay) =>
  [label, labelDetail].filter(isDefined).filter(Boolean).join(' · ');
