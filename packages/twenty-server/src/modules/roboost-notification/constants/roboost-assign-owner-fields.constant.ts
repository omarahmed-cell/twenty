// Workspace-member "owner" fields that notify their new owner. SDR fields filter on the SDR
// assigned date; fields without a stamped date link to exactly the assigned records.
export type RoboostAssignOwnerField = {
  fieldName: string;
  assignedDateFieldName: string | null;
};

export const ROBOOST_ASSIGN_OWNER_FIELDS: Record<
  string,
  RoboostAssignOwnerField[]
> = {
  company: [
    { fieldName: 'accountOwner', assignedDateFieldName: 'ownerAssignedDate' },
    { fieldName: 'sdrOwner', assignedDateFieldName: 'sdrOwnerAssignedDate' },
    { fieldName: 'customerSuccessResponsible', assignedDateFieldName: null },
  ],
  person: [
    { fieldName: 'contactOwner', assignedDateFieldName: 'ownerAssignedDate' },
    {
      fieldName: 'contactSdrOwner',
      assignedDateFieldName: 'sdrOwnerAssignedDate',
    },
    { fieldName: 'customerSuccessResponsible', assignedDateFieldName: null },
  ],
  opportunity: [
    { fieldName: 'owner', assignedDateFieldName: 'ownerAssignedDate' },
    { fieldName: 'customerSuccessResponsible', assignedDateFieldName: null },
  ],
  service: [
    {
      fieldName: 'serviceOwner',
      assignedDateFieldName: 'serviceOwnerAssignedDate',
    },
    { fieldName: 'customerSuccessResponsible', assignedDateFieldName: null },
  ],
};
