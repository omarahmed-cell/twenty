export type RoboostFieldHistorySource =
  | 'user'
  | 'workflow'
  | 'import'
  | 'api'
  | 'calculated'
  | 'system';

export type RoboostFieldHistoryEntry = {
  id: string;
  before: unknown;
  after: unknown;
  happensAt: string;
  source: RoboostFieldHistorySource;
  actorName: string | null;
  workflowId: string | null;
};
