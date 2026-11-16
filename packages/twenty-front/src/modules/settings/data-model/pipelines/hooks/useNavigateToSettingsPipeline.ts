import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import { useOpenSettingsMenu } from '@/navigation/hooks/useOpenSettings';
import { getSettingsPipelinePath } from '@/settings/data-model/pipelines/utils/getSettingsPipelinePath';
import { useWorkspaceSurface } from '@/ui/layout/hooks/useWorkspaceSurface';

export const useNavigateToSettingsPipeline = () => {
  const navigate = useNavigate();
  const { openSettingsMenu } = useOpenSettingsMenu();
  const workspaceSurface = useWorkspaceSurface();

  return useCallback(
    ({
      objectNamePlural,
      pipelineId,
    }: {
      objectNamePlural: string;
      pipelineId?: string;
    }) => {
      if (
        workspaceSurface.type === 'main' ||
        !workspaceSurface.ownsRouteLocation
      ) {
        openSettingsMenu();
      }

      return navigate(
        getSettingsPipelinePath({ objectNamePlural, pipelineId }),
      );
    },
    [navigate, openSettingsMenu, workspaceSurface],
  );
};
