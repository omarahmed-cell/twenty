import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { isCalculatedFieldMetadataItem } from '@/object-metadata/utils/isCalculatedFieldMetadataItem';
import { getFieldSyncSettings } from '@/settings/data-model/fields/forms/sync/utils/getSyncFormValueFromField';
import { type SettingsFieldType } from '@/settings/data-model/types/SettingsFieldType';
import { getSettingsFieldTypeConfig } from '@/settings/data-model/utils/getSettingsFieldTypeConfig';
import { type MessageDescriptor } from '@lingui/core';
import { t } from '@lingui/core/macro';
import { isDefined } from 'twenty-shared/utils';
import {
  type IconComponent,
  IllustrationIconCalculator,
  IllustrationIconSync,
} from 'twenty-ui/icon';

export type SettingsFieldDataTypeDisplay = {
  label: string;
  labelDetail?: string;
  Icon?: IconComponent;
};

export const getSettingsFieldDataTypeDisplay = (
  fieldMetadataItem: Pick<FieldMetadataItem, 'name' | 'type' | 'settings'> &
    Partial<Pick<FieldMetadataItem, 'isUIEditable'>>,
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

  if (isCalculatedFieldMetadataItem(fieldMetadataItem)) {
    return {
      label: t`Calculation`,
      labelDetail: outputTypeDetail,
      Icon: IllustrationIconCalculator,
    };
  }

  if (isDefined(getFieldSyncSettings(fieldMetadataItem))) {
    return {
      label: t`Sync`,
      labelDetail: outputTypeDetail,
      Icon: IllustrationIconSync,
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
