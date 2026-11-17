import { STANDARD_OBJECTS } from 'twenty-shared/metadata';
import {
  isDefined,
  isPipelineObjectNameSingular,
  type PipelineObjectNameSingular,
} from 'twenty-shared/utils';

export const DEAL_STAGE_FIELD_NAME = 'stage';
export const DEAL_PIPELINE_FIELD_NAME = 'pipeline';

const PIPELINE_OBJECT_NAME_BY_STAGE_FIELD_UNIVERSAL_IDENTIFIER = new Map<
  string,
  PipelineObjectNameSingular
>([
  [
    STANDARD_OBJECTS.opportunity.fields.stage.universalIdentifier,
    'opportunity',
  ],
  [STANDARD_OBJECTS.service.fields.stage.universalIdentifier, 'service'],
]);

type FieldReference = {
  objectNameSingular?: string | null;
  fieldName?: string | null;
};

// Deals and services share the pipeline-driven stage picker
export const isDealStageField = ({
  objectNameSingular,
  fieldName,
}: FieldReference) =>
  isPipelineObjectNameSingular(objectNameSingular) &&
  fieldName === DEAL_STAGE_FIELD_NAME;

export const isDealPipelineField = ({
  objectNameSingular,
  fieldName,
}: FieldReference) =>
  isPipelineObjectNameSingular(objectNameSingular) &&
  fieldName === DEAL_PIPELINE_FIELD_NAME;

export const getStageFieldPipelineObjectNameSingular = (
  fieldMetadataItem: { universalIdentifier?: string | null } | null | undefined,
): PipelineObjectNameSingular | undefined =>
  isDefined(fieldMetadataItem?.universalIdentifier)
    ? PIPELINE_OBJECT_NAME_BY_STAGE_FIELD_UNIVERSAL_IDENTIFIER.get(
        fieldMetadataItem.universalIdentifier,
      )
    : undefined;

export const isDealStageFieldMetadataItem = (
  fieldMetadataItem: { universalIdentifier?: string | null } | null | undefined,
) => isDefined(getStageFieldPipelineObjectNameSingular(fieldMetadataItem));
