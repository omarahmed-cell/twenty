import { Navigate, useParams, useSearchParams } from 'react-router-dom';
import { AppPath, CoreObjectNameSingular } from 'twenty-shared/types';
import { getAppPath, isDefined } from 'twenty-shared/utils';

import { RoboostMeetingRecordPage } from '@/roboost-app/meeting/components/RoboostMeetingRecordPage';
import { RoboostRecordPage } from '@/roboost-app/record/components/RoboostRecordPage';
import { useIsRoboostUiEnabled } from '@/roboost-app/hooks/useIsRoboostUiEnabled';
import { WorkspaceRouteUnavailable } from '@/ui/layout/page/components/WorkspaceRouteUnavailable';
import { findCoreObjectShowPage } from '@/object-core/utils/findCoreObjectShowPage';
import { isWorkspaceWorkflowVersionRouteHidden } from '@/object-core/workflows/utils/isWorkspaceWorkflowVersionRouteHidden';
import { useObjectMetadataItems } from '@/object-metadata/hooks/useObjectMetadataItems';
import { useWorkspaceSurface } from '@/ui/layout/hooks/useWorkspaceSurface';
import { AiChatThreadPageContent } from '~/pages/ai-chat/AiChatThreadPageContent';
import {
  type RecordShowPageParameters,
  RecordShowPageContent,
} from '~/pages/object-record/RecordShowPageContent';

const ROBOOST_CLASSIC_ONLY_OBJECTS = new Set<string>([
  CoreObjectNameSingular.Workflow,
  CoreObjectNameSingular.WorkflowVersion,
  CoreObjectNameSingular.WorkflowRun,
  CoreObjectNameSingular.Dashboard,
  CoreObjectNameSingular.AgentChatThread,
]);

export const RecordShowPage = () => {
  const parameters = useParams<RecordShowPageParameters>();
  const workspaceSurface = useWorkspaceSurface();
  const { objectMetadataItems } = useObjectMetadataItems();
  const [searchParams] = useSearchParams();
  const isRoboostUiEnabled = useIsRoboostUiEnabled();

  const isInSidePanel = workspaceSurface.type === 'side-panel';
  const isRouteObjectMetadataAvailable =
    isDefined(parameters.objectNameSingular) &&
    objectMetadataItems.some(
      (objectMetadataItem) =>
        objectMetadataItem.nameSingular === parameters.objectNameSingular,
    );

  if (isInSidePanel && !isRouteObjectMetadataAvailable) {
    return <WorkspaceRouteUnavailable />;
  }

  if (
    isRoboostUiEnabled &&
    !isInSidePanel &&
    isRouteObjectMetadataAvailable &&
    isDefined(parameters.objectNameSingular) &&
    !ROBOOST_CLASSIC_ONLY_OBJECTS.has(parameters.objectNameSingular) &&
    isDefined(parameters.objectRecordId) &&
    searchParams.get('view') !== 'classic'
  ) {
    if (parameters.objectNameSingular === CoreObjectNameSingular.Meeting) {
      return (
        <RoboostMeetingRecordPage
          key={parameters.objectRecordId}
          recordId={parameters.objectRecordId}
        />
      );
    }

    return (
      <RoboostRecordPage
        key={parameters.objectRecordId}
        objectNameSingular={parameters.objectNameSingular}
        recordId={parameters.objectRecordId}
      />
    );
  }

  if (
    parameters.objectNameSingular === CoreObjectNameSingular.AgentChatThread &&
    isDefined(parameters.objectRecordId)
  ) {
    // A chat's record page is the chat page, on its own route
    if (!isInSidePanel) {
      return (
        <Navigate
          replace
          to={getAppPath(AppPath.AiChat, {
            threadId: parameters.objectRecordId,
          })}
        />
      );
    }

    return <AiChatThreadPageContent threadId={parameters.objectRecordId} />;
  }

  if (
    isWorkspaceWorkflowVersionRouteHidden({
      objectNameSingular: parameters.objectNameSingular,
    })
  ) {
    return <WorkspaceRouteUnavailable />;
  }

  const CoreObjectShowPage = findCoreObjectShowPage(
    parameters.objectNameSingular,
  );

  if (isDefined(CoreObjectShowPage) && isDefined(parameters.objectRecordId)) {
    return <CoreObjectShowPage objectRecordId={parameters.objectRecordId} />;
  }

  return <RecordShowPageContent parameters={parameters} />;
};
