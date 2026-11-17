export type HubspotOwner = {
  name: string;
  email: string | null;
  active: boolean;
  workspaceMemberId: string | null;
};

export type HubspotOwnerMap = Record<string, HubspotOwner>;
