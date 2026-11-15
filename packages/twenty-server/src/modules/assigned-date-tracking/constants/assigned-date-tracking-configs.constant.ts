import { type AssignedDateTrackingConfig } from 'src/modules/assigned-date-tracking/types/assigned-date-tracking-config.type';

export const ASSIGNED_DATE_TRACKING_CONFIGS: AssignedDateTrackingConfig[] = [
  {
    objectNameSingular: 'person',
    userFieldJoinColumnName: 'contactOwnerId',
    assignedDateFieldName: 'ownerAssignedDate',
  },
  {
    objectNameSingular: 'person',
    userFieldJoinColumnName: 'contactSdrOwnerId',
    assignedDateFieldName: 'sdrOwnerAssignedDate',
  },
  {
    objectNameSingular: 'company',
    userFieldJoinColumnName: 'accountOwnerId',
    assignedDateFieldName: 'ownerAssignedDate',
  },
  {
    objectNameSingular: 'company',
    userFieldJoinColumnName: 'sdrOwnerId',
    assignedDateFieldName: 'sdrOwnerAssignedDate',
  },
  {
    objectNameSingular: 'opportunity',
    userFieldJoinColumnName: 'ownerId',
    assignedDateFieldName: 'ownerAssignedDate',
  },
];
