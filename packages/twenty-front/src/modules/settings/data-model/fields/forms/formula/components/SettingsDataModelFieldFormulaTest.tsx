import { dateLocaleState } from '@/localization/states/dateLocaleState';
import { useNumberFormat } from '@/localization/hooks/useNumberFormat';
import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { getObjectRecordIdentifier } from '@/object-metadata/utils/getObjectRecordIdentifier';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { SettingsDataModelFieldFormulaSampleInput } from '@/settings/data-model/fields/forms/formula/components/SettingsDataModelFieldFormulaSampleInput';
import {
  buildFormulaSampleRecord,
  type FormulaSampleInputs,
  type FormulaSampleInputValue,
} from '@/settings/data-model/fields/forms/formula/utils/buildFormulaSampleRecord';
import {
  formatFormulaTestResult,
  type FormulaTestResultSettings,
} from '@/settings/data-model/fields/forms/formula/utils/formatFormulaTestResult';
import { Select } from '@/ui/input/components/Select';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { UserContext } from '@/users/contexts/UserContext';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { isNonEmptyString } from '@sniptt/guards';
import { useContext, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import {
  buildFormulaVariables,
  coerceFormulaResult,
  evaluateFormula,
  type FormulaOutputFieldType,
  isDefined,
} from 'twenty-shared/utils';
import { LightIconButton } from 'twenty-ui/components/input';
import { IconX } from 'twenty-ui/icon';
import { themeCssVariables } from 'twenty-ui/theme';

const StyledContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
`;

const StyledRecordPicker = styled.div`
  align-items: flex-end;
  display: flex;
  gap: ${themeCssVariables.spacing[1]};
`;

const StyledClearButton = styled.div`
  padding-bottom: ${themeCssVariables.spacing[1]};
`;

const StyledResult = styled.div`
  color: ${themeCssVariables.font.color.primary};
  font-weight: ${themeCssVariables.font.weight.medium};
`;

const StyledError = styled.div`
  color: ${themeCssVariables.font.color.danger};
`;

type SettingsDataModelFieldFormulaTestProps = {
  expression: string;
  outputType: FormulaOutputFieldType;
  dependencies: FieldMetadataItem[];
  objectMetadataItem: EnrichedObjectMetadataItem;
};

export const SettingsDataModelFieldFormulaTest = ({
  expression,
  outputType,
  dependencies,
  objectMetadataItem,
}: SettingsDataModelFieldFormulaTestProps) => {
  const { t } = useLingui();
  const [recordId, setRecordId] = useState('');
  const [sampleInputs, setSampleInputs] = useState<FormulaSampleInputs>({});

  const { numberFormat } = useNumberFormat();
  const { dateFormat, timeFormat, timeZone } = useContext(UserContext);
  const dateLocale = useAtomStateValue(dateLocaleState);

  const { records } = useFindManyRecords({
    objectNameSingular: objectMetadataItem.nameSingular,
    limit: 20,
  });

  const selectedRecord = records.find(({ id }) => id === recordId);

  // Reads the output settings being edited, so a test reflects unsaved changes.
  const { watch } = useFormContext();
  const options = watch('options') as
    | { value: string; label: string }[]
    | undefined;
  const settings = watch('settings') as FormulaTestResultSettings | undefined;
  const defaultValue = watch('defaultValue') as
    | { currencyCode?: string }
    | null
    | undefined;

  const evaluation = evaluateFormula(
    expression,
    buildFormulaVariables(
      selectedRecord ??
        buildFormulaSampleRecord(dependencies, sampleInputs, expression),
      dependencies,
    ),
  );

  const result =
    evaluation.status === 'success'
      ? coerceFormulaResult(evaluation.value, outputType, {
          optionValues: (options ?? []).map(({ value }) => value),
          currencyCode: defaultValue?.currencyCode?.replace(/'/g, ''),
        })
      : evaluation;

  const formattedResult =
    result.status === 'success'
      ? formatFormulaTestResult({
          value: result.value,
          outputType,
          settings,
          options,
          context: {
            numberFormat,
            dateFormat,
            timeFormat,
            timeZone,
            localeCatalog: dateLocale.localeCatalog,
          },
        })
      : '';

  const handleSampleInputChange = (
    key: string,
    value: FormulaSampleInputValue,
  ) => setSampleInputs((currentInputs) => ({ ...currentInputs, [key]: value }));

  return (
    <StyledContainer>
      <StyledRecordPicker>
        <Select
          dropdownId="field-formula-test-record-select"
          label={t`Test on`}
          fullWidth
          withSearchInput
          value={recordId}
          options={[
            { label: t`Sample values`, value: '' },
            ...records.map((record) => ({
              label: getObjectRecordIdentifier({
                objectMetadataItem,
                record,
                allowRequestsToTwentyIcons: false,
              }).name,
              value: record.id,
            })),
          ]}
          onChange={setRecordId}
        />
        {isNonEmptyString(recordId) && (
          <StyledClearButton>
            <LightIconButton
              emphasis="subtle"
              aria-label={t`Use sample values`}
              onClick={() => setRecordId('')}
            >
              <IconX />
            </LightIconButton>
          </StyledClearButton>
        )}
      </StyledRecordPicker>
      {!isDefined(selectedRecord) &&
        dependencies.map((field) => (
          <SettingsDataModelFieldFormulaSampleInput
            key={field.id}
            field={field}
            expression={expression}
            inputs={sampleInputs}
            onChange={handleSampleInputChange}
          />
        ))}
      {result.status === 'success' ? (
        <StyledResult>
          {t`Result`}:{' '}
          {isNonEmptyString(formattedResult) ? formattedResult : t`Empty`}
        </StyledResult>
      ) : (
        <StyledError>{result.error}</StyledError>
      )}
    </StyledContainer>
  );
};
