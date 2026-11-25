export type RoboostFieldHistorySource =
  | 'user'
  | 'workflow'
  | 'import'
  | 'api'
  | 'calculated'
  | 'merge'
  | 'system';

export type RoboostFieldHistoryEntry = {
  id: string;
  before: unknown;
  after: unknown;
  happensAt: string;
  source: RoboostFieldHistorySource;
  actorName: string | null;
  workflowId: string | null;
  // Who calculated it, e.g. "Score: Deal fit v3"
  calculatedBy?: string | null;
};
