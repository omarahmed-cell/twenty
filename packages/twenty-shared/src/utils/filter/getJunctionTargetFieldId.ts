import { isNonEmptyString } from '@sniptt/guards';

import { FieldMetadataType } from '@/types';
import { isDefined } from '@/utils/validation/isDefined';

// A many-to-many field is a one-to-many relation to a junction whose target field it names
export const getJunctionTargetFieldId = (field: {
  type: FieldMetadataType;
  settings?: unknown;
}): string | undefined => {
  if (
    field.type !== FieldMetadataType.RELATION ||
    !isDefined(field.settings) ||
    typeof field.settings !== 'object'
  ) {
    return undefined;
  }

  const { junctionTargetFieldId } = field.settings as {
    junctionTargetFieldId?: unknown;
  };

  return isNonEmptyString(junctionTargetFieldId)
    ? junctionTargetFieldId
    : undefined;
};
