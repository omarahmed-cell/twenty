import { type ActorFilterSubFieldName } from '@/object-record/object-filter-dropdown/constants/ActorFilterSubFields';

export const getActorSubFieldSelectableItemId = (
  subFieldName: ActorFilterSubFieldName,
) => `actor-sub-field-${subFieldName}`;
