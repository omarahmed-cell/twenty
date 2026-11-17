import { type ActorMetadata } from 'twenty-shared/types';

export type PropertyGroupRecord = {
  id: string;
  name: string;
  objectMetadataId: string;
  position: number;
};

export type PropertyGroupMembershipRecord = {
  id: string;
  propertyGroupId: string;
  fieldMetadataId: string;
  objectMetadataId: string;
  position: number;
};

export type PropertyLogicRuleRecord = {
  id: string;
  objectMetadataId: string;
  conditionGroups: unknown;
  properties: unknown;
  position: number;
  createdAt: string;
  createdBy: ActorMetadata | null;
};

export type PropertyCreationRecord = {
  id: string;
  fieldMetadataId: string;
  objectMetadataId: string;
  createdAt: string;
  createdBy: ActorMetadata | null;
};

export type PropertySettings = {
  groups: PropertyGroupRecord[];
  memberships: PropertyGroupMembershipRecord[];
  rules: PropertyLogicRuleRecord[];
  creations: PropertyCreationRecord[];
};
