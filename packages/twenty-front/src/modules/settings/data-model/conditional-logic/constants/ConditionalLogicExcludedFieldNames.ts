// Stage and pipeline are the rule's fixed context; the rest are written by the system, never by a person
export const CONDITIONAL_LOGIC_EXCLUDED_FIELD_NAMES = new Set([
  'stage',
  'pipeline',
  'id',
  'createdAt',
  'updatedAt',
  'deletedAt',
  'createdBy',
  'updatedBy',
  'position',
  'searchVector',
]);
