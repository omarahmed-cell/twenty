import { STANDARD_OBJECTS } from 'twenty-shared/metadata';
import { type SegmentTargetObject } from 'twenty-shared/types';

type SegmentTargetObjectConfig = {
  objectNameSingular: 'company' | 'person' | 'opportunity';
  memberJoinColumnName:
    | 'targetCompanyId'
    | 'targetPersonId'
    | 'targetOpportunityId';
  segmentMembershipFieldUniversalIdentifier: string;
};

export const SEGMENT_TARGET_OBJECT_CONFIGS = {
  COMPANY: {
    objectNameSingular: 'company',
    memberJoinColumnName: 'targetCompanyId',
    segmentMembershipFieldUniversalIdentifier:
      STANDARD_OBJECTS.company.fields.segmentMembership.universalIdentifier,
  },
  PERSON: {
    objectNameSingular: 'person',
    memberJoinColumnName: 'targetPersonId',
    segmentMembershipFieldUniversalIdentifier:
      STANDARD_OBJECTS.person.fields.segmentMembership.universalIdentifier,
  },
  OPPORTUNITY: {
    objectNameSingular: 'opportunity',
    memberJoinColumnName: 'targetOpportunityId',
    segmentMembershipFieldUniversalIdentifier:
      STANDARD_OBJECTS.opportunity.fields.segmentMembership.universalIdentifier,
  },
} as const satisfies Record<SegmentTargetObject, SegmentTargetObjectConfig>;

export const SEGMENT_TARGET_OBJECTS = Object.keys(
  SEGMENT_TARGET_OBJECT_CONFIGS,
) as SegmentTargetObject[];
