import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { getRoboostFieldEditKind } from '@/roboost-app/fields/getRoboostFieldEditKind';
import { getRoboostFieldInputKey } from '@/roboost-app/fields/getRoboostFieldInputKey';
import { type RoboostFormField } from '@/roboost-app/hooks/useRoboostFormFields';
import { getRoboostDependentPropertyLayout } from '@/roboost-app/record/utils/getRoboostDependentPropertyLayout';
import {
  type ConditionalLogicField,
  type ConditionalLogicRule,
  isDefined,
} from 'twenty-shared/utils';

export type RoboostRuleFormField = RoboostFormField & {
  // Set on a rule's dependent, which the form shows in a box under this trigger field
  dependentOfFieldName?: string;
};

// Create forms: a true rule shows its dependents, required ones starred, right under the field that triggered it
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

  const layout = getRoboostDependentPropertyLayout({
    fieldNames: formFields.map(({ field }) => field.name),
    rules,
    record,
    fields,
  });
  const formFieldByName = new Map(
    formFields.map((formField) => [formField.field.name, formField]),
  );
  const result: RoboostRuleFormField[] = [];

  const addWithDependents = (formField: RoboostRuleFormField) => {
    result.push(formField);

    for (const dependent of layout.dependentsByTriggerFieldName.get(
      formField.field.name,
    ) ?? []) {
      const field = objectMetadataItem.fields.find(
        ({ name }) => name === dependent.fieldName,
      );

      if (!isDefined(field) || getRoboostFieldEditKind(field) === null) {
        continue;
      }
      addWithDependents({
        field,
        isRequired:
          dependent.isRequired ||
          (formFieldByName.get(field.name)?.isRequired ?? false),
        dependentOfFieldName: formField.field.name,
      });
    }
  };

  for (const fieldName of layout.fieldNames) {
    const formField = formFieldByName.get(fieldName);

    if (isDefined(formField)) {
      addWithDependents(formField);
    }
  }

  return result;
};
