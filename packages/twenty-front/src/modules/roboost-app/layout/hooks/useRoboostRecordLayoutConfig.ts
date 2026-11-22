import { ApolloCoreClientContext } from '@/object-metadata/contexts/ApolloCoreClientContext';
import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { propertySettingsState } from '@/properties/states/propertySettingsState';
import { useRoboostPropertySections } from '@/roboost-app/hooks/useRoboostPropertySections';
import {
  CREATE_RECORD_LAYOUT,
  FIND_RECORD_LAYOUTS,
  UPDATE_RECORD_LAYOUT,
} from '@/roboost-app/layout/graphql/recordLayoutQueries';
import {
  type RoboostRecordLayoutRecord,
  roboostRecordLayoutsState,
} from '@/roboost-app/layout/states/roboostRecordLayoutsState';
import { type RoboostRecordLayoutConfig } from '@/roboost-app/layout/types/RoboostRecordLayout';
import {
  buildRoboostDefaultRecordLayout,
  resolveRoboostRecordLayout,
  type RoboostOverviewSectionTitles,
} from '@/roboost-app/layout/utils/resolveRoboostRecordLayout';
import { getRoboostAssociations } from '@/roboost-app/record/utils/getRoboostAssociations';
import { useAtomState } from '@/ui/utilities/state/jotai/hooks/useAtomState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { useLingui } from '@lingui/react/macro';
import { useCallback, useContext, useEffect } from 'react';
import { CoreObjectNameSingular } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

type Connection<TNode> = { edges: { node: TNode }[] } | undefined;

const REFRESH_INTERVAL_MILLISECONDS = 10_000;

let lastLoadStartedAt = 0;
const materializedObjectIds = new Set<string>();

// The workspace-wide layout of each object; roleId and teamId stay empty until per-role layouts exist
export const useRoboostRecordLayoutConfig = (
  objectMetadataItem: EnrichedObjectMetadataItem,
  objectMetadataItems: EnrichedObjectMetadataItem[],
) => {
  const { t } = useLingui();
  const apolloCoreClient = useContext(ApolloCoreClientContext);
  const [roboostRecordLayouts, setRoboostRecordLayouts] = useAtomState(
    roboostRecordLayoutsState,
  );
  const propertySettings = useAtomStateValue(propertySettingsState);
  const sections = useRoboostPropertySections(objectMetadataItem);

  const hasLayoutObject = objectMetadataItems.some(
    (item) => item.nameSingular === CoreObjectNameSingular.RecordLayout,
  );
  const hasPropertyObjects = objectMetadataItems.some(
    (item) => item.nameSingular === CoreObjectNameSingular.PropertyLogicRule,
  );

  const overviewTitles: RoboostOverviewSectionTitles = {
    openTasks: t`Open tasks`,
    pinnedActivities: t`Pinned activities`,
    latestActivity: t`Latest activity`,
  };
  const associations = getRoboostAssociations(
    objectMetadataItem,
    objectMetadataItems,
    t`Attachments`,
  );
  const defaultLayout = buildRoboostDefaultRecordLayout({
    sections,
    associations,
    overviewTitles,
  });

  const loadLayouts = useCallback(
    async ({ force = false }: { force?: boolean } = {}) => {
      if (
        !hasLayoutObject ||
        !isDefined(apolloCoreClient) ||
        (!force &&
          Date.now() - lastLoadStartedAt < REFRESH_INTERVAL_MILLISECONDS)
      ) {
        return;
      }
      lastLoadStartedAt = Date.now();
      try {
        const { data } = await apolloCoreClient.query<{
          recordLayouts: Connection<RoboostRecordLayoutRecord>;
        }>({ query: FIND_RECORD_LAYOUTS, fetchPolicy: 'network-only' });

        setRoboostRecordLayouts(
          data?.recordLayouts?.edges.map(({ node }) => node) ?? [],
        );
      } catch {
        lastLoadStartedAt = 0;
      }
    },
    [hasLayoutObject, apolloCoreClient, setRoboostRecordLayouts],
  );

  const storedRecord = roboostRecordLayouts?.find(
    (record) =>
      record.objectMetadataId === objectMetadataItem.id &&
      !isDefined(record.roleId) &&
      !isDefined(record.teamId),
  );

  const save = useCallback(
    async (layout: RoboostRecordLayoutConfig) => {
      if (!isDefined(apolloCoreClient)) {
        throw new Error('No API client');
      }
      const currentRecord = roboostRecordLayouts?.find(
        (record) =>
          record.objectMetadataId === objectMetadataItem.id &&
          !isDefined(record.roleId) &&
          !isDefined(record.teamId),
      );
      const { data } = isDefined(currentRecord)
        ? await apolloCoreClient.mutate<{
            updateRecordLayout: RoboostRecordLayoutRecord;
          }>({
            mutation: UPDATE_RECORD_LAYOUT,
            variables: { id: currentRecord.id, data: { layout } },
          })
        : await apolloCoreClient.mutate<{
            createRecordLayout: RoboostRecordLayoutRecord;
          }>({
            mutation: CREATE_RECORD_LAYOUT,
            variables: {
              data: { objectMetadataId: objectMetadataItem.id, layout },
            },
          });
      const savedRecord =
        data !== null && data !== undefined
          ? 'updateRecordLayout' in data
            ? data.updateRecordLayout
            : data.createRecordLayout
          : undefined;

      if (isDefined(savedRecord)) {
        setRoboostRecordLayouts((previous) => [
          ...(previous ?? []).filter((record) => record.id !== savedRecord.id),
          savedRecord,
        ]);
      }
    },
    [
      apolloCoreClient,
      roboostRecordLayouts,
      objectMetadataItem.id,
      setRoboostRecordLayouts,
    ],
  );

  useEffect(() => {
    loadLayouts();
  }, [loadLayouts]);

  const isDefaultReady =
    isDefined(roboostRecordLayouts) &&
    (!hasPropertyObjects || isDefined(propertySettings));

  // Freezes today's groups as the layout the first time an admin's session sees an object
  useEffect(() => {
    if (
      !hasLayoutObject ||
      !isDefaultReady ||
      isDefined(storedRecord) ||
      materializedObjectIds.has(objectMetadataItem.id)
    ) {
      return;
    }
    materializedObjectIds.add(objectMetadataItem.id);
    save(defaultLayout).catch(() => {});
    // defaultLayout is rebuilt every render; readiness decides when it is final
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasLayoutObject, isDefaultReady, storedRecord, objectMetadataItem.id]);

  const layout = resolveRoboostRecordLayout({
    stored: storedRecord?.layout,
    fallback: defaultLayout,
    objectMetadataItem,
    associations,
    overviewTitles,
  });

  return {
    layout,
    defaultLayout,
    associations,
    isStored: isDefined(storedRecord),
    isReady: isDefaultReady || !hasLayoutObject,
    save,
    reload: () => loadLayouts({ force: true }),
  };
};
