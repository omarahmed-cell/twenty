import { isNonEmptyString } from '@sniptt/guards';

import { type FieldMetadataType } from '@/types/FieldMetadataType';
import {
  FORMULA_OUTPUT_FIELD_TYPES,
  type FormulaOutputFieldType,
} from '@/utils/formula/coerceFormulaResult';
import { parseFormula } from '@/utils/formula/parseFormula';
import { isDefined } from '@/utils/validation/isDefined';

export type ComputedGraphField = {
  id: string;
  name: string;
  objectMetadataId: string;
  type: FieldMetadataType;
  isActive?: boolean | null;
  settings?: unknown;
};

const getDependencyIds = (
  field: ComputedGraphField,
  fieldIdByObjectAndName: Map<string, string>,
): string[] => {
  const settings = field.settings as
    | {
        formula?: { expression?: unknown };
        sync?: { sourceFieldMetadataId?: unknown };
      }
    | null
    | undefined;

  const sourceFieldId = settings?.sync?.sourceFieldMetadataId;

  if (isNonEmptyString(sourceFieldId)) {
    return [sourceFieldId];
  }

  const expression = settings?.formula?.expression;

  if (
    !isNonEmptyString(expression) ||
    !FORMULA_OUTPUT_FIELD_TYPES.includes(field.type as FormulaOutputFieldType)
  ) {
    return [];
  }

  const parsedFormula = parseFormula(expression);

  return parsedFormula.status === 'valid'
    ? parsedFormula.fieldNames
        .map((name) =>
          fieldIdByObjectAndName.get(`${field.objectMetadataId}:${name}`),
        )
        .filter(isDefined)
    : [];
};

// A loop can cross objects (formula -> sync -> formula -> sync -> back), so formula and sync
// fields have to be checked as one graph. Members of a loop must never be computed, as each
// write would trigger the next. Fields that merely depend on a loop are not members.
export const findComputedFieldCycleMembers = (
  fields: ComputedGraphField[],
): Set<string> => {
  const activeFields = fields.filter(({ isActive }) => isActive !== false);

  const fieldIdByObjectAndName = new Map(
    activeFields.map(({ id, name, objectMetadataId }) => [
      `${objectMetadataId}:${name}`,
      id,
    ]),
  );

  const dependencyIdsByFieldId = new Map(
    activeFields.map((field) => [
      field.id,
      getDependencyIds(field, fieldIdByObjectAndName),
    ]),
  );

  // Tarjan's strongly connected components: a component of two or more fields, or a field
  // that depends on itself, is a loop.
  const members = new Set<string>();
  const indexByFieldId = new Map<string, number>();
  const lowLinkByFieldId = new Map<string, number>();
  const stack: string[] = [];
  const onStack = new Set<string>();
  let nextIndex = 0;

  const visit = (fieldId: string) => {
    indexByFieldId.set(fieldId, nextIndex);
    lowLinkByFieldId.set(fieldId, nextIndex);
    nextIndex += 1;
    stack.push(fieldId);
    onStack.add(fieldId);

    const dependencyIds = dependencyIdsByFieldId.get(fieldId) ?? [];

    for (const dependencyId of dependencyIds) {
      if (!dependencyIdsByFieldId.has(dependencyId)) {
        continue;
      }

      if (!indexByFieldId.has(dependencyId)) {
        visit(dependencyId);
        lowLinkByFieldId.set(
          fieldId,
          Math.min(
            lowLinkByFieldId.get(fieldId) ?? 0,
            lowLinkByFieldId.get(dependencyId) ?? 0,
          ),
        );
      } else if (onStack.has(dependencyId)) {
        lowLinkByFieldId.set(
          fieldId,
          Math.min(
            lowLinkByFieldId.get(fieldId) ?? 0,
            indexByFieldId.get(dependencyId) ?? 0,
          ),
        );
      }
    }

    if (lowLinkByFieldId.get(fieldId) !== indexByFieldId.get(fieldId)) {
      return;
    }

    const component: string[] = [];
    let member: string | undefined;

    do {
      member = stack.pop();

      if (isDefined(member)) {
        onStack.delete(member);
        component.push(member);
      }
    } while (isDefined(member) && member !== fieldId);

    if (component.length > 1 || dependencyIds.includes(fieldId)) {
      component.forEach((componentFieldId) => members.add(componentFieldId));
    }
  };

  for (const fieldId of dependencyIdsByFieldId.keys()) {
    if (!indexByFieldId.has(fieldId)) {
      visit(fieldId);
    }
  }

  return members;
};
