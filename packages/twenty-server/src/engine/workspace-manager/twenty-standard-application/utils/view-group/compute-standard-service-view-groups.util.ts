import { SERVICES_BOARD_VIEW_GROUPS } from 'twenty-shared/metadata';

import { type FlatViewGroup } from 'src/engine/metadata-modules/flat-view-group/types/flat-view-group.type';
import {
  createStandardViewGroupFlatMetadata,
  type CreateStandardViewGroupArgs,
} from 'src/engine/workspace-manager/twenty-standard-application/utils/view-group/create-standard-view-group-flat-metadata.util';

export const computeStandardServiceViewGroups = (
  args: Omit<CreateStandardViewGroupArgs<'service'>, 'context'>,
): Record<string, FlatViewGroup> =>
  Object.fromEntries(
    Object.keys(SERVICES_BOARD_VIEW_GROUPS).map((stageValue, position) => [
      `servicesBoard${stageValue}`,
      createStandardViewGroupFlatMetadata({
        ...args,
        objectName: 'service',
        context: {
          viewName: 'servicesBoard',
          viewGroupName: stageValue,
          isVisible: true,
          fieldValue: stageValue,
          position,
        },
      }),
    ]),
  );
