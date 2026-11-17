import { ACTOR_FILTER_SUB_FIELDS } from '@/object-record/object-filter-dropdown/constants/ActorFilterSubFields';
import { t } from '@lingui/core/macro';
import { isDefined } from 'twenty-shared/utils';

export const getActorFilterSubFieldLabel = (
  subFieldName: string | null | undefined,
): string => {
  const actorFilterSubField = ACTOR_FILTER_SUB_FIELDS.find(
    (subField) => subField.subFieldName === subFieldName,
  );

  return isDefined(actorFilterSubField) ? t(actorFilterSubField.label) : '';
};
