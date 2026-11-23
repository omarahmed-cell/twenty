// Single place the Roboost Roles module will narrow to the activity owner; everyone may edit until then
export const useRoboostCanEditActivity = () => {
  const canEditActivity = (_activity: {
    objectNameSingular: string;
    recordId: string;
  }) => true;

  return { canEditActivity };
};
