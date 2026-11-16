import { isDefined } from 'twenty-shared/utils';

export type DealStageProps = {
  dateEntered: string | null;
  dateExited: string | null;
  cumulativeTimeIn: number | null;
  latestTimeIn: number | null;
};

export type DealStageMove = {
  fromStage: string | null;
  toStage: string | null;
  changedAt: string;
};

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

export const EMPTY_DEAL_STAGE_PROPS: DealStageProps = {
  dateEntered: null,
  dateExited: null,
  cumulativeTimeIn: null,
  latestTimeIn: null,
};

const toTime = (value: string | Date | null | undefined) =>
  isDefined(value) ? new Date(value).getTime() : null;

export const roundDays = (days: number) => Math.round(days * 10) / 10;

export const daysBetween = (
  start: string | Date | null | undefined,
  end: string | Date | null | undefined,
): number | null => {
  const startTime = toTime(start);
  const endTime = toTime(end);

  return isDefined(startTime) && isDefined(endTime)
    ? Math.max(0, endTime - startTime) / MILLISECONDS_PER_DAY
    : null;
};

// Leaving a stage closes its stay (exited, latest, cumulative); entering one only stamps entered
export const applyDealStageMove = ({
  propsByStage,
  move,
}: {
  propsByStage: Record<string, DealStageProps>;
  move: DealStageMove;
}): Record<string, DealStageProps> => {
  const { fromStage, toStage, changedAt } = move;

  if (fromStage === toStage) {
    return {};
  }

  const changed: Record<string, DealStageProps> = {};

  if (isDefined(fromStage)) {
    const previous = propsByStage[fromStage] ?? EMPTY_DEAL_STAGE_PROPS;
    const stayDays = daysBetween(previous.dateEntered, changedAt);

    changed[fromStage] = {
      ...previous,
      dateExited: changedAt,
      ...(isDefined(stayDays)
        ? {
            latestTimeIn: roundDays(stayDays),
            cumulativeTimeIn: roundDays(
              (previous.cumulativeTimeIn ?? 0) + stayDays,
            ),
          }
        : {}),
    };
  }

  if (isDefined(toStage)) {
    changed[toStage] = {
      ...(changed[toStage] ?? propsByStage[toStage] ?? EMPTY_DEAL_STAGE_PROPS),
      dateEntered: changedAt,
    };
  }

  return changed;
};

export const replayDealStageHistory = (
  moves: DealStageMove[],
): Record<string, DealStageProps> =>
  [...moves]
    .sort((first, second) => first.changedAt.localeCompare(second.changedAt))
    .reduce<Record<string, DealStageProps>>(
      (propsByStage, move) => ({
        ...propsByStage,
        ...applyDealStageMove({ propsByStage, move }),
      }),
      {},
    );

// Earlier stays in the current stage count too, plus the ongoing one
export const computeTimeInCurrentStage = ({
  cumulativeTimeIn,
  dateEnteredCurrentStage,
  now,
}: {
  cumulativeTimeIn: number | null;
  dateEnteredCurrentStage: string | Date | null;
  now: string;
}): number | null => {
  const ongoingDays = daysBetween(dateEnteredCurrentStage, now);

  return isDefined(ongoingDays)
    ? roundDays((cumulativeTimeIn ?? 0) + ongoingDays)
    : null;
};

// Values the loader wrote (HubSpot history) are never overwritten; history only fills gaps
export const fillEmptyDealStageProps = ({
  stored,
  fromHistory,
}: {
  stored: DealStageProps;
  fromHistory: DealStageProps | undefined;
}): Partial<DealStageProps> => {
  if (!isDefined(fromHistory)) {
    return {};
  }

  return Object.fromEntries(
    (Object.keys(stored) as (keyof DealStageProps)[])
      .filter((key) => !isDefined(stored[key]) && isDefined(fromHistory[key]))
      .map((key) => [key, fromHistory[key]]),
  ) as Partial<DealStageProps>;
};
