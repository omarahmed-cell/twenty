import { ACTOR_SOURCE_FILTER_OPTIONS } from '@/object-record/object-filter-dropdown/constants/ActorSourceFilterOptions';
import { t } from '@lingui/core/macro';
import { type SelectOption } from 'twenty-ui/primitives/input';

export const getActorSourceSelectOptions = (): SelectOption[] =>
  ACTOR_SOURCE_FILTER_OPTIONS.map((actorSourceFilterOption) => ({
    label: t(actorSourceFilterOption.label),
    value: actorSourceFilterOption.id,
  }));
