// A link longer than this many ids would break URL limits; the date + owner filters still narrow it
const MAX_LINKED_IDS = 150;

export type RoboostListFilterRule = {
  id: string;
  fieldName: string;
  operator: string;
  value: string | string[] | null;
  labels?: Record<string, string>;
};

// The object's list with the Roboost advanced filters prefilled (rbFilters) and the batch's ids (filterIds)
export const buildRoboostAssignListPath = ({
  objectNamePlural,
  ownerFieldName,
  assignedDateFieldName,
  recipientWorkspaceMemberId,
  recipientName,
  recordIds,
}: {
  objectNamePlural: string;
  ownerFieldName: string;
  assignedDateFieldName: string | null;
  recipientWorkspaceMemberId: string;
  recipientName: string;
  recordIds: string[];
}): string => {
  const rules: RoboostListFilterRule[] = [
    ...(assignedDateFieldName === null
      ? []
      : [
          {
            id: 'assigned-this-month',
            fieldName: assignedDateFieldName,
            operator: 'isThisMonth',
            value: null,
          },
        ]),
    {
      id: 'owner-is-me',
      fieldName: ownerFieldName,
      operator: 'isAnyOf',
      value: [recipientWorkspaceMemberId],
      labels: { [recipientWorkspaceMemberId]: recipientName },
    },
  ];
  const parameters = new URLSearchParams({
    rbFilters: JSON.stringify({
      groups: [{ id: 'assigned', rules }],
      associations: [],
    }),
  });

  if (recordIds.length > 0 && recordIds.length <= MAX_LINKED_IDS) {
    parameters.set('filterIds', recordIds.join(','));
  }

  return `/objects/${objectNamePlural}?${parameters.toString()}`;
};
