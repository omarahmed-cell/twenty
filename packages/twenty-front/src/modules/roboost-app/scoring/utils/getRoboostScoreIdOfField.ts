import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { isNonEmptyString } from '@sniptt/guards';

// A score's property carries the score id in its settings; the score writes it, people cannot
export const getRoboostScoreIdOfField = (
  field: Pick<FieldMetadataItem, 'settings'>,
): string | undefined => {
  const scoreId = (field.settings as { roboostScoreId?: unknown } | null)
    ?.roboostScoreId;

  return isNonEmptyString(scoreId) ? scoreId : undefined;
};
