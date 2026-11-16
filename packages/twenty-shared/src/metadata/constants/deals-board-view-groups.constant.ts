import { TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER } from '@/application/constants/TwentyStandardApplicationUniversalIdentifier';
import { getViewGroupUniversalIdentifier } from '@/application/deterministic-identifier/get-view-group-universal-identifier.util';
import { PIPELINE_SEED } from '@/constants/PipelineSeed';
import { DEALS_BOARD_VIEW_UNIVERSAL_IDENTIFIER } from '@/metadata/constants/deals-board-view-universal-identifier.constant';

// One column per seeded stage, keyed by the stage value
export const DEALS_BOARD_VIEW_GROUPS: Record<
  string,
  { universalIdentifier: string }
> = Object.fromEntries(
  PIPELINE_SEED.flatMap(({ stages }) => stages).map(({ value }) => [
    value,
    {
      universalIdentifier: getViewGroupUniversalIdentifier({
        applicationUniversalIdentifier:
          TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
        viewUniversalIdentifier: DEALS_BOARD_VIEW_UNIVERSAL_IDENTIFIER,
        fieldValue: value,
      }),
    },
  ]),
);
