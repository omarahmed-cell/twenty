import { type PipelineConfig } from '@/pipeline/types/PipelineConfig';
import { getStageHistoryFieldNames } from '@/settings/data-model/pipelines/utils/getStageHistoryFieldNames';

const pipeline = (stageValues: string[]) =>
  ({
    stages: stageValues.map((value) => ({ value })),
  }) as PipelineConfig;

describe('getStageHistoryFieldNames', () => {
  it('lists the 4 generated field names of every stage of every pipeline', () => {
    const fieldNames = getStageHistoryFieldNames([
      pipeline(['SALES_DISCOVERY_STAGE']),
      pipeline(['PILOT_QUALIFIED_TO_BUY']),
    ]);

    expect([...fieldNames]).toEqual([
      'dateEnteredSalesDiscoveryStage',
      'dateExitedSalesDiscoveryStage',
      'cumulativeTimeInSalesDiscoveryStage',
      'latestTimeInSalesDiscoveryStage',
      'dateEnteredPilotQualifiedToBuy',
      'dateExitedPilotQualifiedToBuy',
      'cumulativeTimeInPilotQualifiedToBuy',
      'latestTimeInPilotQualifiedToBuy',
    ]);
  });

  it('is empty without pipelines', () => {
    expect(getStageHistoryFieldNames([]).size).toBe(0);
  });
});
