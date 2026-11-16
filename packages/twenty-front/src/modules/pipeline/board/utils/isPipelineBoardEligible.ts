import { CoreObjectNameSingular } from 'twenty-shared/types';

export const PIPELINE_BOARD_GROUP_FIELD_NAME = 'stage';

// Only deal boards grouped by Deal Stage get the pipeline switcher
export const isPipelineBoardEligible = ({
  objectNameSingular,
  groupFieldName,
}: {
  objectNameSingular: string | undefined;
  groupFieldName: string | undefined;
}) =>
  objectNameSingular === CoreObjectNameSingular.Opportunity &&
  groupFieldName === PIPELINE_BOARD_GROUP_FIELD_NAME;
