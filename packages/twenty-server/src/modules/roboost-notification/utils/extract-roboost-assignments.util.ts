import { isNonEmptyString } from '@sniptt/guards';
import { type ObjectRecordBaseEvent } from 'twenty-shared/database-events';
import { type ActorMetadata } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

import { type RoboostAssignOwnerField } from 'src/modules/roboost-notification/constants/roboost-assign-owner-fields.constant';
import {
  type RoboostAssignActor,
  type RoboostAssignment,
} from 'src/modules/roboost-notification/services/roboost-assign-notification.service';

type RecordShape = Record<string, unknown>;

const getRecordName = (record: RecordShape): string => {
  const name = record.name;

  if (isNonEmptyString(name)) {
    return name;
  }
  if (typeof name === 'object' && name !== null) {
    const { firstName, lastName } = name as {
      firstName?: string;
      lastName?: string;
    };
    const fullName = [firstName, lastName].filter(isNonEmptyString).join(' ');

    if (fullName !== '') {
      return fullName;
    }
  }

  return 'Untitled';
};

// API keys (the migration loader) and system writes never notify; UI imports, people and workflows do
const isNotifyingActor = (actor: ActorMetadata | undefined) => {
  if (!isDefined(actor)) {
    return false;
  }
  if (actor.source === 'API' || actor.source === 'SYSTEM') {
    return false;
  }

  return actor.source !== 'IMPORT' || isNonEmptyString(actor.workspaceMemberId);
};

// Owner changes to a member other than the actor, grouped by actor
export const extractRoboostAssignments = ({
  events,
  ownerFields,
  isCreate,
}: {
  events: ObjectRecordBaseEvent<RecordShape>[];
  ownerFields: RoboostAssignOwnerField[];
  isCreate: boolean;
}): { actor: RoboostAssignActor; assignments: RoboostAssignment[] }[] => {
  const byActor = new Map<
    string,
    { actor: RoboostAssignActor; assignments: RoboostAssignment[] }
  >();

  for (const event of events) {
    const after = event.properties?.after;
    const before = event.properties?.before;
    const recordId = event.recordId ?? (after?.id as string | undefined);

    if (!isDefined(after) || !isDefined(recordId)) {
      continue;
    }

    const actorMetadata = (isCreate ? after.createdBy : after.updatedBy) as
      | ActorMetadata
      | undefined;

    if (!isDefined(actorMetadata) || !isNotifyingActor(actorMetadata)) {
      continue;
    }

    const actorMemberId = isNonEmptyString(actorMetadata.workspaceMemberId)
      ? actorMetadata.workspaceMemberId
      : null;

    for (const { fieldName } of ownerFields) {
      const joinColumn = `${fieldName}Id`;
      const ownerId = after[joinColumn];
      const previousOwnerId = isCreate ? null : before?.[joinColumn];

      if (
        !isNonEmptyString(ownerId) ||
        ownerId === previousOwnerId ||
        ownerId === actorMemberId
      ) {
        continue;
      }

      const actorKey = actorMemberId ?? actorMetadata.name;
      const entry = byActor.get(actorKey) ?? {
        actor: {
          workspaceMemberId: actorMemberId,
          name: isNonEmptyString(actorMetadata.name)
            ? actorMetadata.name
            : 'Someone',
        },
        assignments: [],
      };

      entry.assignments.push({
        recordId,
        recordName: getRecordName(after),
        fieldName,
        ownerWorkspaceMemberId: ownerId,
      });
      byActor.set(actorKey, entry);
    }
  }

  return [...byActor.values()];
};
