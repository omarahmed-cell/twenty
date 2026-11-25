export const ROBOOST_MERGE_OBJECT_NAMES = [
  'company',
  'person',
  'opportunity',
  'service',
] as const;

export type RoboostMergeObjectName =
  (typeof ROBOOST_MERGE_OBJECT_NAMES)[number];

export const ROBOOST_MERGE_MAX_MERGES_PER_RECORD = 250;

export const ROBOOST_UNMERGE_WINDOW_DAYS = 30;

// The field that holds the single "primary company" of a contact, deal or service
export const ROBOOST_MERGE_COMPANY_FIELD_NAME = 'company';

export type RoboostMergeFieldMode =
  | 'choice'
  | 'fixed'
  | 'recalculated'
  | 'kept';

export type RoboostMergeFieldPlan = {
  name: string;
  mode: RoboostMergeFieldMode;
  defaultSide: 'primary' | 'secondary';
  isDifferent: boolean;
  note: string | null;
};
