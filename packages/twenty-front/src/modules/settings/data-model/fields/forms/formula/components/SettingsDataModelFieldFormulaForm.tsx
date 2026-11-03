import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { useObjectMetadataItems } from '@/object-metadata/hooks/useObjectMetadataItems';
import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { SettingsDataModelFieldFormulaTest } from '@/settings/data-model/fields/forms/formula/components/SettingsDataModelFieldFormulaTest';
import {
  getFormulaReferenceableFields,
  validateFormula,
} from '@/settings/data-model/fields/forms/formula/utils/validateFormula';
import { SettingsDataModelFieldNumberForm } from '@/settings/data-model/fields/forms/number/components/SettingsDataModelFieldNumberForm';
import { Select } from '@/ui/input/components/Select';
import { TextArea } from '@/ui/input/components/TextArea';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { isNonEmptyString } from '@sniptt/guards';
import { type FormulaOutputFieldType } from 'twenty-shared/utils';
import { Section } from 'twenty-ui/components/layout';
import { Card } from 'twenty-ui/primitives/surfaces';
import { themeCssVariables } from 'twenty-ui/theme';
import { FieldMetadataType } from '~/generated-metadata/graphql';

const StyledContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[4]};
`;

const StyledHint = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
`;

const StyledError = styled.div`
  color: ${themeCssVariables.font.color.danger};
`;

type SettingsDataModelFieldFormulaFormProps = {
  objectMetadataItem: EnrichedObjectMetadataItem;
  expression: string;
  onExpressionChange: (expression: string) => void;
  outputType: FormulaOutputFieldType;
  // Omitted for an existing field, whose column type is fixed.
  onOutputTypeChange?: (outputType: FormulaOutputFieldType) => void;
  targetField?: FieldMetadataItem;
  isPaused?: boolean;
  disabled?: boolean;
};

export const SettingsDataModelFieldFormulaForm = ({
  objectMetadataItem,
  expression,
  onExpressionChange,
  outputType,
  onOutputTypeChange,
  targetField,
  isPaused = false,
  disabled = false,
}: SettingsDataModelFieldFormulaFormProps) => {
  const { t } = useLingui();

  const { objectMetadataItems } = useObjectMetadataItems();

  const referenceableFields = getFormulaReferenceableFields(
    objectMetadataItem,
    targetField?.id,
  );

  const validation = validateFormula({
    expression,
    objectMetadataItem,
    objectMetadataItems,
    targetField,
  });

  const availableFieldNames = referenceableFields
    .filter(({ isSystem }) => isSystem !== true)
    .map(({ name }) => name)
    .join(', ');

  return (
    <StyledContainer>
      {isPaused && (
        <StyledError>
          {t`This field stopped calculating because its formula is invalid, uses a field that was removed or deactivated, or is part of a loop. It keeps its last values. Fix the formula to resume.`}
        </StyledError>
      )}
      <Select<FormulaOutputFieldType>
        dropdownId="field-formula-output-type-select"
        label={t`Output type`}
        fullWidth
        disabled={disabled || onOutputTypeChange === undefined}
        value={outputType}
        options={[
          { label: t`Number`, value: FieldMetadataType.NUMBER },
          { label: t`Text`, value: FieldMetadataType.TEXT },
          { label: t`True/False`, value: FieldMetadataType.BOOLEAN },
        ]}
        onChange={onOutputTypeChange}
      />
      {outputType === FieldMetadataType.NUMBER && (
        <Card.Root>
          <SettingsDataModelFieldNumberForm
            disabled={disabled}
            existingFieldMetadataId={targetField?.id ?? ''}
          />
        </Card.Root>
      )}
      <TextArea
        textAreaId="field-formula-expression"
        label={t`Formula`}
        minRows={3}
        maxRows={12}
        disabled={disabled}
        placeholder={t`branches >= 1 && branches <= 10 ? price * branches : 0`}
        value={expression}
        onChange={onExpressionChange}
      />
      {isNonEmptyString(expression.trim()) &&
        validation.status === 'invalid' && (
          <StyledError>{validation.error}</StyledError>
        )}
      <StyledHint>
        {t`Fields you can use`}: {availableFieldNames}
      </StyledHint>
      {validation.status === 'valid' && (
        <Section.Root>
          <Section.Header
            title={t`Test formula`}
            description={t`See the result before saving`}
          />
          <SettingsDataModelFieldFormulaTest
            expression={expression}
            outputType={outputType}
            dependencies={validation.dependencies}
            objectMetadataItem={objectMetadataItem}
          />
        </Section.Root>
      )}
    </StyledContainer>
  );
};
