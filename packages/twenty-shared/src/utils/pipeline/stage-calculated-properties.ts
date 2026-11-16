export const STAGE_CALCULATED_PROPERTY_KINDS = [
  'dateEntered',
  'dateExited',
  'cumulativeTimeIn',
  'latestTimeIn',
] as const;

export type StageCalculatedPropertyKind =
  (typeof STAGE_CALCULATED_PROPERTY_KINDS)[number];

export const STAGE_CALCULATED_PROPERTY_FIELD_COUNT_PER_STAGE =
  STAGE_CALCULATED_PROPERTY_KINDS.length;

const LABEL_PREFIX_BY_KIND: Record<StageCalculatedPropertyKind, string> = {
  dateEntered: 'Date entered',
  dateExited: 'Date exited',
  cumulativeTimeIn: 'Cumulative time in',
  latestTimeIn: 'Latest time in',
};

const toPascalCase = (stageValue: string) =>
  stageValue
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((part) => part.length > 0)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');

// Names come from the stage key, which never changes, so renaming a stage or pipeline keeps the columns
export const buildStageCalculatedPropertyFieldName = (
  kind: StageCalculatedPropertyKind,
  stageValue: string,
) => `${kind}${toPascalCase(stageValue)}`;

export const buildStageCalculatedPropertyFieldNames = (
  stageValue: string,
): Record<StageCalculatedPropertyKind, string> => ({
  dateEntered: buildStageCalculatedPropertyFieldName('dateEntered', stageValue),
  dateExited: buildStageCalculatedPropertyFieldName('dateExited', stageValue),
  cumulativeTimeIn: buildStageCalculatedPropertyFieldName(
    'cumulativeTimeIn',
    stageValue,
  ),
  latestTimeIn: buildStageCalculatedPropertyFieldName(
    'latestTimeIn',
    stageValue,
  ),
});

export const buildStageCalculatedPropertyLabel = ({
  kind,
  stageLabel,
  pipelineName,
}: {
  kind: StageCalculatedPropertyKind;
  stageLabel: string;
  pipelineName: string;
}) => `${LABEL_PREFIX_BY_KIND[kind]} "${stageLabel} (${pipelineName})"`;

export const countStageCalculatedProperties = (
  stages: { calcPropsEnabled: boolean }[],
) =>
  stages.filter(({ calcPropsEnabled }) => calcPropsEnabled).length *
  STAGE_CALCULATED_PROPERTY_FIELD_COUNT_PER_STAGE;
