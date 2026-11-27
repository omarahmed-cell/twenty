import {
  type ConditionalLogicField,
  type ConditionalLogicRule,
  evaluateConditionalLogicGroups,
  getPropertyLogicConditionFieldNames,
  isDefined,
} from 'twenty-shared/utils';

export type RoboostDependentProperty = {
  fieldName: string;
  isRequired: boolean;
};

export type RoboostDependentPropertyLayout = {
  fieldNames: string[];
  dependentsByTriggerFieldName: Map<string, RoboostDependentProperty[]>;
};

// Dependents leave their usual place and sit in a box under the property that triggers them,
// shown only while the rule is true. A rule whose trigger is not in the list changes nothing.
export const getRoboostDependentPropertyLayout = ({
  fieldNames,
  rules,
  record,
  fields,
}: {
  fieldNames: string[];
  rules: ConditionalLogicRule[];
  record: Record<string, unknown>;
  fields: ConditionalLogicField[];
}): RoboostDependentPropertyLayout => {
  const fieldByName = new Map(fields.map((field) => [field.name, field]));
  const reachable = new Set(fieldNames);
  const movedFieldNames = new Set<string>();
  const dependentsByTriggerFieldName = new Map<
    string,
    RoboostDependentProperty[]
  >();
  const pendingRules = [...rules];
  let hasPlacedRule = true;

  // A dependent can trigger rules of its own, so place rules until none is left that can be placed
  while (hasPlacedRule) {
    hasPlacedRule = false;

    for (const rule of [...pendingRules]) {
      const triggerFieldName = [
        ...getPropertyLogicConditionFieldNames(rule),
      ].find((fieldName) => reachable.has(fieldName));

      if (!isDefined(triggerFieldName)) {
        continue;
      }
      pendingRules.splice(pendingRules.indexOf(rule), 1);
      hasPlacedRule = true;

      const isTrue = evaluateConditionalLogicGroups({
        conditionGroups: rule.conditionGroups,
        record,
        fieldByName,
      });
      const dependents =
        dependentsByTriggerFieldName.get(triggerFieldName) ?? [];

      for (const property of rule.properties) {
        if (property.fieldName === triggerFieldName) {
          continue;
        }
        movedFieldNames.add(property.fieldName);

        if (!isTrue) {
          continue;
        }
        reachable.add(property.fieldName);
        const existing = dependents.find(
          ({ fieldName }) => fieldName === property.fieldName,
        );

        if (isDefined(existing)) {
          existing.isRequired = existing.isRequired || property.isRequired;
        } else {
          dependents.push({ ...property });
        }
      }

      if (dependents.length > 0) {
        dependentsByTriggerFieldName.set(triggerFieldName, dependents);
      }
    }
  }

  return {
    fieldNames: fieldNames.filter(
      (fieldName) => !movedFieldNames.has(fieldName),
    ),
    dependentsByTriggerFieldName,
  };
};
