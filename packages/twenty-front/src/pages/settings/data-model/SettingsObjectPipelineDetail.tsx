import { useLingui } from '@lingui/react/macro';
import { useParams } from 'react-router-dom';
import { SettingsPath } from 'twenty-shared/types';
import { getSettingsPath, isDefined } from 'twenty-shared/utils';

import { useFilteredObjectMetadataItems } from '@/object-metadata/hooks/useFilteredObjectMetadataItems';
import { usePipelineConfigs } from '@/pipeline/hooks/usePipelineConfigs';
import { useHasPipelineObjects } from '@/pipeline/hooks/useHasPipelineObjects';
import { SettingsPageContainer } from '@/settings/components/SettingsPageContainer';
import { SettingsPageLayout } from '@/settings/components/layout/SettingsPageLayout';
import { SettingsPipelineAboutSection } from '@/settings/data-model/pipelines/components/SettingsPipelineAboutSection';
import { SettingsPipelineCalcPropsSummary } from '@/settings/data-model/pipelines/components/SettingsPipelineCalcPropsSummary';
import { SettingsPipelineRulesSection } from '@/settings/data-model/pipelines/components/SettingsPipelineRulesSection';
import { SettingsPipelineStagesSection } from '@/settings/data-model/pipelines/components/SettingsPipelineStagesSection';
import { PIPELINE_ENABLED_OBJECT_NAMES } from '@/settings/data-model/pipelines/constants/PipelineEnabledObjectNames';
import { WorkspaceRouteUnavailable } from '@/ui/layout/page/components/WorkspaceRouteUnavailable';

const SettingsObjectPipelineDetailContent = () => {
  const { t } = useLingui();
  const { objectNamePlural = '', pipelineId = '' } = useParams();
  const { findObjectMetadataItemByNamePlural } =
    useFilteredObjectMetadataItems();

  const objectMetadataItem =
    findObjectMetadataItemByNamePlural(objectNamePlural);

  const isPipelineEnabled =
    isDefined(objectMetadataItem) &&
    PIPELINE_ENABLED_OBJECT_NAMES.includes(objectMetadataItem.nameSingular);

  const { pipelines, loading } = usePipelineConfigs({
    objectNameSingular: objectMetadataItem?.nameSingular,
    skip: !isPipelineEnabled,
  });

  const pipeline = pipelines.find(({ id }) => id === pipelineId);

  if (!isDefined(objectMetadataItem) || !isPipelineEnabled) {
    return <WorkspaceRouteUnavailable />;
  }

  return (
    <SettingsPageLayout
      title={pipeline?.name ?? t`Pipeline`}
      links={[
        {
          children: t`Workspace`,
          href: getSettingsPath(SettingsPath.General),
        },
        {
          children: t`Objects`,
          href: getSettingsPath(SettingsPath.Objects),
        },
        {
          children: objectMetadataItem.labelPlural,
          href: getSettingsPath(SettingsPath.ObjectDetail, {
            objectNamePlural,
          }),
        },
        { children: pipeline?.name ?? t`Pipeline` },
      ]}
    >
      <SettingsPageContainer>
        {isDefined(pipeline) ? (
          <>
            <SettingsPipelineCalcPropsSummary pipeline={pipeline} />
            <SettingsPipelineAboutSection
              key={pipeline.id}
              pipeline={pipeline}
            />
            <SettingsPipelineStagesSection pipeline={pipeline} />
            <SettingsPipelineRulesSection
              key={`${pipeline.id}-rules`}
              pipeline={pipeline}
            />
          </>
        ) : (
          !loading && <WorkspaceRouteUnavailable />
        )}
      </SettingsPageContainer>
    </SettingsPageLayout>
  );
};

export const SettingsObjectPipelineDetail = () => {
  const hasPipelineObjects = useHasPipelineObjects();

  if (!hasPipelineObjects) {
    return <WorkspaceRouteUnavailable />;
  }

  return <SettingsObjectPipelineDetailContent />;
};
