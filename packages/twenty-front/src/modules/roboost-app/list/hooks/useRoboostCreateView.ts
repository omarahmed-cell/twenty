import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import {
  type RoboostSavedViewState,
  useRoboostSavedViewState,
} from '@/roboost-app/list/hooks/useRoboostSavedViewState';
import { usePerformViewApiPersist } from '@/views/hooks/internal/usePerformViewApiPersist';
import { usePerformViewFieldApiPersist } from '@/views/hooks/internal/usePerformViewFieldApiPersist';
import { type View } from '@/views/types/View';
import { ViewVisibility } from 'twenty-shared/types';
import { v4 } from 'uuid';
import { ViewType } from '~/generated-metadata/graphql';

// New and cloned views start with the source view's columns; a clone also takes the current filters and sort
export const useRoboostCreateView = (
  objectMetadataItem: EnrichedObjectMetadataItem,
) => {
  const { performViewApiCreate } = usePerformViewApiPersist();
  const { performViewFieldApiCreate } = usePerformViewFieldApiPersist();
  const { saveViewStateFor } = useRoboostSavedViewState(undefined);

  const createView = async ({
    name,
    sourceView,
    columns,
    state,
    visibility = ViewVisibility.WORKSPACE,
  }: {
    name: string;
    sourceView: View | undefined;
    // The columns as shown, unsaved changes included; falls back to the source view's saved columns
    columns?: { fieldId: string; size: number }[];
    state?: RoboostSavedViewState;
    visibility?: ViewVisibility;
  }) => {
    const viewId = v4();

    await performViewApiCreate(
      {
        input: {
          id: viewId,
          name: name.trim(),
          objectMetadataId: objectMetadataItem.id,
          icon: sourceView?.icon ?? 'IconList',
          type: ViewType.TABLE,
          visibility,
        },
      },
      objectMetadataItem.id,
    );
    const inputs = (
      columns ??
      (sourceView?.viewFields ?? [])
        .filter((viewField) => viewField.isVisible)
        .sort((first, second) => first.position - second.position)
        .map((viewField) => ({
          fieldId: viewField.fieldMetadataId,
          size: viewField.size,
        }))
    ).map(({ fieldId, size }, position) => ({
      fieldMetadataId: fieldId,
      viewId,
      isVisible: true,
      position,
      size,
    }));

    if (inputs.length > 0) {
      await performViewFieldApiCreate({ inputs });
    }
    if (state !== undefined) {
      await saveViewStateFor({ id: viewId, visibility }, state);
    }

    return viewId;
  };

  return { createView };
};
