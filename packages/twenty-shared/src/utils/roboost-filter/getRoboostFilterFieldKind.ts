import { type RoboostFilterFieldKind } from './roboost-filter-operator';

export type RoboostFilterField = {
  name: string;
  type: string;
  relation?: { type: string } | null;
};

const KIND_BY_TYPE: Record<string, RoboostFilterFieldKind> = {
  TEXT: 'text',
  FULL_NAME: 'text',
  LINKS: 'text',
  EMAILS: 'text',
  PHONES: 'text',
  UUID: 'text',
  NUMBER: 'number',
  NUMERIC: 'number',
  CURRENCY: 'currency',
  DATE: 'date',
  DATE_TIME: 'date',
  SELECT: 'select',
  RATING: 'select',
  MULTI_SELECT: 'multiSelect',
  BOOLEAN: 'boolean',
};

export const getRoboostFilterFieldKind = (
  field: Pick<RoboostFilterField, 'type' | 'relation'>,
): RoboostFilterFieldKind | null => {
  if (field.type === 'RELATION') {
    return field.relation?.type === 'MANY_TO_ONE' ? 'relation' : null;
  }

  return KIND_BY_TYPE[field.type] ?? null;
};
