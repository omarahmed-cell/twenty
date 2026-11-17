import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { type ConditionalLogicRule, isDefined } from 'twenty-shared/utils';
import { LightButton } from 'twenty-ui/components/input';
import { Section } from 'twenty-ui/components/layout';
import { IconPlus } from 'twenty-ui/icon';
import { themeCssVariables } from 'twenty-ui/theme';

import {
  type PipelineConfig,
  type PipelineStageConfig,
} from '@/pipeline/types/PipelineConfig';
import { SettingsPipelineStageRow } from '@/settings/data-model/pipelines/components/SettingsPipelineStageRow';
import { SettingsPipelineStageConditionalLogicModal } from '@/settings/data-model/pipelines/conditional-logic/components/SettingsPipelineStageConditionalLogicModal';
import { createConditionalLogicRuleDraft } from '@/settings/data-model/conditional-logic/utils/conditionalLogicRuleDraft';
import { SETTINGS_PIPELINE_STAGES_TABLE_GRID_TEMPLATE_COLUMNS } from '@/settings/data-model/pipelines/constants/SettingsPipelineStagesTableGridTemplateColumns';
import { useSettingsPipelineActions } from '@/settings/data-model/pipelines/hooks/useSettingsPipelineActions';
import { computeReorderedPositions } from '@/settings/data-model/pipelines/utils/computeReorderedPositions';
import { getNextPipelinePosition } from '@/settings/data-model/pipelines/utils/getNextPipelinePosition';
import { ConfirmationDialog } from '@/ui/layout/dialog/components/ConfirmationDialog';
import { useDialog } from '@/ui/layout/dialog/hooks/useDialog';
import { DraggableItem } from '@/ui/layout/draggable-list/components/DraggableItem';
import { DraggableList } from '@/ui/layout/draggable-list/components/DraggableList';
import { Table } from '@/ui/layout/table/components/Table';
import { TableHeader } from '@/ui/layout/table/components/TableHeader';
import { TableRow } from '@/ui/layout/table/components/TableRow';

const StyledFooter = styled.div`
  padding-top: ${themeCssVariables.spacing[2]};
`;

const DELETE_STAGE_DIALOG_ID = 'settings-delete-pipeline-stage-dialog';
const ENABLE_CALC_PROPS_DIALOG_ID = 'settings-enable-stage-calc-props-dialog';

type SettingsPipelineStagesSectionProps = {
  pipeline: PipelineConfig;
};

export const SettingsPipelineStagesSection = ({
  pipeline,
}: SettingsPipelineStagesSectionProps) => {
  const { t } = useLingui();
  const { openDialog } = useDialog();
  const {
    createPipelineStage,
    updatePipelineStage,
    setPipelineStageCalcPropsEnabled,
    destroyPipelineStage,
    reorderPipelineStages,
  } = useSettingsPipelineActions();

  const [stageToEnableCalcProps, setStageToEnableCalcProps] =
    useState<PipelineStageConfig | null>(null);
  const [calcPropsSavingStageId, setCalcPropsSavingStageId] = useState<
    string | null
  >(null);

  const saveCalcPropsEnabled = async (
    stageId: string,
    calcPropsEnabled: boolean,
  ) => {
    setCalcPropsSavingStageId(stageId);
    await setPipelineStageCalcPropsEnabled(stageId, calcPropsEnabled);
    setCalcPropsSavingStageId(null);
  };

  const handleToggleCalcProps = (
    stage: PipelineStageConfig,
    isEnabled: boolean,
  ) => {
    if (!isEnabled) {
      void saveCalcPropsEnabled(stage.id, false);

      return;
    }

    setStageToEnableCalcProps(stage);
    openDialog(ENABLE_CALC_PROPS_DIALOG_ID);
  };

  const handleConfirmEnableCalcProps = async () => {
    if (!isDefined(stageToEnableCalcProps)) {
      return;
    }

    const stageId = stageToEnableCalcProps.id;

    setStageToEnableCalcProps(null);
    await saveCalcPropsEnabled(stageId, true);
  };

  const [stageToDelete, setStageToDelete] =
    useState<PipelineStageConfig | null>(null);
  const [conditionalLogicTarget, setConditionalLogicTarget] = useState<{
    stageId: string;
    initialRuleDraft: ConditionalLogicRule | null;
  } | null>(null);

  const conditionalLogicStage = pipeline.stages.find(
    (stage) => stage.id === conditionalLogicTarget?.stageId,
  );

  const handleDragEnd = (result: {
    source: { index: number };
    destination: { index: number } | null;
  }) => {
    if (!isDefined(result.destination)) {
      return;
    }

    reorderPipelineStages(
      computeReorderedPositions({
        items: pipeline.stages,
        fromIndex: result.source.index,
        toIndex: result.destination.index,
      }),
    );
  };

  const handleConfirmDelete = async () => {
    if (!isDefined(stageToDelete)) {
      return;
    }

    await destroyPipelineStage(stageToDelete.id);
    setStageToDelete(null);
  };

  const stageToDeleteLabel = stageToDelete?.label ?? '';

  return (
    <Section.Root>
      <Section.Header
        title={t`Stages`}
        description={t`Drag stages to reorder them. 100% probability means won, 0% means lost.`}
      />
      <Table>
        <TableRow
          gridTemplateColumns={
            SETTINGS_PIPELINE_STAGES_TABLE_GRID_TEMPLATE_COLUMNS
          }
        >
          <TableHeader />
          <TableHeader />
          <TableHeader>{t`Stage name`}</TableHeader>
          <TableHeader>{t`Probability`}</TableHeader>
          <TableHeader>{t`Conditional logic`}</TableHeader>
          <TableHeader align="right">{t`Pipeline rules`}</TableHeader>
          <TableHeader align="center">{t`Stage calculated properties`}</TableHeader>
          <TableHeader />
        </TableRow>
        <DraggableList
          onDragEnd={handleDragEnd}
          draggableItems={
            <>
              {pipeline.stages.map((stage, index) => (
                <DraggableItem
                  key={stage.id}
                  draggableId={stage.id}
                  index={index}
                  itemComponent={
                    <SettingsPipelineStageRow
                      stage={stage}
                      rules={pipeline.rules}
                      isOnlyStage={pipeline.stages.length === 1}
                      onUpdate={(input) => updatePipelineStage(stage.id, input)}
                      onDelete={() => {
                        setStageToDelete(stage);
                        openDialog(DELETE_STAGE_DIALOG_ID);
                      }}
                      isCalcPropsSaving={calcPropsSavingStageId === stage.id}
                      onToggleCalcProps={(isEnabled) =>
                        handleToggleCalcProps(stage, isEnabled)
                      }
                      onOpenConditionalLogic={({ isNewRule }) =>
                        setConditionalLogicTarget({
                          stageId: stage.id,
                          initialRuleDraft: isNewRule
                            ? createConditionalLogicRuleDraft()
                            : null,
                        })
                      }
                    />
                  }
                />
              ))}
            </>
          }
        />
      </Table>
      <StyledFooter>
        <LightButton
          startIcon={<IconPlus />}
          fullWidth
          onClick={() =>
            createPipelineStage({
              pipelineId: pipeline.id,
              position: getNextPipelinePosition(pipeline.stages),
            })
          }
        >
          {t`Add stage`}
        </LightButton>
      </StyledFooter>
      {isDefined(conditionalLogicStage) && (
        <SettingsPipelineStageConditionalLogicModal
          key={conditionalLogicStage.id}
          stage={conditionalLogicStage}
          objectNameSingular={pipeline.objectNameSingular}
          isOpen
          initialRuleDraft={conditionalLogicTarget?.initialRuleDraft ?? null}
          onClose={() => setConditionalLogicTarget(null)}
        />
      )}
      <ConfirmationDialog
        dialogId={ENABLE_CALC_PROPS_DIALOG_ID}
        title={t`Turn on stage calculated properties`}
        subtitle={t`Creates 4 fields for this stage.`}
        onConfirmClick={handleConfirmEnableCalcProps}
        onClose={() => setStageToEnableCalcProps(null)}
        confirmButtonText={t`Turn on`}
        confirmButtonColor="accent"
      />
      <ConfirmationDialog
        dialogId={DELETE_STAGE_DIALOG_ID}
        title={t`Delete stage`}
        subtitle={t`Delete the stage "${stageToDeleteLabel}"? This cannot be undone.`}
        onConfirmClick={handleConfirmDelete}
        confirmButtonText={t`Delete`}
        confirmButtonColor="danger"
      />
    </Section.Root>
  );
};
