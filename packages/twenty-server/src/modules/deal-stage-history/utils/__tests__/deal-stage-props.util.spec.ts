import {
  applyDealStageMove,
  computeTimeInCurrentStage,
  type DealStageMove,
  fillEmptyDealStageProps,
  replayDealStageHistory,
} from 'src/modules/deal-stage-history/utils/deal-stage-props.util';

const day = (dayOfMonth: number, hour = 0) =>
  new Date(Date.UTC(2026, 10, dayOfMonth, hour)).toISOString();

const move = (
  fromStage: string | null,
  toStage: string | null,
  changedAt: string,
): DealStageMove => ({ fromStage, toStage, changedAt });

describe('deal stage props', () => {
  it('tracks entered, exited, latest and cumulative over several moves', () => {
    const props = replayDealStageHistory([
      move(null, 'DISCOVERY', day(1)),
      move('DISCOVERY', 'QUALIFIED', day(3)),
      move('QUALIFIED', 'COMMERCIAL', day(6, 12)),
    ]);

    expect(props.DISCOVERY).toEqual({
      dateEntered: day(1),
      dateExited: day(3),
      latestTimeIn: 2,
      cumulativeTimeIn: 2,
    });
    expect(props.QUALIFIED).toEqual({
      dateEntered: day(3),
      dateExited: day(6, 12),
      latestTimeIn: 3.5,
      cumulativeTimeIn: 3.5,
    });
    expect(props.COMMERCIAL).toMatchObject({
      dateEntered: day(6, 12),
      dateExited: null,
      latestTimeIn: null,
    });
  });

  it('keeps the latest entry on re-entry and adds up every stay', () => {
    const props = replayDealStageHistory([
      move(null, 'QUALIFIED', day(1)),
      move('QUALIFIED', 'COMMERCIAL', day(3)),
      move('COMMERCIAL', 'QUALIFIED', day(4)),
      move('QUALIFIED', 'COMMERCIAL', day(5)),
    ]);

    expect(props.QUALIFIED).toEqual({
      dateEntered: day(4),
      dateExited: day(5),
      latestTimeIn: 1,
      cumulativeTimeIn: 3,
    });
  });

  it('treats a pipeline change as leaving one stage and entering the other', () => {
    expect(
      applyDealStageMove({
        propsByStage: {
          PILOT_SIGNED: {
            dateEntered: day(1),
            dateExited: null,
            cumulativeTimeIn: null,
            latestTimeIn: null,
          },
        },
        move: move('PILOT_SIGNED', 'SALES_DISCOVERY', day(2)),
      }),
    ).toEqual({
      PILOT_SIGNED: {
        dateEntered: day(1),
        dateExited: day(2),
        latestTimeIn: 1,
        cumulativeTimeIn: 1,
      },
      SALES_DISCOVERY: {
        dateEntered: day(2),
        dateExited: null,
        cumulativeTimeIn: null,
        latestTimeIn: null,
      },
    });
  });

  it('builds on values the loader wrote', () => {
    expect(
      applyDealStageMove({
        propsByStage: {
          QUALIFIED: {
            dateEntered: day(10),
            dateExited: day(2),
            cumulativeTimeIn: 30,
            latestTimeIn: 5,
          },
        },
        move: move('QUALIFIED', 'COMMERCIAL', day(12)),
      }).QUALIFIED,
    ).toMatchObject({ cumulativeTimeIn: 32, latestTimeIn: 2 });
  });

  it('counts earlier stays in the current stage in time in current stage', () => {
    expect(
      computeTimeInCurrentStage({
        cumulativeTimeIn: 3,
        dateEnteredCurrentStage: day(4),
        now: day(5, 12),
      }),
    ).toBe(4.5);
    expect(
      computeTimeInCurrentStage({
        cumulativeTimeIn: null,
        dateEnteredCurrentStage: null,
        now: day(5),
      }),
    ).toBeNull();
  });

  it('only fills empty values from history', () => {
    expect(
      fillEmptyDealStageProps({
        stored: {
          dateEntered: day(1),
          dateExited: null,
          cumulativeTimeIn: 30,
          latestTimeIn: null,
        },
        fromHistory: {
          dateEntered: day(9),
          dateExited: day(10),
          cumulativeTimeIn: 1,
          latestTimeIn: 1,
        },
      }),
    ).toEqual({ dateExited: day(10), latestTimeIn: 1 });
  });
});
