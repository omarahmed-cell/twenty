import { useLingui } from '@lingui/react/macro';
import { type RoboostScoreObjectName } from 'twenty-shared/utils';

export type RoboostScoreObjectLabels = {
  singular: string;
  plural: string;
  testLabel: string;
};

export const useRoboostScoreObjectLabels = (): Record<
  RoboostScoreObjectName,
  RoboostScoreObjectLabels
> => {
  const { t } = useLingui();

  return {
    person: {
      singular: t`Contact`,
      plural: t`Contacts`,
      testLabel: t`Test a contact`,
    },
    company: {
      singular: t`Company`,
      plural: t`Companies`,
      testLabel: t`Test a company`,
    },
    opportunity: {
      singular: t`Deal`,
      plural: t`Deals`,
      testLabel: t`Test a deal`,
    },
  };
};
