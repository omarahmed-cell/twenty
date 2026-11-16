import { computeDealCloseDateUpdate } from 'src/modules/pipeline/utils/compute-deal-close-date-update.util';

const TODAY = '2026-11-16T09:00:00.000Z';

const compute = (
  args: Partial<Parameters<typeof computeDealCloseDateUpdate>[0]>,
) =>
  computeDealCloseDateUpdate({
    isImport: false,
    isCreate: false,
    previousStageProbability: 40,
    nextStageProbability: 40,
    hasStageChanged: true,
    currentCloseDate: null,
    today: TODAY,
    ...args,
  });

describe('computeDealCloseDateUpdate', () => {
  it('sets Close Date to today when a deal moves into a won or lost stage', () => {
    expect(compute({ nextStageProbability: 100 })).toEqual({
      closeDate: TODAY,
    });
    expect(compute({ nextStageProbability: 0 })).toEqual({ closeDate: TODAY });
  });

  it('clears Close Date when a closed deal moves back to an open stage', () => {
    expect(
      compute({
        previousStageProbability: 100,
        nextStageProbability: 80,
        currentCloseDate: '2026-11-10T00:00:00.000Z',
      }),
    ).toEqual({ closeDate: null });
  });

  it('treats a blank probability as open', () => {
    expect(
      compute({
        previousStageProbability: 0,
        nextStageProbability: null,
        currentCloseDate: '2026-11-10T00:00:00.000Z',
      }),
    ).toEqual({ closeDate: null });
  });

  it('leaves Close Date alone between two open stages or without a stage change', () => {
    expect(compute({ nextStageProbability: 60 })).toBeNull();
    expect(
      compute({ hasStageChanged: false, nextStageProbability: 100 }),
    ).toBeNull();
  });

  it('skips imports, which bring the real close date', () => {
    expect(compute({ isImport: true, nextStageProbability: 100 })).toBeNull();
    expect(
      compute({
        isImport: true,
        previousStageProbability: 100,
        nextStageProbability: 40,
        currentCloseDate: '2026-11-10T00:00:00.000Z',
      }),
    ).toBeNull();
  });

  it('dates a deal created straight into a closed stage unless it has a Close Date', () => {
    expect(compute({ isCreate: true, nextStageProbability: 100 })).toEqual({
      closeDate: TODAY,
    });
    expect(
      compute({
        isCreate: true,
        nextStageProbability: 100,
        currentCloseDate: '2026-11-01T00:00:00.000Z',
      }),
    ).toBeNull();
    expect(compute({ isCreate: true, nextStageProbability: 10 })).toBeNull();
  });
});
