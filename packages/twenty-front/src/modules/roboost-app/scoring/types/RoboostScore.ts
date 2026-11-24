import {
  type RoboostScoreBreakdown,
  type RoboostScoreCriteria,
  type RoboostScoreObjectName,
} from 'twenty-shared/utils';

export type RoboostScore = {
  id: string;
  name: string;
  description: string | null;
  objectName: RoboostScoreObjectName;
  isActive: boolean;
  scoreMin: number;
  scoreMax: number;
  linkedFieldMetadataId: string | null;
  freezeOnClosedWon: boolean;
  publishedVersionNumber: number | null;
  draft: RoboostScoreCriteria;
  hasDraftChanges: boolean;
  recalcStatus: 'RUNNING' | 'DONE' | 'FAILED' | null;
  recalcTotal: number | null;
  recalcDone: number | null;
  recalcFinishedAt: string | null;
  lastFullRecalcAt: string | null;
  lastVerifiedAt: string | null;
  lastDriftCount: number | null;
  createdAt: string;
  createdByName: string | null;
  updatedAt: string;
  updatedByName: string | null;
};

export type RoboostScoreVersion = {
  id: string;
  version: number;
  criteria: RoboostScoreCriteria;
  publishedAt: string;
  publishedByName: string | null;
  note: string | null;
};

export type RoboostScoreTestResult = {
  breakdown: RoboostScoreBreakdown;
  record: Record<string, unknown>;
  publishedValue: number | null;
  publishedVersionNumber: number | null;
  frozen: boolean;
  frozenAt: string | null;
  frozenVersionNumber: number | null;
  resultSource: string | null;
};

export type RoboostScoreExplanation = {
  scoreId: string;
  scoreName: string;
  value: number | null;
  versionNumber: number | null;
  computedAt: string | null;
  frozen: boolean;
  frozenAt: string | null;
  source: string | null;
  breakdown: RoboostScoreBreakdown | null;
  criteria: RoboostScoreCriteria | null;
  isActive: boolean;
};
