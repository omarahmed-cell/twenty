import { AppPath } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

export const getSettingsPipelinePath = ({
  objectNamePlural,
  pipelineId,
}: {
  objectNamePlural: string;
  pipelineId?: string;
}) =>
  `/${AppPath.Settings}/objects/${objectNamePlural}/pipelines/${
    isDefined(pipelineId) ? pipelineId : 'new'
  }`;
