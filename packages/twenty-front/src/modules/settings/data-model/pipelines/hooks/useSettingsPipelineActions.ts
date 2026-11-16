import { useMutation } from '@apollo/client/react';
import { useLingui } from '@lingui/react/macro';
import { useCallback } from 'react';
import { CoreObjectNameSingular } from 'twenty-shared/types';
import {
  DEFAULT_PIPELINE_RULES,
  isDefined,
  type PipelineRules,
} from 'twenty-shared/utils';
import { useToast } from 'twenty-ui/components/feedback';

import { getToastOptionsFromError } from '@/error-handler/utils/getToastOptionsFromError';
import { useApolloCoreClient } from '@/object-metadata/hooks/useApolloCoreClient';
import { useCreateOneRecord } from '@/object-record/hooks/useCreateOneRecord';
import { useDestroyOneRecord } from '@/object-record/hooks/useDestroyOneRecord';
import { useUpdateOneRecord } from '@/object-record/hooks/useUpdateOneRecord';
import { NEW_PIPELINE_STAGE_LABEL } from '@/settings/data-model/pipelines/constants/NewPipelineStageLabel';
import {
  CLONE_PIPELINE,
  type ClonePipelineMutationResult,
  type ClonePipelineMutationVariables,
} from '@/settings/data-model/pipelines/graphql/ClonePipelineMutation';

type PipelineUpdateInput = Partial<{
  name: string;
  description: string | null;
  position: number;
  rules: PipelineRules;
}>;

type PipelineStageUpdateInput = Partial<{
  label: string;
  color: string | null;
  probability: number | null;
  position: number;
}>;

export const useSettingsPipelineActions = () => {
  const { t } = useLingui();
  const { enqueueToast } = useToast();
  const apolloCoreClient = useApolloCoreClient();

  const { createOneRecord: createOnePipeline } = useCreateOneRecord({
    objectNameSingular: CoreObjectNameSingular.Pipeline,
  });
  const { createOneRecord: createOnePipelineStage } = useCreateOneRecord({
    objectNameSingular: CoreObjectNameSingular.PipelineStage,
  });
  const { updateOneRecord } = useUpdateOneRecord();
  const { destroyOneRecord: destroyOnePipeline } = useDestroyOneRecord({
    objectNameSingular: CoreObjectNameSingular.Pipeline,
  });
  const { destroyOneRecord: destroyOnePipelineStage } = useDestroyOneRecord({
    objectNameSingular: CoreObjectNameSingular.PipelineStage,
  });

  const [clonePipelineMutation] = useMutation<
    ClonePipelineMutationResult,
    ClonePipelineMutationVariables
  >(CLONE_PIPELINE);

  const showError = useCallback(
    (error: unknown) => {
      const toastOptions = getToastOptionsFromError({ error });

      if (isDefined(toastOptions)) {
        enqueueToast(toastOptions);
      }
    },
    [enqueueToast],
  );

  const runSafely = useCallback(
    async <TResult>(action: () => Promise<TResult>) => {
      try {
        return await action();
      } catch (error) {
        showError(error);

        return undefined;
      }
    },
    [showError],
  );

  // The server writes stage changes to the deal fields' options, so the pipeline lists are reloaded after
  const refetchPipelineConfigs = useCallback(
    () => apolloCoreClient.refetchQueries({ include: 'active' }),
    [apolloCoreClient],
  );

  const createPipeline = ({
    name,
    description,
    position,
    objectNameSingular,
  }: {
    name: string;
    description: string | null;
    position: number;
    objectNameSingular: string;
  }) =>
    runSafely(async () => {
      const pipeline = await createOnePipeline({
        name,
        description,
        position,
        objectNameSingular,
        rules: DEFAULT_PIPELINE_RULES,
      });

      await createOnePipelineStage({
        pipelineId: pipeline.id,
        label: t(NEW_PIPELINE_STAGE_LABEL),
        position: 0,
        calcPropsEnabled: false,
        conditionalRules: [],
      });

      await refetchPipelineConfigs();

      return pipeline.id as string;
    });

  const updatePipeline = (pipelineId: string, input: PipelineUpdateInput) =>
    runSafely(async () => {
      await updateOneRecord({
        objectNameSingular: CoreObjectNameSingular.Pipeline,
        idToUpdate: pipelineId,
        updateOneRecordInput: input,
      });

      return true;
    });

  const destroyPipeline = (pipelineId: string) =>
    runSafely(async () => {
      await destroyOnePipeline(pipelineId);
      await refetchPipelineConfigs();

      return true;
    });

  const clonePipeline = (pipelineId: string) =>
    runSafely(async () => {
      const result = await clonePipelineMutation({
        variables: { pipelineId },
      });

      await refetchPipelineConfigs();
      enqueueToast({ status: 'success', children: t`Pipeline cloned` });

      return result.data?.clonePipeline;
    });

  const createPipelineStage = ({
    pipelineId,
    position,
  }: {
    pipelineId: string;
    position: number;
  }) =>
    runSafely(async () => {
      await createOnePipelineStage({
        pipelineId,
        label: t(NEW_PIPELINE_STAGE_LABEL),
        position,
        calcPropsEnabled: false,
        conditionalRules: [],
      });
      await refetchPipelineConfigs();

      return true;
    });

  const updatePipelineStage = (
    pipelineStageId: string,
    input: PipelineStageUpdateInput,
  ) =>
    runSafely(async () => {
      await updateOneRecord({
        objectNameSingular: CoreObjectNameSingular.PipelineStage,
        idToUpdate: pipelineStageId,
        updateOneRecordInput: input,
      });

      return true;
    });

  const destroyPipelineStage = (pipelineStageId: string) =>
    runSafely(async () => {
      await destroyOnePipelineStage(pipelineStageId);
      await refetchPipelineConfigs();

      return true;
    });

  const reorder = ({
    objectNameSingular,
    positions,
  }: {
    objectNameSingular: string;
    positions: { id: string; position: number }[];
  }) =>
    runSafely(async () => {
      for (const { id, position } of positions) {
        await updateOneRecord({
          objectNameSingular,
          idToUpdate: id,
          updateOneRecordInput: { position },
        });
      }

      return true;
    });

  return {
    createPipeline,
    updatePipeline,
    destroyPipeline,
    clonePipeline,
    createPipelineStage,
    updatePipelineStage,
    destroyPipelineStage,
    reorderPipelines: (positions: { id: string; position: number }[]) =>
      reorder({
        objectNameSingular: CoreObjectNameSingular.Pipeline,
        positions,
      }),
    reorderPipelineStages: (positions: { id: string; position: number }[]) =>
      reorder({
        objectNameSingular: CoreObjectNameSingular.PipelineStage,
        positions,
      }),
  };
};
