// Fields shown when an object has no saved form yet (Settings → Forms replaces these)
export const ROBOOST_DEFAULT_CREATE_FIELDS: Record<string, string[]> = {
  company: ['domainName', 'name', 'sdrOwner', 'accountOwner', 'operatesIn'],
  person: ['emails', 'name', 'jobTitle', 'company', 'phones'],
  opportunity: ['name', 'company', 'pointOfContact', 'amount', 'closeDate'],
  task: ['title', 'assignee', 'dueAt', 'status'],
  note: ['title'],
  meeting: ['title', 'startsAt', 'endsAt', 'host', 'meetingType', 'location'],
  call: ['title', 'direction', 'outcome'],
  communication: ['title'],
  service: ['name', 'company', 'opportunity', 'pointOfContact'],
};
