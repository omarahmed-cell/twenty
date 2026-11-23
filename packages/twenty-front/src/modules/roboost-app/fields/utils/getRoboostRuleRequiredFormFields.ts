import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { getRoboostFieldEditKind } from '@/roboost-app/fields/getRoboostFieldEditKind';
import { getRoboostFieldInputKey } from '@/roboost-app/fields/getRoboostFieldInputKey';
import { type RoboostFormField } from '@/roboost-app/hooks/useRoboostFormFields';
import {
  type ConditionalLogicField,
  type ConditionalLogicRule,
  evaluateConditionalLogicGroups,
  getPropertyLogicConditionFieldNames,
  isDefined,
} from 'twenty-shared/utils';

export type RoboostRuleFormField = RoboostFormField & {
  isAddedByRule?: boolean;
};

// Create forms: a true rule marks its required properties required, adding the ones the form does not show
export const getRoboostRuleRequiredFormFields = ({
  formFields,
  objectMetadataItem,
  values,
  rules,
  fields,
}: {
  formFields: RoboostFormField[];
  objectMetadataItem: EnrichedObjectMetadataItem;
  values: Record<string, unknown>;
  rules: ConditionalLogicRule[];
  fields: ConditionalLogicField[];
}): RoboostRuleFormField[] => {
  if (rules.length === 0) {
    return formFields;
  }

  const record: Record<string, unknown> = { ...values };

  for (const field of objectMetadataItem.fields) {
    if (field.name in values) {
      record[getRoboostFieldInputKey(field)] = values[field.name];
    }
  }

  const fieldByName = new Map(fields.map((field) => [field.name, field]));
  const trueRules = rules.filter((rule) =>
    evaluateConditionalLogicGroups({
      conditionGroups: rule.conditionGroups,
      record,
      fieldByName,
    }),
  );

  if (trueRules.length === 0) {
    return formFields;
  }

  const requiredNames = new Set(
    trueRules.flatMap((rule) =>
      rule.properties
        .filter(({ isRequired }) => isRequired)
        .map(({ fieldName }) => fieldName),
    ),
  );

  const result: RoboostRuleFormField[] = formFields.map((formField) => ({
    ...formField,
    isRequired: formField.isRequired || requiredNames.has(formField.field.name),
  }));
  const shownNames = new Set(formFields.map(({ field }) => field.name));

  for (const rule of trueRules) {
    const addedFields = rule.properties
      .filter(
        ({ fieldName, isRequired }) => isRequired && !shownNames.has(fieldName),
      )
      .map(({ fieldName }) =>
        objectMetadataItem.fields.find((field) => field.name === fieldName),
      )
      .filter(isDefined)
      .filter((field) => getRoboostFieldEditKind(field) !== null);

    if (addedFields.length === 0) {
      continue;
    }

    const conditionNames = getPropertyLogicConditionFieldNames(rule);
    const triggerIndex = result.findLastIndex(({ field }) =>
      conditionNames.has(field.name),
    );
    const insertAt = triggerIndex === -1 ? result.length : triggerIndex + 1;

    result.splice(
      insertAt,
      0,
      ...addedFields.map((field) => ({
        field,
        isRequired: true,
        isAddedByRule: true,
      })),
    );
    addedFields.forEach((field) => shownNames.add(field.name));
  }

  return result;
};
