import { type FlatViewField } from 'src/engine/metadata-modules/flat-view-field/types/flat-view-field.type';
import {
  createStandardViewFieldFlatMetadata,
  type CreateStandardViewFieldArgs,
} from 'src/engine/workspace-manager/twenty-standard-application/utils/view-field/create-standard-view-field-flat-metadata.util';

export const computeStandardSegmentMemberViewFields = (
  args: Omit<CreateStandardViewFieldArgs<'segmentMember'>, 'context'>,
): Record<string, FlatViewField> => {
  return {
    allSegmentMembersId: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'segmentMember',
      context: {
        viewName: 'allSegmentMembers',
        viewFieldName: 'id',
        fieldName: 'id',
        position: 0,
        isVisible: true,
        size: 210,
      },
    }),
    allSegmentMembersSegment: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'segmentMember',
      context: {
        viewName: 'allSegmentMembers',
        viewFieldName: 'segment',
        fieldName: 'segment',
        position: 1,
        isVisible: true,
        size: 150,
      },
    }),
    allSegmentMembersTargetCompany: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'segmentMember',
      context: {
        viewName: 'allSegmentMembers',
        viewFieldName: 'targetCompany',
        fieldName: 'targetCompany',
        position: 2,
        isVisible: true,
        size: 150,
      },
    }),
    allSegmentMembersTargetPerson: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'segmentMember',
      context: {
        viewName: 'allSegmentMembers',
        viewFieldName: 'targetPerson',
        fieldName: 'targetPerson',
        position: 3,
        isVisible: true,
        size: 150,
      },
    }),
    allSegmentMembersTargetOpportunity: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'segmentMember',
      context: {
        viewName: 'allSegmentMembers',
        viewFieldName: 'targetOpportunity',
        fieldName: 'targetOpportunity',
        position: 4,
        isVisible: true,
        size: 150,
      },
    }),
    allSegmentMembersCreatedBy: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'segmentMember',
      context: {
        viewName: 'allSegmentMembers',
        viewFieldName: 'createdBy',
        fieldName: 'createdBy',
        position: 5,
        isVisible: true,
        size: 150,
      },
    }),
    allSegmentMembersCreatedAt: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'segmentMember',
      context: {
        viewName: 'allSegmentMembers',
        viewFieldName: 'createdAt',
        fieldName: 'createdAt',
        position: 6,
        isVisible: true,
        size: 150,
      },
    }),
  };
};
