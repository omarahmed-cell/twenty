import { type useLingui } from '@lingui/react/macro';

type Translate = ReturnType<typeof useLingui>['t'];

export const formatRoboostRateSource = (
  t: Translate,
  source: string | null,
  setByName: string | null,
) => {
  switch (source) {
    case 'AUTOMATIC':
      return t`Automatic update`;
    case 'IMPORT':
      return t`Imported from ${setByName ?? 'HubSpot'}`;
    case 'MANUAL':
      return setByName ? t`Manual by ${setByName}` : t`Manual`;
    default:
      return setByName ?? '';
  }
};
