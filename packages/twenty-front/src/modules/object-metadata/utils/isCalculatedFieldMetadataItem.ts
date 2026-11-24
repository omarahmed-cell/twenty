import {
  isDefined,
  STAGE_CALCULATED_PROPERTY_KINDS,
} from 'twenty-shared/utils';

import { STANDARD_CALCULATED_FIELD_NAMES } from '@/object-metadata/constants/StandardCalculatedFieldNames';
import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { getFieldFormulaSettings } from '@/settings/data-model/fields/forms/formula/utils/validateFormula';
import { getRoboostScoreIdOfField } from '@/roboost-app/scoring/utils/getRoboostScoreIdOfField';

const STAGE_CALCULATED_FIELD_NAME_PATTERN = new RegExp(
  `^(${STAGE_CALCULATED_PROPERTY_KINDS.join('|')})[A-Z]`,
);

export const isCalculatedFieldMetadataItem = (
  fieldMetadataItem: Pick<FieldMetadataItem, 'name' | 'settings'> &
    Partial<Pick<FieldMetadataItem, 'isUIEditable'>>,
) => {
  if (
    isDefined(getFieldFormulaSettings(fieldMetadataItem)) ||
    isDefined(getRoboostScoreIdOfField(fieldMetadataItem))
  ) {
    return true;
  }

  return (
    fieldMetadataItem.isUIEditable === false &&
    (STANDARD_CALCULATED_FIELD_NAMES.has(fieldMetadataItem.name) ||
      STAGE_CALCULATED_FIELD_NAME_PATTERN.test(fieldMetadataItem.name))
  );
};
