import { useContext, useEffect } from 'react';

import { ApolloCoreClientContext } from '@/object-metadata/contexts/ApolloCoreClientContext';
import { objectMetadataItemsSelector } from '@/object-metadata/states/objectMetadataItemsSelector';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { FIND_DEAL_PIPELINE_CONFIGS } from '@/pipeline/stage-picker/graphql/findDealPipelineConfigs';
import { dealPipelineConfigsState } from '@/pipeline/stage-picker/states/dealPipelineConfigsState';
import { buildPipelineConfigs } from '@/pipeline/utils/buildPipelineConfigs';
import { useAtomState } from '@/ui/utilities/state/jotai/hooks/useAtomState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { CoreObjectNameSingular } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

type ConnectionResult = { edges: { node: ObjectRecord }[] } | undefined;

// Pickers mount by the dozen, so one network read serves them all for a short while
const REFRESH_INTERVAL_MILLISECONDS = 15_000;

let lastLoadStartedAt = 0;

// Safe anywhere: it reads nothing until the pipeline objects exist, so other objects and older workspaces are untouched
export const useDealStagePipelineConfigs = ({
  enabled,
}: {
  enabled: boolean;
}) => {
  const apolloCoreClient = useContext(ApolloCoreClientContext);
  const objectMetadataItems = useAtomStateValue(objectMetadataItemsSelector);
  const [dealPipelineConfigs, setDealPipelineConfigs] = useAtomState(
    dealPipelineConfigsState,
  );

  const hasPipelineObjects =
    objectMetadataItems.some(
      ({ nameSingular }) => nameSingular === CoreObjectNameSingular.Pipeline,
    ) &&
    objectMetadataItems.some(
      ({ nameSingular }) =>
        nameSingular === CoreObjectNameSingular.PipelineStage,
    );

  const canLoad = enabled && hasPipelineObjects && isDefined(apolloCoreClient);

  useEffect(() => {
    if (
      !canLoad ||
      !isDefined(apolloCoreClient) ||
      Date.now() - lastLoadStartedAt < REFRESH_INTERVAL_MILLISECONDS
    ) {
      return;
    }

    lastLoadStartedAt = Date.now();

    apolloCoreClient
      .query<{ pipelines: ConnectionResult; pipelineStages: ConnectionResult }>(
        { query: FIND_DEAL_PIPELINE_CONFIGS, fetchPolicy: 'network-only' },
      )
      .then(({ data }) => {
        setDealPipelineConfigs(
          buildPipelineConfigs({
            pipelineRecords:
              data?.pipelines?.edges.map(({ node }) => node) ?? [],
            pipelineStageRecords:
              data?.pipelineStages?.edges.map(({ node }) => node) ?? [],
          }).filter(
            ({ objectNameSingular }) =>
              objectNameSingular === CoreObjectNameSingular.Opportunity,
          ),
        );
      })
      .catch(() => {
        lastLoadStartedAt = 0;
      });
  }, [canLoad, apolloCoreClient, setDealPipelineConfigs]);

  return dealPipelineConfigs;
};
