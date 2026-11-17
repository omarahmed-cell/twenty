import {
  type ConditionalLogicRule,
  expandPropertyLogicRule,
  isDefined,
  normalizeConditionalLogicRules,
} from 'twenty-shared/utils';

import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import {
  type PropertyLogicRuleRecord,
  type PropertySettings,
} from '@/properties/types/PropertySettings';

export const toConditionalLogicRule = (
  record: PropertyLogicRuleRecord,
): ConditionalLogicRule | undefined =>
  normalizeConditionalLogicRules([
    {
      id: record.id,
      conditionGroups: record.conditionGroups,
      properties: record.properties,
    },
  ])[0];

export const buildFieldNamesByPropertyGroupId = ({
  propertySettings,
  fields,
}: {
  propertySettings: PropertySettings;
  fields: Pick<FieldMetadataItem, 'id' | 'name'>[];
}): Map<string, string[]> => {
  const fieldNameById = new Map(fields.map(({ id, name }) => [id, name]));
  const fieldNamesByPropertyGroupId = new Map<string, string[]>();

  for (const membership of [...propertySettings.memberships].sort(
    (left, right) => left.position - right.position,
  )) {
    const fieldName = fieldNameById.get(membership.fieldMetadataId);

    if (isDefined(fieldName)) {
      fieldNamesByPropertyGroupId.set(membership.propertyGroupId, [
        ...(fieldNamesByPropertyGroupId.get(membership.propertyGroupId) ?? []),
        fieldName,
      ]);
    }
  }

  return fieldNamesByPropertyGroupId;
};

// The object's rules, with group entries replaced by the group's current properties
export const buildObjectPropertyLogicRules = ({
  propertySettings,
  objectMetadataId,
  fields,
}: {
  propertySettings: PropertySettings | null;
  objectMetadataId: string;
  fields: Pick<FieldMetadataItem, 'id' | 'name'>[];
}): ConditionalLogicRule[] => {
  if (!isDefined(propertySettings)) {
    return [];
  }

  const objectRules = propertySettings.rules.filter(
    (rule) => rule.objectMetadataId === objectMetadataId,
  );

  if (objectRules.length === 0) {
    return [];
  }

  const fieldNamesByPropertyGroupId = buildFieldNamesByPropertyGroupId({
    propertySettings,
    fields,
  });

  return objectRules
    .map(toConditionalLogicRule)
    .filter(isDefined)
    .map((rule) => expandPropertyLogicRule(rule, fieldNamesByPropertyGroupId));
};
