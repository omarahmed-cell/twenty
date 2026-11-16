import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { Section } from 'twenty-ui/components/layout';
import { themeCssVariables } from 'twenty-ui/theme';

import { type PipelineConfig } from '@/pipeline/types/PipelineConfig';
import { useSettingsPipelineActions } from '@/settings/data-model/pipelines/hooks/useSettingsPipelineActions';
import { SettingsTextInput } from '@/ui/input/components/SettingsTextInput';
import { TextArea } from '@/ui/input/components/TextArea';

const StyledFields = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[4]};
`;

type SettingsPipelineAboutSectionProps = {
  pipeline: PipelineConfig;
};

export const SettingsPipelineAboutSection = ({
  pipeline,
}: SettingsPipelineAboutSectionProps) => {
  const { t } = useLingui();
  const { updatePipeline } = useSettingsPipelineActions();

  const [nameDraft, setNameDraft] = useState(pipeline.name);
  const [descriptionDraft, setDescriptionDraft] = useState(
    pipeline.description ?? '',
  );

  const saveName = () => {
    const trimmedName = nameDraft.trim();

    if (trimmedName === '') {
      setNameDraft(pipeline.name);

      return;
    }

    if (trimmedName !== pipeline.name) {
      updatePipeline(pipeline.id, { name: trimmedName });
    }
  };

  const saveDescription = () => {
    const trimmedDescription = descriptionDraft.trim();

    if (trimmedDescription !== (pipeline.description ?? '')) {
      updatePipeline(pipeline.id, {
        description: trimmedDescription === '' ? null : trimmedDescription,
      });
    }
  };

  return (
    <Section.Root>
      <Section.Header
        title={t`About`}
        description={t`Name and describe this pipeline.`}
      />
      <StyledFields>
        <SettingsTextInput
          instanceId={`settings-pipeline-name-${pipeline.id}`}
          label={t`Name`}
          value={nameDraft}
          onChange={setNameDraft}
          onBlur={saveName}
          onInputEnter={saveName}
          fullWidth
        />
        <TextArea
          textAreaId={`settings-pipeline-description-${pipeline.id}`}
          label={t`Pipeline description`}
          value={descriptionDraft}
          onChange={setDescriptionDraft}
          onBlur={saveDescription}
          minRows={2}
        />
      </StyledFields>
    </Section.Root>
  );
};
