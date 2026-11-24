import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { type RoboostIconName } from '@/roboost-ui/types/RoboostIconName';

const ICON_BY_TYPE: Record<string, RoboostIconName> = {
  TEXT: 'note',
  FULL_NAME: 'user',
  UUID: 'note',
  EMAILS: 'mail',
  PHONES: 'phone',
  LINKS: 'link',
  NUMBER: 'sort-lines',
  NUMERIC: 'sort-lines',
  RATING: 'star',
  CURRENCY: 'deals',
  DATE: 'calendar',
  DATE_TIME: 'clock',
  SELECT: 'list',
  MULTI_SELECT: 'list-ordered',
  BOOLEAN: 'check',
};

export const getRoboostScoreFieldIcon = (
  field: Pick<FieldMetadataItem, 'type' | 'relation'>,
): RoboostIconName => {
  if (field.type === 'RELATION') {
    return field.relation?.targetObjectMetadata.nameSingular ===
      'workspaceMember'
      ? 'user'
      : 'link';
  }

  return ICON_BY_TYPE[field.type] ?? 'note';
};
