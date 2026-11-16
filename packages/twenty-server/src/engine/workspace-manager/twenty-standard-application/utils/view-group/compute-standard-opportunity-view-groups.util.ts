import { DEALS_BOARD_VIEW_GROUPS } from 'twenty-shared/metadata';

import { type FlatViewGroup } from 'src/engine/metadata-modules/flat-view-group/types/flat-view-group.type';
import {
  createStandardViewGroupFlatMetadata,
  type CreateStandardViewGroupArgs,
} from 'src/engine/workspace-manager/twenty-standard-application/utils/view-group/create-standard-view-group-flat-metadata.util';

export const computeStandardOpportunityViewGroups = (
  args: Omit<CreateStandardViewGroupArgs<'opportunity'>, 'context'>,
): Record<string, FlatViewGroup> =>
  Object.fromEntries(
    Object.keys(DEALS_BOARD_VIEW_GROUPS).map((stageValue, position) => [
      `byStage${stageValue}`,
      createStandardViewGroupFlatMetadata({
        ...args,
        objectName: 'opportunity',
        context: {
          viewName: 'byStage',
          viewGroupName: stageValue,
          isVisible: true,
          fieldValue: stageValue,
          position,
        },
      }),
    ]),
  );
