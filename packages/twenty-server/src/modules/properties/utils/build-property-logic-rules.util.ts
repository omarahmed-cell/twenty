import {
  type ConditionalLogicRule,
  expandPropertyLogicRule,
  isDefined,
  normalizeConditionalLogicRules,
} from 'twenty-shared/utils';

type StoredRule = {
  id: string;
  objectMetadataId: string;
  conditionGroups: unknown;
  properties: unknown;
};

type StoredMembership = {
  propertyGroupId: string;
  fieldMetadataId: string;
  position: number | null;
};

// Rules come back per object with their group entries already replaced by the group's current fields
export const buildPropertyLogicRulesByObjectMetadataId = ({
  rules,
  memberships,
  fieldNameById,
}: {
  rules: StoredRule[];
  memberships: StoredMembership[];
  fieldNameById: ReadonlyMap<string, string>;
}): Map<string, ConditionalLogicRule[]> => {
  const fieldNamesByPropertyGroupId = new Map<string, string[]>();

  for (const membership of [...memberships].sort(
    (left, right) => (left.position ?? 0) - (right.position ?? 0),
  )) {
    const fieldName = fieldNameById.get(membership.fieldMetadataId);

    if (!isDefined(fieldName)) {
      continue;
    }

    fieldNamesByPropertyGroupId.set(membership.propertyGroupId, [
      ...(fieldNamesByPropertyGroupId.get(membership.propertyGroupId) ?? []),
      fieldName,
    ]);
  }

  const rulesByObjectMetadataId = new Map<string, ConditionalLogicRule[]>();

  for (const storedRule of rules) {
    const [rule] = normalizeConditionalLogicRules([
      {
        id: storedRule.id,
        conditionGroups: storedRule.conditionGroups,
        properties: storedRule.properties,
      },
    ]);

    if (!isDefined(rule)) {
      continue;
    }

    rulesByObjectMetadataId.set(storedRule.objectMetadataId, [
      ...(rulesByObjectMetadataId.get(storedRule.objectMetadataId) ?? []),
      expandPropertyLogicRule(rule, fieldNamesByPropertyGroupId),
    ]);
  }

  return rulesByObjectMetadataId;
};
