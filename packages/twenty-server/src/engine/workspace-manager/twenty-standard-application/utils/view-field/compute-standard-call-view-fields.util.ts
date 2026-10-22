import { type FlatViewField } from 'src/engine/metadata-modules/flat-view-field/types/flat-view-field.type';
import {
  createStandardViewFieldFlatMetadata,
  type CreateStandardViewFieldArgs,
} from 'src/engine/workspace-manager/twenty-standard-application/utils/view-field/create-standard-view-field-flat-metadata.util';

export const computeStandardCallViewFields = (
  args: Omit<CreateStandardViewFieldArgs<'call'>, 'context'>,
): Record<string, FlatViewField> => {
  return {
    allCallsTitle: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'call',
      context: {
        viewName: 'allCalls',
        viewFieldName: 'title',
        fieldName: 'title',
        position: 0,
        isVisible: true,
        size: 210,
      },
    }),
    allCallsDirection: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'call',
      context: {
        viewName: 'allCalls',
        viewFieldName: 'direction',
        fieldName: 'direction',
        position: 2,
        isVisible: true,
        size: 150,
      },
    }),
    allCallsBodyV2: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'call',
      context: {
        viewName: 'allCalls',
        viewFieldName: 'bodyV2',
        fieldName: 'bodyV2',
        position: 3,
        isVisible: true,
        size: 150,
      },
    }),
    allCallsCreatedBy: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'call',
      context: {
        viewName: 'allCalls',
        viewFieldName: 'createdBy',
        fieldName: 'createdBy',
        position: 4,
        isVisible: true,
        size: 150,
      },
    }),
    allCallsCreatedAt: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'call',
      context: {
        viewName: 'allCalls',
        viewFieldName: 'createdAt',
        fieldName: 'createdAt',
        position: 5,
        isVisible: true,
        size: 150,
      },
    }),
    callRecordPageFieldsDirection: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'call',
      context: {
        viewName: 'callRecordPageFields',
        viewFieldName: 'direction',
        fieldName: 'direction',
        position: 1,
        isVisible: true,
        size: 150,
        viewFieldGroupName: 'general',
      },
    }),
    callRecordPageFieldsCreatedAt: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'call',
      context: {
        viewName: 'callRecordPageFields',
        viewFieldName: 'createdAt',
        fieldName: 'createdAt',
        position: 2,
        isVisible: true,
        size: 150,
        viewFieldGroupName: 'general',
      },
    }),
    callRecordPageFieldsCreatedBy: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'call',
      context: {
        viewName: 'callRecordPageFields',
        viewFieldName: 'createdBy',
        fieldName: 'createdBy',
        position: 3,
        isVisible: true,
        size: 150,
        viewFieldGroupName: 'general',
      },
    }),
    callRecordPageFieldsTimelineActivities: createStandardViewFieldFlatMetadata(
      {
        ...args,
        objectName: 'call',
        context: {
          viewName: 'callRecordPageFields',
          viewFieldName: 'timelineActivities',
          fieldName: 'timelineActivities',
          position: 4,
          isVisible: false,
          size: 150,
          viewFieldGroupName: 'general',
        },
      },
    ),
    allCallsCallTargets: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'call',
      context: {
        viewName: 'allCalls',
        viewFieldName: 'callTargets',
        fieldName: 'callTargets',
        position: 1,
        isVisible: true,
        size: 150,
      },
    }),
    callRecordPageFieldsCallTargets: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'call',
      context: {
        viewName: 'callRecordPageFields',
        viewFieldName: 'callTargets',
        fieldName: 'callTargets',
        position: 0,
        isVisible: true,
        size: 150,
        viewFieldGroupName: 'general',
      },
    }),
    callRecordPageFieldsAttachments: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'call',
      context: {
        viewName: 'callRecordPageFields',
        viewFieldName: 'attachments',
        fieldName: 'attachments',
        position: 5,
        isVisible: false,
        size: 150,
        viewFieldGroupName: 'general',
      },
    }),
  };
};
