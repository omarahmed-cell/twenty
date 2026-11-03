import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { getObjectRecordIdentifier } from '@/object-metadata/utils/getObjectRecordIdentifier';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { Select } from '@/ui/input/components/Select';
import { SettingsTextInput } from '@/ui/input/components/SettingsTextInput';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { isNonEmptyString } from '@sniptt/guards';
import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import {
  buildFormulaVariables,
  coerceFormulaResult,
  evaluateFormula,
  type FormulaOutputFieldType,
  type FormulaResultValue,
  isDefined,
} from 'twenty-shared/utils';
import { themeCssVariables } from 'twenty-ui/theme';
import { FieldMetadataType } from '~/generated-metadata/graphql';

const SAMPLE_INPUT_FIELD_TYPES: FieldMetadataType[] = [
  FieldMetadataType.TEXT,
  FieldMetadataType.NUMBER,
  FieldMetadataType.NUMERIC,
  FieldMetadataType.BOOLEAN,
  FieldMetadataType.DATE,
  FieldMetadataType.DATE_TIME,
  FieldMetadataType.SELECT,
  FieldMetadataType.MULTI_SELECT,
  FieldMetadataType.RATING,
  FieldMetadataType.UUID,
];

const StyledContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
`;

const StyledHint = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
`;

const StyledResult = styled.div`
  color: ${themeCssVariables.font.color.primary};
  font-weight: ${themeCssVariables.font.weight.medium};
`;

const StyledError = styled.div`
  color: ${themeCssVariables.font.color.danger};
`;

const toSampleValue = (text: string, type: FieldMetadataType) => {
  if (!isNonEmptyString(text)) {
    return null;
  }

  if (type === FieldMetadataType.BOOLEAN) {
    return text.trim().toLowerCase() === 'true';
  }

  if (type === FieldMetadataType.MULTI_SELECT) {
    return text.split(',').map((value) => value.trim());
  }

  return text;
};

const formatResult = (value: FormulaResultValue) =>
  typeof value === 'object' && value !== null
    ? `${value.amountMicros / 1_000_000} ${value.currencyCode}`
    : String(value);

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
  const [sampleValues, setSampleValues] = useState<Record<string, string>>({});

  const { records } = useFindManyRecords({
    objectNameSingular: objectMetadataItem.nameSingular,
    limit: 20,
  });

  const selectedRecord = records.find(({ id }) => id === recordId);

  const sampleRecord = Object.fromEntries(
    dependencies.map(({ name, type }) => [
      name,
      toSampleValue(sampleValues[name] ?? '', type),
    ]),
  );

  // Reads the options and currency being edited, so a test reflects unsaved changes.
  const { watch } = useFormContext();
  const options = watch('options') as { value: string }[] | undefined;
  const defaultValue = watch('defaultValue') as
    | { currencyCode?: string }
    | null
    | undefined;

  const evaluation = evaluateFormula(
    expression,
    buildFormulaVariables(selectedRecord ?? sampleRecord, dependencies),
  );

  const result =
    evaluation.status === 'success'
      ? coerceFormulaResult(evaluation.value, outputType, {
          optionValues: (options ?? []).map(({ value }) => value),
          currencyCode: defaultValue?.currencyCode?.replace(/'/g, ''),
        })
      : evaluation;

  return (
    <StyledContainer>
      <Select
        dropdownId="field-formula-test-record-select"
        label={t`Test on`}
        fullWidth
        withSearchInput
        value={recordId}
        emptyOption={{ label: t`Sample values`, value: '' }}
        options={records.map((record) => ({
          label: getObjectRecordIdentifier({
            objectMetadataItem,
            record,
            allowRequestsToTwentyIcons: false,
          }).name,
          value: record.id,
        }))}
        onChange={setRecordId}
      />
      {!isDefined(selectedRecord) &&
        dependencies.map(({ id, name, label, type }) =>
          SAMPLE_INPUT_FIELD_TYPES.includes(type) ? (
            <SettingsTextInput
              key={id}
              instanceId={`field-formula-test-${id}`}
              label={`${label} (${name})`}
              fullWidth
              value={sampleValues[name] ?? ''}
              onChange={(value) =>
                setSampleValues((currentValues) => ({
                  ...currentValues,
                  [name]: value,
                }))
              }
            />
          ) : (
            <StyledHint key={id}>
              {t`Pick a record to test with ${label}.`}
            </StyledHint>
          ),
        )}
      {result.status === 'success' ? (
        <StyledResult>
          {t`Result`}:{' '}
          {isDefined(result.value) ? formatResult(result.value) : t`Empty`}
        </StyledResult>
      ) : (
        <StyledError>{result.error}</StyledError>
      )}
    </StyledContainer>
  );
};
