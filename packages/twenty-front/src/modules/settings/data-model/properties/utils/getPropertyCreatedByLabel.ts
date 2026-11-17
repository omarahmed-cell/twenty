import { t } from '@lingui/core/macro';
import { type ActorMetadata } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

// Fields created before Created by was recorded, or by the system, have no creator
export const getPropertyCreatedByLabel = (
  createdBy: Pick<ActorMetadata, 'source' | 'name'> | null | undefined,
): string => {
  if (!isDefined(createdBy)) {
    return t`Unknown`;
  }

  if (createdBy.source === 'API') {
    return t`API`;
  }

  return createdBy.name.trim() !== '' ? createdBy.name : t`Unknown`;
};
