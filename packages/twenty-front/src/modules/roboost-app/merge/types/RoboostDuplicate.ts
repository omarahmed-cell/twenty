import {
  type RoboostDuplicateConfidence,
  type RoboostDuplicatePairStatus,
  type RoboostDuplicateRuleKey,
} from 'twenty-shared/constants';
import { type RoboostRecordScope } from 'twenty-shared/types';

export type RoboostDuplicateRecordSummary = {
  id: string;
  name: string;
  keyText: string;
  createdAt: string | null;
  filledCount: number;
};

export type RoboostDuplicatePair = {
  id: string;
  confidence: RoboostDuplicateConfidence;
  reasons: RoboostDuplicateRuleKey[];
  status: RoboostDuplicatePairStatus;
  detectedAt: string;
  resolvedAt: string | null;
  resolvedByName: string | null;
  recordA: RoboostDuplicateRecordSummary;
  recordB: RoboostDuplicateRecordSummary;
};

export type RoboostDuplicateRuleSetting = {
  key: RoboostDuplicateRuleKey;
  label: string;
  confidence: RoboostDuplicateConfidence | null;
  isEnabled: boolean;
};

export type RoboostDuplicateOverview = {
  isAvailable: boolean;
  mergeScope: RoboostRecordScope;
  openCount: number;
  settings: {
    rules: RoboostDuplicateRuleSetting[];
    lastScanAt: string | null;
    lastScanPairCount: number | null;
  };
};

export type RoboostBulkMergePair = {
  pairId: string;
  primaryId: string;
  secondaryId: string;
  primaryName: string;
  secondaryName: string;
};

export type RoboostBulkMergeRun = {
  id: string;
  objectName: string;
  status: 'RUNNING' | 'DONE' | 'FAILED';
  total: number;
  doneCount: number;
  failedCount: number;
  startedByName: string | null;
  startedAt: string;
  finishedAt: string | null;
  pairs: RoboostBulkMergePair[];
  results: (RoboostBulkMergePair & {
    status: 'MERGED' | 'SKIPPED' | 'FAILED';
    mergeId: string | null;
    message: string | null;
  })[];
};
