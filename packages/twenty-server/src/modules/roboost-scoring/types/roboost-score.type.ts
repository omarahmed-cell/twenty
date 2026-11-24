import {
  type RoboostScoreBreakdown,
  type RoboostScoreCriteria,
  type RoboostScoreObjectName,
} from 'twenty-shared/utils';

export type RoboostScoreRow = {
  id: string;
  name: string;
  description: string | null;
  objectName: RoboostScoreObjectName;
  isActive: boolean;
  scoreMin: number;
  scoreMax: number;
  linkedFieldMetadataId: string | null;
  freezeOnClosedWon: boolean;
  publishedVersionId: string | null;
  publishedVersionNumber: number | null;
  draft: RoboostScoreCriteria;
  hasDraftChanges: boolean;
  recalcStatus: 'RUNNING' | 'DONE' | 'FAILED' | null;
  recalcTotal: number | null;
  recalcDone: number | null;
  recalcStartedAt: string | null;
  recalcFinishedAt: string | null;
  lastFullRecalcAt: string | null;
  lastVerifiedAt: string | null;
  lastDriftCount: number | null;
  createdAt: string;
  createdById: string | null;
  createdByName: string | null;
  updatedAt: string;
  updatedById: string | null;
  updatedByName: string | null;
};

export type RoboostScoreVersionRow = {
  id: string;
  scoreId: string;
  version: number;
  criteria: RoboostScoreCriteria;
  publishedAt: string;
  publishedById: string | null;
  publishedByName: string | null;
  note: string | null;
};

export type RoboostScoreResultSource = 'SCORE' | 'HUBSPOT_IMPORT';

export type RoboostScoreResultRow = {
  scoreId: string;
  recordId: string;
  value: number | null;
  versionId: string | null;
  versionNumber: number | null;
  breakdown: RoboostScoreBreakdown | null;
  computedAt: string;
  frozen: boolean;
  frozenAt: string | null;
  source: RoboostScoreResultSource;
};

export type RoboostScoreActor = {
  workspaceMemberId: string;
  name: string;
};
