import { Controller, useFormContext } from 'react-hook-form';
import { z } from 'zod';

import { useFieldMetadataItemById } from '@/object-metadata/hooks/useFieldMetadataItemById';
import { numberFieldDefaultValueSchema } from '@/object-record/record-field/ui/validation-schemas/numberFieldDefaultValueSchema';
import { SettingsCardSeparator } from '@/settings/components/SettingsCardSeparator';
import { SettingsOptionCardContentCounter } from '@/settings/components/SettingsOptions/SettingsOptionCardContentCounter';
import { SettingsOptionCardContentSelect } from '@/settings/components/SettingsOptions/SettingsOptionCardContentSelect';
import { NUMBER_DATA_MODEL_SELECT_OPTIONS } from '@/settings/data-model/fields/forms/number/constants/NumberDataModelSelectOptions';
import { Select } from '@/ui/input/components/Select';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { type DurationUnit } from 'twenty-shared/utils';
import { IconClock, IconDecimal, IconEye } from 'twenty-ui/icon';
import { DEFAULT_DECIMAL_VALUE } from '@/localization/utils/formatNumber';

export const settingsDataModelFieldNumberFormSchema = z.object({
  settings: numberFieldDefaultValueSchema,
});

export type SettingsDataModelFieldNumberFormValues = z.infer<
  typeof settingsDataModelFieldNumberFormSchema
>;

type SettingsDataModelFieldNumberFormProps = {
  disabled?: boolean;
  existingFieldMetadataId: string;
};

export const SettingsDataModelFieldNumberForm = ({
  disabled,
  existingFieldMetadataId,
}: SettingsDataModelFieldNumberFormProps) => {
  const { t } = useLingui();
  const { control } = useFormContext<SettingsDataModelFieldNumberFormValues>();

  const { fieldMetadataItem } = useFieldMetadataItemById(
    existingFieldMetadataId,
  );

  return (
    <Controller
      name="settings"
      defaultValue={{
        decimals:
          fieldMetadataItem?.settings?.decimals ?? DEFAULT_DECIMAL_VALUE,
        type: fieldMetadataItem?.settings?.type ?? 'number',
      }}
      control={control}
      render={({ field: { onChange, value } }) => {
        const count = value?.decimals ?? 0;
        const type = value?.type ?? 'number';
        const durationUnit = value?.durationUnit ?? 'days';
        const example = `${(type === 'percentage' ? 99 : 1000).toFixed(count)}${type === 'percentage' ? '%' : ''}`;

        return (
          <>
            <SettingsOptionCardContentSelect
              Icon={IconEye}
              title={t`Number type`}
              description={t`How the number is displayed`}
            >
              <Select<string>
                selectSizeVariant="small"
                dropdownId="number-type"
                dropdownWidth={150}
                value={type}
                onChange={(value) =>
                  onChange({
                    type: value,
                    decimals:
                      value === 'shortNumber' ? DEFAULT_DECIMAL_VALUE : count,
                    durationUnit: value === 'duration' ? durationUnit : null,
                  })
                }
                disabled={disabled}
                needIconCheck={false}
                options={NUMBER_DATA_MODEL_SELECT_OPTIONS.map((option) => ({
                  ...option,
                  label: t(option.label),
                }))}
              />
            </SettingsOptionCardContentSelect>
            <SettingsCardSeparator />
            {type === 'duration' && (
              <SettingsOptionCardContentSelect
                Icon={IconClock}
                title={t`Stored in`}
                description={t`The unit of the number, shown like 3d 4h`}
              >
                <Select<DurationUnit>
                  selectSizeVariant="small"
                  dropdownId="number-duration-unit"
                  dropdownWidth={150}
                  value={durationUnit}
                  onChange={(unit) =>
                    onChange({ type, decimals: count, durationUnit: unit })
                  }
                  disabled={disabled}
                  needIconCheck={false}
                  options={[
                    { label: t`Days`, value: 'days' },
                    { label: t`Hours`, value: 'hours' },
                    { label: t`Minutes`, value: 'minutes' },
                    { label: t`Seconds`, value: 'seconds' },
                    { label: t`Milliseconds`, value: 'milliseconds' },
                  ]}
                />
              </SettingsOptionCardContentSelect>
            )}
            {(type === 'number' || type === 'percentage') && (
              <SettingsOptionCardContentCounter
                Icon={IconDecimal}
                title={t`Number of decimals`}
                description={plural(count, {
                  one: `E.g. ${example} for # decimal`,
                  other: `E.g. ${example} for # decimals`,
                })}
                value={count}
                onChange={(value) => onChange({ type: type, decimals: value })}
                disabled={disabled}
                minValue={0}
                maxValue={100} // needs to be changed
              />
            )}
          </>
        );
      }}
    />
  );
};
