// Pairs a User field (by its join column) with the read-only date stamped each time it gets a new member
export type AssignedDateTrackingConfig = {
  objectNameSingular: string;
  userFieldJoinColumnName: string;
  assignedDateFieldName: string;
};
