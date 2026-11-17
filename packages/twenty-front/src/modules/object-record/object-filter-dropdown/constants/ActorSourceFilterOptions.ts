import {
  ACTOR_SOURCE_FILTER_OPTION_CONFIGS,
  type ActorSourceFilterOptionConfig,
} from '@/object-record/object-filter-dropdown/constants/ActorSourceFilterOptionConfigs';
import { RECORD_SOURCE_LABELS } from 'twenty-shared/constants';
import { type FieldActorSource } from 'twenty-shared/types';

// `id` is the stored filter value; `name` is the untranslated label kept in saved display values.
export const ACTOR_SOURCE_FILTER_OPTIONS: Array<
  {
    id: FieldActorSource;
    name: string;
  } & ActorSourceFilterOptionConfig
> = (Object.keys(ACTOR_SOURCE_FILTER_OPTION_CONFIGS) as FieldActorSource[]).map(
  (source) => ({
    id: source,
    name: RECORD_SOURCE_LABELS[source],
    ...ACTOR_SOURCE_FILTER_OPTION_CONFIGS[source],
  }),
);
