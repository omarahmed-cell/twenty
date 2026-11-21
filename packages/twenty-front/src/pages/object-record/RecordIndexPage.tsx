import { WorkspaceRouteUnavailable } from '@/ui/layout/page/components/WorkspaceRouteUnavailable';
import { contextStoreCurrentObjectMetadataItemIdComponentState } from '@/context-store/states/contextStoreCurrentObjectMetadataItemIdComponentState';
import { useObjectMetadataItems } from '@/object-metadata/hooks/useObjectMetadataItems';
import { RecordIndexContainerGater } from '@/object-record/record-index/components/RecordIndexContainerGater';
import { isWorkspaceWorkflowVersionRouteHidden } from '@/object-core/workflows/utils/isWorkspaceWorkflowVersionRouteHidden';
import { RecordIndexSkeletonLoader } from '@/object-record/record-index/components/RecordIndexSkeletonLoader';
import { useWorkspaceSurface } from '@/ui/layout/hooks/useWorkspaceSurface';
import { PageContainer } from '@/ui/layout/page/components/PageContainer';
import { useAtomComponentStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomComponentStateValue';
import { metadataStoreState } from '@/metadata-store/states/metadataStoreState';
import { useAtomFamilyStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomFamilyStateValue';
import { isUndefined } from '@sniptt/guards';
import { RoboostObjectListPage } from '@/roboost-app/list/components/RoboostObjectListPage';
import { useIsRoboostUiEnabled } from '@/roboost-app/hooks/useIsRoboostUiEnabled';
import { lazy, Suspense } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { CoreObjectNameSingular } from 'twenty-shared/types';

const ROBOOST_CLASSIC_ONLY_OBJECTS = new Set<string>([
  CoreObjectNameSingular.Workflow,
  CoreObjectNameSingular.WorkflowVersion,
  CoreObjectNameSingular.WorkflowRun,
  CoreObjectNameSingular.Dashboard,
]);

const WorkflowCoreIndexPage = lazy(() =>
  import('~/pages/object-core/WorkflowCoreIndexPage').then((module) => ({
    default: module.WorkflowCoreIndexPage,
  })),
);

export const RecordIndexPage = () => {
  const workspaceSurface = useWorkspaceSurface();
  const { objectNamePlural } = useParams<{ objectNamePlural: string }>();
  const [searchParams] = useSearchParams();
  const isRoboostUiEnabled = useIsRoboostUiEnabled();

  const contextStoreCurrentObjectMetadataItemId = useAtomComponentStateValue(
    contextStoreCurrentObjectMetadataItemIdComponentState,
  );

  const { objectMetadataItems } = useObjectMetadataItems();
  const metadataStore = useAtomFamilyStateValue(
    metadataStoreState,
    'objectMetadataItems',
  );

  const routeObjectMetadataItem = objectMetadataItems.find(
    (objectMetadataItem) => objectMetadataItem.namePlural === objectNamePlural,
  );

  if (
    isRoboostUiEnabled &&
    workspaceSurface.type === 'main' &&
    searchParams.get('view') !== 'classic' &&
    !isUndefined(routeObjectMetadataItem) &&
    !ROBOOST_CLASSIC_ONLY_OBJECTS.has(routeObjectMetadataItem.nameSingular)
  ) {
    return (
      <RoboostObjectListPage
        key={routeObjectMetadataItem.id}
        objectMetadataItem={routeObjectMetadataItem}
      />
    );
  }

  if (
    workspaceSurface.type === 'side-panel' &&
    metadataStore.status === 'empty'
  ) {
    return <RecordIndexSkeletonLoader />;
  }

  if (
    workspaceSurface.type === 'side-panel' &&
    !isUndefined(objectNamePlural) &&
    isUndefined(routeObjectMetadataItem)
  ) {
    return <WorkspaceRouteUnavailable />;
  }

  if (isUndefined(contextStoreCurrentObjectMetadataItemId)) {
    return <RecordIndexSkeletonLoader />;
  }

  const objectMetadataItem = objectMetadataItems.find(
    (objectMetadataItem) =>
      objectMetadataItem.id === contextStoreCurrentObjectMetadataItemId,
  );

  if (isUndefined(objectMetadataItem)) {
    return <RecordIndexSkeletonLoader />;
  }

  if (
    isWorkspaceWorkflowVersionRouteHidden({
      objectNameSingular: routeObjectMetadataItem?.nameSingular,
    })
  ) {
    return <WorkspaceRouteUnavailable />;
  }

  if (objectMetadataItem.nameSingular === CoreObjectNameSingular.Workflow) {
    return (
      <Suspense fallback={<RecordIndexSkeletonLoader />}>
        <WorkflowCoreIndexPage />
      </Suspense>
    );
  }

  if (workspaceSurface.type === 'side-panel') {
    return <RecordIndexContainerGater />;
  }

  return (
    <PageContainer>
      <RecordIndexContainerGater />
    </PageContainer>
  );
};
