import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { useObjectMetadataItems } from '@/object-metadata/hooks/useObjectMetadataItems';
import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { SettingsDataModelFieldFormulaTest } from '@/settings/data-model/fields/forms/formula/components/SettingsDataModelFieldFormulaTest';
import {
  getFormulaReferenceableFields,
  getUnknownOptionWarnings,
  validateFormula,
} from '@/settings/data-model/fields/forms/formula/utils/validateFormula';
import { SettingsDataModelFieldFormulaInsertMenus } from '@/settings/data-model/fields/forms/formula/components/SettingsDataModelFieldFormulaInsertMenus';
import { SettingsDataModelFieldCurrencyForm } from '@/settings/data-model/fields/forms/currency/components/SettingsDataModelFieldCurrencyForm';
import { SettingsDataModelFieldDateForm } from '@/settings/data-model/fields/forms/date/components/SettingsDataModelFieldDateForm';
import { SettingsDataModelFieldNumberForm } from '@/settings/data-model/fields/forms/number/components/SettingsDataModelFieldNumberForm';
import { SettingsDataModelFieldSelectForm } from '@/settings/data-model/fields/forms/select/components/SettingsDataModelFieldSelectForm';
import { Select } from '@/ui/input/components/Select';
import { TextArea } from '@/ui/input/components/TextArea';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { isNonEmptyString } from '@sniptt/guards';
import { useRef } from 'react';
import {
  type FormulaOutputFieldType,
  isFormulaTimeBased,
} from 'twenty-shared/utils';
import { Section } from 'twenty-ui/components/layout';
import { Card } from 'twenty-ui/primitives/surfaces';
import { themeCssVariables } from 'twenty-ui/theme';
import { FieldMetadataType } from '~/generated-metadata/graphql';

const StyledContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[4]};
`;

const StyledError = styled.div`
  color: ${themeCssVariables.font.color.danger};
`;

const StyledNote = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
`;

const StyledWarning = styled.div`
  color: ${themeCssVariables.color.orange11};
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

  const textAreaContainerRef = useRef<HTMLDivElement>(null);

  // The text area keeps its selection while a dropdown has focus, so this inserts where the
  // caret was. The offset leaves the caret inside the parentheses of a function.
  const insertAtCaret = (text: string, caretOffsetFromEnd = 0) => {
    const textArea = textAreaContainerRef.current?.querySelector('textarea');
    const start = textArea?.selectionStart ?? expression.length;
    const end = textArea?.selectionEnd ?? expression.length;

    onExpressionChange(
      `${expression.slice(0, start)}${text}${expression.slice(end)}`,
    );

    requestAnimationFrame(() => {
      const caret = start + text.length - caretOffsetFromEnd;

      textArea?.focus();
      textArea?.setSelectionRange(caret, caret);
    });
  };

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
          { label: t`Date`, value: FieldMetadataType.DATE },
          { label: t`Date and time`, value: FieldMetadataType.DATE_TIME },
          { label: t`Select`, value: FieldMetadataType.SELECT },
          { label: t`Currency`, value: FieldMetadataType.CURRENCY },
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
      {outputType === FieldMetadataType.CURRENCY && (
        <Card.Root>
          <SettingsDataModelFieldCurrencyForm
            disabled={disabled}
            existingFieldMetadataId={targetField?.id ?? ''}
          />
        </Card.Root>
      )}
      {(outputType === FieldMetadataType.DATE ||
        outputType === FieldMetadataType.DATE_TIME) && (
        <Card.Root>
          <SettingsDataModelFieldDateForm
            disabled={disabled}
            existingFieldMetadataId={targetField?.id ?? ''}
          />
        </Card.Root>
      )}
      {outputType === FieldMetadataType.SELECT && (
        <Card.Root>
          <SettingsDataModelFieldSelectForm
            fieldType={FieldMetadataType.SELECT}
            disabled={disabled}
            existingFieldMetadataId={targetField?.id ?? ''}
          />
        </Card.Root>
      )}
      <SettingsDataModelFieldFormulaInsertMenus
        referenceableFields={referenceableFields}
        onInsert={insertAtCaret}
        disabled={disabled}
      />
      <div ref={textAreaContainerRef}>
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
      </div>
      {isNonEmptyString(expression.trim()) &&
        validation.status === 'invalid' && (
          <StyledError>{validation.error}</StyledError>
        )}
      {validation.status === 'valid' &&
        getUnknownOptionWarnings(expression, validation.dependencies).map(
          ({ value, fieldLabel }) => (
            <StyledWarning key={`${fieldLabel}-${value}`}>
              {t`"${value}" is not an option of ${fieldLabel}, so this comparison is never true.`}
            </StyledWarning>
          ),
        )}
      {validation.status === 'valid' && isFormulaTimeBased(expression) && (
        <StyledNote>
          {t`This formula uses the current time, so it recalculates every hour. Those updates don't appear on the timeline, trigger workflows or change Last update.`}
        </StyledNote>
      )}
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
