import { STANDARD_OBJECTS } from 'twenty-shared/metadata';
import { CoreObjectNameSingular } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

export const DEAL_STAGE_FIELD_NAME = 'stage';
export const DEAL_PIPELINE_FIELD_NAME = 'pipeline';

const DEAL_STAGE_FIELD_UNIVERSAL_IDENTIFIER =
  STANDARD_OBJECTS.opportunity.fields.stage.universalIdentifier;

type FieldReference = {
  objectNameSingular?: string | null;
  fieldName?: string | null;
};

export const isDealStageField = ({
  objectNameSingular,
  fieldName,
}: FieldReference) =>
  objectNameSingular === CoreObjectNameSingular.Opportunity &&
  fieldName === DEAL_STAGE_FIELD_NAME;

export const isDealPipelineField = ({
  objectNameSingular,
  fieldName,
}: FieldReference) =>
  objectNameSingular === CoreObjectNameSingular.Opportunity &&
  fieldName === DEAL_PIPELINE_FIELD_NAME;

export const isDealStageFieldMetadataItem = (
  fieldMetadataItem: { universalIdentifier?: string | null } | null | undefined,
) =>
  isDefined(fieldMetadataItem) &&
  fieldMetadataItem.universalIdentifier ===
    DEAL_STAGE_FIELD_UNIVERSAL_IDENTIFIER;
