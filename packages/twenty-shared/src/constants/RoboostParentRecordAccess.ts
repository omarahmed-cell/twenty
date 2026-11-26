// Records with no access settings of their own that follow a parent record (line items follow their deal)
export type RoboostParentRecordAccess = {
  parentObjectNameSingular: string;
  foreignKey: string;
};

export const ROBOOST_PARENT_RECORD_ACCESS: Record<
  string,
  RoboostParentRecordAccess
> = {
  lineItem: { parentObjectNameSingular: 'opportunity', foreignKey: 'dealId' },
};
