import { TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER } from '@/application/constants/TwentyStandardApplicationUniversalIdentifier';
import { getViewGroupUniversalIdentifier } from '@/application/deterministic-identifier/get-view-group-universal-identifier.util';
import { SERVICE_PIPELINE_SEED } from '@/constants/ServicePipelineSeed';
import { SERVICES_BOARD_VIEW_UNIVERSAL_IDENTIFIER } from '@/metadata/constants/services-board-view-universal-identifier.constant';

// One column per seeded stage, keyed by the stage value
export const SERVICES_BOARD_VIEW_GROUPS: Record<
  string,
  { universalIdentifier: string }
> = Object.fromEntries(
  SERVICE_PIPELINE_SEED.flatMap(({ stages }) => stages).map(({ value }) => [
    value,
    {
      universalIdentifier: getViewGroupUniversalIdentifier({
        applicationUniversalIdentifier:
          TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
        viewUniversalIdentifier: SERVICES_BOARD_VIEW_UNIVERSAL_IDENTIFIER,
        fieldValue: value,
      }),
    },
  ]),
);
