import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { SettingsPath } from 'twenty-shared/types';
import { getSettingsPath, isDefined } from 'twenty-shared/utils';
import { Section } from 'twenty-ui/components/layout';
import { themeCssVariables } from 'twenty-ui/theme';

import { useFilteredObjectMetadataItems } from '@/object-metadata/hooks/useFilteredObjectMetadataItems';
import { usePipelineConfigs } from '@/pipeline/hooks/usePipelineConfigs';
import { useHasPipelineObjects } from '@/pipeline/hooks/useHasPipelineObjects';
import { SaveAndCancelButtons } from '@/settings/components/SaveAndCancelButtons/SaveAndCancelButtons';
import { SettingsPageContainer } from '@/settings/components/SettingsPageContainer';
import { SettingsPageLayout } from '@/settings/components/layout/SettingsPageLayout';
import { PIPELINE_ENABLED_OBJECT_NAMES } from '@/settings/data-model/pipelines/constants/PipelineEnabledObjectNames';
import { useNavigateToSettingsPipeline } from '@/settings/data-model/pipelines/hooks/useNavigateToSettingsPipeline';
import { useSettingsPipelineActions } from '@/settings/data-model/pipelines/hooks/useSettingsPipelineActions';
import { getNextPipelinePosition } from '@/settings/data-model/pipelines/utils/getNextPipelinePosition';
import { SettingsTextInput } from '@/ui/input/components/SettingsTextInput';
import { TextArea } from '@/ui/input/components/TextArea';
import { WorkspaceRouteUnavailable } from '@/ui/layout/page/components/WorkspaceRouteUnavailable';
import { useNavigateSettings } from '~/hooks/useNavigateSettings';

const StyledFields = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[4]};
`;

const SettingsObjectNewPipelineContent = () => {
  const { t } = useLingui();
  const { objectNamePlural = '' } = useParams();
  const navigateSettings = useNavigateSettings();
  const navigateToSettingsPipeline = useNavigateToSettingsPipeline();
  const { findObjectMetadataItemByNamePlural } =
    useFilteredObjectMetadataItems();
  const { createPipeline } = useSettingsPipelineActions();

  const objectMetadataItem =
    findObjectMetadataItemByNamePlural(objectNamePlural);

  const isPipelineEnabled =
    isDefined(objectMetadataItem) &&
    PIPELINE_ENABLED_OBJECT_NAMES.includes(objectMetadataItem.nameSingular);

  const { pipelines } = usePipelineConfigs({
    objectNameSingular: objectMetadataItem?.nameSingular,
    skip: !isPipelineEnabled,
  });

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  if (!isDefined(objectMetadataItem) || !isPipelineEnabled) {
    return <WorkspaceRouteUnavailable />;
  }

  const goBackToObject = () =>
    navigateSettings(SettingsPath.ObjectDetail, { objectNamePlural });

  const handleSave = async () => {
    setIsSaving(true);

    const pipelineId = await createPipeline({
      name: name.trim(),
      description: description.trim() === '' ? null : description.trim(),
      position: getNextPipelinePosition(pipelines),
      objectNameSingular: objectMetadataItem.nameSingular,
    });

    setIsSaving(false);

    if (isDefined(pipelineId)) {
      navigateToSettingsPipeline({ objectNamePlural, pipelineId });
    }
  };

  return (
    <SettingsPageLayout
      title={t`New pipeline`}
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
        { children: t`New pipeline` },
      ]}
      actionButton={
        <SaveAndCancelButtons
          isLoading={isSaving}
          isSaveDisabled={name.trim() === '' || isSaving}
          isCancelDisabled={isSaving}
          onCancel={goBackToObject}
          onSave={handleSave}
        />
      }
    >
      <SettingsPageContainer>
        <Section.Root>
          <Section.Header
            title={t`About`}
            description={t`The pipeline starts with one stage, "New stage". Add and edit stages once it is created.`}
          />
          <StyledFields>
            <SettingsTextInput
              instanceId="settings-new-pipeline-name"
              label={t`Name`}
              placeholder={t`Sales Pipeline`}
              value={name}
              onChange={setName}
              onInputEnter={() => {
                if (name.trim() !== '' && !isSaving) {
                  handleSave();
                }
              }}
              autoFocusOnMount
              fullWidth
            />
            <TextArea
              textAreaId="settings-new-pipeline-description"
              label={t`Pipeline description`}
              value={description}
              onChange={setDescription}
              minRows={2}
            />
          </StyledFields>
        </Section.Root>
      </SettingsPageContainer>
    </SettingsPageLayout>
  );
};

export const SettingsObjectNewPipeline = () => {
  const hasPipelineObjects = useHasPipelineObjects();

  if (!hasPipelineObjects) {
    return <WorkspaceRouteUnavailable />;
  }

  return <SettingsObjectNewPipelineContent />;
};
