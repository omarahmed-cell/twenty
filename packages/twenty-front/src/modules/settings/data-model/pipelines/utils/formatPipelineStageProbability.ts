import { t } from '@lingui/core/macro';
import { getDealStageStatus, isDefined } from 'twenty-shared/utils';

export const formatPipelineStageProbability = (
  probability: number | null | undefined,
): string => {
  if (!isDefined(probability)) {
    return '—';
  }

  switch (getDealStageStatus(probability)) {
    case 'WON':
      return t`${probability}% (Won)`;
    case 'LOST':
      return t`${probability}% (Lost)`;
    default:
      return `${probability}%`;
  }
};
