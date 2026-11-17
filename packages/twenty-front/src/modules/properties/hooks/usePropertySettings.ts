import { useCallback, useContext, useEffect } from 'react';
import { CoreObjectNameSingular } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

import { ApolloCoreClientContext } from '@/object-metadata/contexts/ApolloCoreClientContext';
import { objectMetadataItemsSelector } from '@/object-metadata/states/objectMetadataItemsSelector';
import { FIND_PROPERTY_SETTINGS } from '@/properties/graphql/findPropertySettings';
import { propertySettingsState } from '@/properties/states/propertySettingsState';
import { type PropertySettings } from '@/properties/types/PropertySettings';
import { useAtomState } from '@/ui/utilities/state/jotai/hooks/useAtomState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';

type Connection<TNode> = { edges: { node: TNode }[] } | undefined;

type FindPropertySettingsResult = {
  propertyGroups: Connection<PropertySettings['groups'][number]>;
  propertyGroupMemberships: Connection<PropertySettings['memberships'][number]>;
  propertyLogicRules: Connection<PropertySettings['rules'][number]>;
  propertyCreations: Connection<PropertySettings['creations'][number]>;
};

// Field cells mount by the hundred, so one network read serves them all for a short while
const REFRESH_INTERVAL_MILLISECONDS = 15_000;

let lastLoadStartedAt = 0;

const toNodes = <TNode>(connection: Connection<TNode>) =>
  connection?.edges.map(({ node }) => node) ?? [];

// Safe anywhere: it reads nothing until the property objects exist, so older workspaces are untouched
export const usePropertySettings = ({ enabled = true } = {}) => {
  const apolloCoreClient = useContext(ApolloCoreClientContext);
  const objectMetadataItems = useAtomStateValue(objectMetadataItemsSelector);
  const [propertySettings, setPropertySettings] = useAtomState(
    propertySettingsState,
  );

  const hasPropertyObjects = objectMetadataItems.some(
    ({ nameSingular }) =>
      nameSingular === CoreObjectNameSingular.PropertyLogicRule,
  );

  const canLoad = enabled && hasPropertyObjects && isDefined(apolloCoreClient);

  const loadPropertySettings = useCallback(
    async ({ force = false }: { force?: boolean } = {}) => {
      if (
        !canLoad ||
        !isDefined(apolloCoreClient) ||
        (!force &&
          Date.now() - lastLoadStartedAt < REFRESH_INTERVAL_MILLISECONDS)
      ) {
        return;
      }

      lastLoadStartedAt = Date.now();

      try {
        const { data } =
          await apolloCoreClient.query<FindPropertySettingsResult>({
            query: FIND_PROPERTY_SETTINGS,
            fetchPolicy: 'network-only',
          });

        setPropertySettings({
          groups: toNodes(data?.propertyGroups),
          memberships: toNodes(data?.propertyGroupMemberships),
          rules: toNodes(data?.propertyLogicRules),
          creations: toNodes(data?.propertyCreations),
        });
      } catch {
        lastLoadStartedAt = 0;
      }
    },
    [canLoad, apolloCoreClient, setPropertySettings],
  );

  useEffect(() => {
    loadPropertySettings();
  }, [loadPropertySettings]);

  return {
    propertySettings,
    reloadPropertySettings: () => loadPropertySettings({ force: true }),
  };
};
