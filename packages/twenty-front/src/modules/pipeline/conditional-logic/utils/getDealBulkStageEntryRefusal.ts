import { t } from '@lingui/core/macro';
import { CoreObjectNameSingular } from 'twenty-shared/types';
import { type ConditionalLogicField, isDefined } from 'twenty-shared/utils';

import { type DealStageEntryRequirement } from '@/pipeline/conditional-logic/utils/getDealStageEntryRequirement';

const formatRefusal = (
  stageLabel: string,
  fieldLabels: string[],
  isDealPipeline: boolean,
) => {
  const requiredFieldLabels = fieldLabels.join(', ');

  return isDealPipeline
    ? t`Move these deals one by one: ${stageLabel} requires ${requiredFieldLabels}`
    : t`Move these records one by one: ${stageLabel} requires ${requiredFieldLabels}`;
};

const isDealPipelineRequirement = (
  requirement: DealStageEntryRequirement | null | undefined,
) =>
  requirement?.pipeline.objectNameSingular !== CoreObjectNameSingular.Service;

// Several deals can't share one dialog, so a bulk move is refused when any of them would be missing a required field
export const getDealBulkStageEntryRefusal = (
  requirements: (DealStageEntryRequirement | null)[],
): string | null => {
  const missingFieldByName = new Map<string, ConditionalLogicField>();
  let stageLabel: string | null = null;
  const isDealPipeline = requirements.every(isDealPipelineRequirement);

  for (const requirement of requirements) {
    for (const field of requirement?.missingRequiredFields ?? []) {
      stageLabel = requirement?.stage.label ?? stageLabel;
      missingFieldByName.set(field.name, field);
    }
  }

  if (stageLabel === null) {
    return null;
  }

  return formatRefusal(
    stageLabel,
    [...missingFieldByName.values()].map(({ label }) => label),
    isDealPipeline,
  );
};

// The bulk edit form targets deals it hasn't loaded, so any required field it doesn't set itself refuses the move
export const getDealBulkEditStageEntryRefusal = ({
  stage,
  fields,
  providedFieldNames,
  isDealPipeline = true,
}: {
  stage: DealStageEntryRequirement['stage'] | undefined;
  isDealPipeline?: boolean;
  fields: ConditionalLogicField[];
  providedFieldNames: string[];
}): string | null => {
  if (!isDefined(stage)) {
    return null;
  }

  const fieldByName = new Map(fields.map((field) => [field.name, field]));
  const provided = new Set(providedFieldNames);

  const requiredFieldLabels = [
    ...new Set(
      stage.conditionalRules
        .flatMap(({ properties }) => properties)
        .filter(({ isRequired }) => isRequired)
        .map(({ fieldName }) => fieldByName.get(fieldName))
        .filter(isDefined)
        .filter(
          (field) =>
            !provided.has(field.name) &&
            !(
              isDefined(field.joinColumnName) &&
              provided.has(field.joinColumnName)
            ),
        )
        .map(({ label }) => label),
    ),
  ];

  return requiredFieldLabels.length === 0
    ? null
    : formatRefusal(stage.label, requiredFieldLabels, isDealPipeline);
};
