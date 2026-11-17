import { isPipelineObjectNameSingular } from 'twenty-shared/utils';

export const PIPELINE_BOARD_GROUP_FIELD_NAME = 'stage';

// Only deal and service boards grouped by their Stage get the pipeline switcher
export const isPipelineBoardEligible = ({
  objectNameSingular,
  groupFieldName,
}: {
  objectNameSingular: string | undefined;
  groupFieldName: string | undefined;
}) =>
  isPipelineObjectNameSingular(objectNameSingular) &&
  groupFieldName === PIPELINE_BOARD_GROUP_FIELD_NAME;
