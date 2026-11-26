import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { useRoboostUserVars } from '@/roboost-app/hooks/useRoboostUserVars';
import { isRoboostListableField } from '@/roboost-app/list/hooks/useRoboostViewColumns';
import { isDefined } from 'twenty-shared/utils';

export const ROBOOST_BOARD_CARD_FIELD_LIMIT = 5;

const DEFAULT_CARD_FIELDS: Record<string, string[]> = {
  opportunity: [
    'dealAmount',
    'dateEnteredCurrentStage',
    'productCategorySync',
    'dealProbability',
  ],
  service: ['company', 'dateEnteredCurrentStage', 'createdAt'],
};

export const useRoboostBoardCardFields = (
  objectMetadataItem: EnrichedObjectMetadataItem,
) => {
  const { getUserVar, setUserVar } = useRoboostUserVars();
  const key = `roboost.boardCard.${objectMetadataItem.nameSingular}`;
  const saved = getUserVar<string[]>(key);
  const listableFields = objectMetadataItem.fields.filter(
    (field) =>
      isRoboostListableField(field) &&
      field.id !== objectMetadataItem.labelIdentifierFieldMetadataId,
  );
  const fallbackNames =
    DEFAULT_CARD_FIELDS[objectMetadataItem.nameSingular] ??
    listableFields.slice(0, 3).map((field) => field.name);
  const fieldNames = Array.isArray(saved) ? saved : fallbackNames;

  const cardFields = fieldNames
    .map((name) => listableFields.find((field) => field.name === name))
    .filter(isDefined)
    .slice(0, ROBOOST_BOARD_CARD_FIELD_LIMIT);

  return {
    cardFields,
    listableFields,
    saveCardFields: (names: string[]) => setUserVar(key, names),
  };
};
