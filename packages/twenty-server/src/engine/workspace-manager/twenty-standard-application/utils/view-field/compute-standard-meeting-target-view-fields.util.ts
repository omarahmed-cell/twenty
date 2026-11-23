import { type FlatViewField } from 'src/engine/metadata-modules/flat-view-field/types/flat-view-field.type';
import {
  createStandardViewFieldFlatMetadata,
  type CreateStandardViewFieldArgs,
} from 'src/engine/workspace-manager/twenty-standard-application/utils/view-field/create-standard-view-field-flat-metadata.util';

export const computeStandardMeetingTargetViewFields = (
  args: Omit<CreateStandardViewFieldArgs<'meetingTarget'>, 'context'>,
): Record<string, FlatViewField> => {
  return {
    allMeetingTargetsId: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'meetingTarget',
      context: {
        viewName: 'allMeetingTargets',
        viewFieldName: 'id',
        fieldName: 'id',
        position: 0,
        isVisible: true,
        size: 210,
      },
    }),
    allMeetingTargetsMeeting: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'meetingTarget',
      context: {
        viewName: 'allMeetingTargets',
        viewFieldName: 'meeting',
        fieldName: 'meeting',
        position: 1,
        isVisible: true,
        size: 150,
      },
    }),
    // All morph targets are included so the surviving field after dedup always has a viewField
    allMeetingTargetsTargetPerson: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'meetingTarget',
      context: {
        viewName: 'allMeetingTargets',
        viewFieldName: 'targetPerson',
        fieldName: 'targetPerson',
        position: 2,
        isVisible: true,
        size: 150,
      },
    }),
    allMeetingTargetsTargetCompany: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'meetingTarget',
      context: {
        viewName: 'allMeetingTargets',
        viewFieldName: 'targetCompany',
        fieldName: 'targetCompany',
        position: 3,
        isVisible: true,
        size: 150,
      },
    }),
    allMeetingTargetsTargetOpportunity: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'meetingTarget',
      context: {
        viewName: 'allMeetingTargets',
        viewFieldName: 'targetOpportunity',
        fieldName: 'targetOpportunity',
        position: 4,
        isVisible: true,
        size: 150,
      },
    }),
    allMeetingTargetsTargetService: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'meetingTarget',
      context: {
        viewName: 'allMeetingTargets',
        viewFieldName: 'targetService',
        fieldName: 'targetService',
        position: 5,
        isVisible: true,
        size: 150,
      },
    }),
  };
};
