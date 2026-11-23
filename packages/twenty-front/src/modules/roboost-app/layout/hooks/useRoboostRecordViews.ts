import { ApolloCoreClientContext } from '@/object-metadata/contexts/ApolloCoreClientContext';
import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { CREATE_RECORD_LAYOUT } from '@/roboost-app/layout/graphql/recordLayoutQueries';
import {
  type RoboostRecordLayoutRecord,
  roboostRecordLayoutsState,
} from '@/roboost-app/layout/states/roboostRecordLayoutsState';
import { type RoboostRecordLayoutConfig } from '@/roboost-app/layout/types/RoboostRecordLayout';
import { getRoboostRecordViewName } from '@/roboost-app/layout/utils/roboostRecordViews';
import { useAtomState } from '@/ui/utilities/state/jotai/hooks/useAtomState';
import { useContext } from 'react';
import { isDefined } from 'twenty-shared/utils';

export type RoboostRecordView = { id: string; name: string };

// Views other than Default are stored now so a team or role can be attached later; only Default is shown on records
export const useRoboostRecordViews = (
  objectMetadataItem: EnrichedObjectMetadataItem,
) => {
  const apolloCoreClient = useContext(ApolloCoreClientContext);
  const [roboostRecordLayouts, setRoboostRecordLayouts] = useAtomState(
    roboostRecordLayoutsState,
  );

  const views: RoboostRecordView[] = (roboostRecordLayouts ?? [])
    .filter((record) => record.objectMetadataId === objectMetadataItem.id)
    .map((record) => ({
      id: record.id,
      name: getRoboostRecordViewName(record),
    }))
    .filter((view): view is RoboostRecordView => isDefined(view.name))
    .sort((first, second) => first.name.localeCompare(second.name));

  const createView = async ({
    name,
    layout,
  }: {
    name: string;
    layout: RoboostRecordLayoutConfig;
  }) => {
    if (!isDefined(apolloCoreClient)) {
      throw new Error('No API client');
    }
    const { data } = await apolloCoreClient.mutate<{
      createRecordLayout: RoboostRecordLayoutRecord;
    }>({
      mutation: CREATE_RECORD_LAYOUT,
      variables: {
        data: {
          objectMetadataId: objectMetadataItem.id,
          layout: { ...layout, viewName: name },
        },
      },
    });
    const created = data?.createRecordLayout;

    if (isDefined(created)) {
      setRoboostRecordLayouts((previous) => [...(previous ?? []), created]);
    }

    return created?.id;
  };

  return { views, createView };
};
