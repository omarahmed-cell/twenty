import { type ActorMetadata } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

import { isSystemAuthContext } from 'src/engine/core-modules/auth/guards/is-system-auth-context.guard';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';

export const applyRecordSourceFromCreatedBy = <
  TRecord extends Record<string, unknown>,
>({
  records,
  authContext,
}: {
  records: TRecord[];
  authContext: WorkspaceAuthContext;
}): TRecord[] =>
  records.map((record) => {
    if (isSystemAuthContext(authContext) && isDefined(record.recordSource)) {
      return record;
    }

    const createdBySource = (
      record.createdBy as Partial<ActorMetadata> | undefined
    )?.source;

    if (!isDefined(createdBySource)) {
      return record;
    }

    return { ...record, recordSource: createdBySource };
  });
