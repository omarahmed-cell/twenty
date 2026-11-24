// The Tasks list filtered on "Assigned to is <recipient>" and "Overdue is Yes"
export const buildRoboostOverdueTasksPath = (workspaceMemberId: string) => {
  const parameters = new URLSearchParams({
    rbFilters: JSON.stringify({
      groups: [
        {
          id: 'overdue',
          rules: [
            {
              id: 'assigned-to-me',
              fieldName: 'assignee',
              operator: 'isAnyOf',
              value: [workspaceMemberId],
            },
            {
              id: 'is-overdue',
              fieldName: 'isOverdue',
              operator: 'isEqualTo',
              value: ['true'],
            },
          ],
        },
      ],
      associations: [],
    }),
  });

  return `/objects/tasks?${parameters.toString()}`;
};
