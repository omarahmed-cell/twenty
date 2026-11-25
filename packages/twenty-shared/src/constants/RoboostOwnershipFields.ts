// What makes a record "theirs". Other user fields (Customer Success Responsible, Attribute To, ...) never count.
export type RoboostOwnershipField = {
  fieldName: string;
  joinColumnName: string;
  label: string;
};

export const ROBOOST_OWNERSHIP_FIELDS: Record<string, RoboostOwnershipField[]> =
  {
    company: [
      {
        fieldName: 'accountOwner',
        joinColumnName: 'accountOwnerId',
        label: 'Company owner',
      },
      {
        fieldName: 'sdrOwner',
        joinColumnName: 'sdrOwnerId',
        label: 'Company SDR Owner',
      },
    ],
    person: [
      {
        fieldName: 'contactOwner',
        joinColumnName: 'contactOwnerId',
        label: 'Contact owner',
      },
      {
        fieldName: 'contactSdrOwner',
        joinColumnName: 'contactSdrOwnerId',
        label: 'Contact SDR Owner',
      },
    ],
    opportunity: [
      { fieldName: 'owner', joinColumnName: 'ownerId', label: 'Deal owner' },
    ],
    service: [
      {
        fieldName: 'serviceOwner',
        joinColumnName: 'serviceOwnerId',
        label: 'Service Owner',
      },
    ],
    segment: [
      {
        fieldName: 'segmentOwner',
        joinColumnName: 'segmentOwnerId',
        label: 'Segment owner',
      },
    ],
  };

// An activity is "theirs" when they created it or it is assigned to them (meetings: host or assignee)
export type RoboostActivityOwnership = {
  assigneeColumns: { joinColumnName: string; label: string }[];
  targetTableName: string;
  targetForeignKey: string;
};

export const ROBOOST_ACTIVITY_OWNERSHIP: Record<
  string,
  RoboostActivityOwnership
> = {
  task: {
    assigneeColumns: [{ joinColumnName: 'assigneeId', label: 'Assignee' }],
    targetTableName: 'taskTarget',
    targetForeignKey: 'taskId',
  },
  note: {
    assigneeColumns: [
      { joinColumnName: 'assignedToId', label: 'Activity assigned to' },
    ],
    targetTableName: 'noteTarget',
    targetForeignKey: 'noteId',
  },
  email: {
    assigneeColumns: [
      { joinColumnName: 'assignedToId', label: 'Activity assigned to' },
    ],
    targetTableName: 'emailTarget',
    targetForeignKey: 'emailId',
  },
  meeting: {
    assigneeColumns: [
      { joinColumnName: 'hostId', label: 'Host' },
      { joinColumnName: 'assignedToId', label: 'Activity assigned to' },
    ],
    targetTableName: 'meetingTarget',
    targetForeignKey: 'meetingId',
  },
  call: {
    assigneeColumns: [
      { joinColumnName: 'assignedToId', label: 'Activity assigned to' },
    ],
    targetTableName: 'callTarget',
    targetForeignKey: 'callId',
  },
  communication: {
    assigneeColumns: [
      { joinColumnName: 'assignedToId', label: 'Activity assigned to' },
    ],
    targetTableName: 'communicationTarget',
    targetForeignKey: 'communicationId',
  },
};

// Activity target columns pointing at records that carry their own record-level access
export const ROBOOST_ACTIVITY_TARGET_COLUMNS: Record<string, string> = {
  company: 'targetCompanyId',
  person: 'targetPersonId',
  opportunity: 'targetOpportunityId',
  service: 'targetServiceId',
};
