export type RoboostMergeActor = {
  workspaceMemberId: string | null;
  name: string | null;
};

export type RoboostMergeFieldChange = {
  fieldName: string;
  fieldLabel: string;
  columns: Record<string, { before: unknown; after: unknown }>;
};

export type RoboostMergeMovedLink = {
  tableName: string;
  columnName: string;
  movedIds: string[];
  softDeletedIds: string[];
};

export type RoboostMergeStatus = 'MERGED' | 'UNMERGED' | 'EXPIRED';

export type RoboostMergeLogRow = {
  id: string;
  objectName: string;
  primaryId: string;
  secondaryId: string;
  primaryName: string | null;
  secondaryName: string | null;
  mergedById: string | null;
  mergedByName: string | null;
  mergedAt: string;
  isBulk: boolean;
  status: RoboostMergeStatus;
  secondarySnapshot: Record<string, unknown> | null;
  primaryBefore: Record<string, unknown> | null;
  primaryChanges: RoboostMergeFieldChange[];
  movedLinks: RoboostMergeMovedLink[];
  segmentMembershipsAdded: string[];
  unmergedAt: string | null;
  unmergedByName: string | null;
  expiredAt: string | null;
};
