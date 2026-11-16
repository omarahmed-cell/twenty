import {
  buildStageCalculatedPropertyFieldNames,
  buildStageCalculatedPropertyLabel,
  countStageCalculatedProperties,
} from '@/utils/pipeline/stage-calculated-properties';

describe('stage calculated properties', () => {
  it('names the fields from the stage key', () => {
    expect(
      buildStageCalculatedPropertyFieldNames('SALES_DISCOVERY_STAGE'),
    ).toEqual({
      dateEntered: 'dateEnteredSalesDiscoveryStage',
      dateExited: 'dateExitedSalesDiscoveryStage',
      cumulativeTimeIn: 'cumulativeTimeInSalesDiscoveryStage',
      latestTimeIn: 'latestTimeInSalesDiscoveryStage',
    });
  });

  it('labels the fields with the stage and pipeline names', () => {
    expect(
      buildStageCalculatedPropertyLabel({
        kind: 'cumulativeTimeIn',
        stageLabel: '1. Discovery Stage',
        pipelineName: 'Sales Pipeline',
      }),
    ).toBe('Cumulative time in "1. Discovery Stage (Sales Pipeline)"');
  });

  it('counts 4 fields per enabled stage', () => {
    expect(
      countStageCalculatedProperties([
        { calcPropsEnabled: true },
        { calcPropsEnabled: false },
        { calcPropsEnabled: true },
      ]),
    ).toBe(8);
  });
});
