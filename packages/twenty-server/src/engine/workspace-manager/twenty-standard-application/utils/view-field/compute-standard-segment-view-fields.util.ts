import { type FlatViewField } from 'src/engine/metadata-modules/flat-view-field/types/flat-view-field.type';
import {
  createStandardViewFieldFlatMetadata,
  type CreateStandardViewFieldArgs,
} from 'src/engine/workspace-manager/twenty-standard-application/utils/view-field/create-standard-view-field-flat-metadata.util';

export const computeStandardSegmentViewFields = (
  args: Omit<CreateStandardViewFieldArgs<'segment'>, 'context'>,
): Record<string, FlatViewField> => {
  return {
    allSegmentsName: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'segment',
      context: {
        viewName: 'allSegments',
        viewFieldName: 'name',
        fieldName: 'name',
        position: 0,
        isVisible: true,
        size: 210,
      },
    }),
    allSegmentsTargetObject: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'segment',
      context: {
        viewName: 'allSegments',
        viewFieldName: 'targetObject',
        fieldName: 'targetObject',
        position: 1,
        isVisible: true,
        size: 150,
      },
    }),
    allSegmentsMemberCount: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'segment',
      context: {
        viewName: 'allSegments',
        viewFieldName: 'memberCount',
        fieldName: 'memberCount',
        position: 2,
        isVisible: true,
        size: 150,
      },
    }),
    allSegmentsCreatedBy: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'segment',
      context: {
        viewName: 'allSegments',
        viewFieldName: 'createdBy',
        fieldName: 'createdBy',
        position: 3,
        isVisible: true,
        size: 150,
      },
    }),
    allSegmentsCreatedAt: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'segment',
      context: {
        viewName: 'allSegments',
        viewFieldName: 'createdAt',
        fieldName: 'createdAt',
        position: 4,
        isVisible: true,
        size: 150,
      },
    }),
    segmentRecordPageFieldsTargetObject: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'segment',
      context: {
        viewName: 'segmentRecordPageFields',
        viewFieldName: 'targetObject',
        fieldName: 'targetObject',
        position: 0,
        isVisible: true,
        size: 150,
        viewFieldGroupName: 'general',
      },
    }),
    segmentRecordPageFieldsMemberCount: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'segment',
      context: {
        viewName: 'segmentRecordPageFields',
        viewFieldName: 'memberCount',
        fieldName: 'memberCount',
        position: 1,
        isVisible: true,
        size: 150,
        viewFieldGroupName: 'general',
      },
    }),
    segmentRecordPageFieldsCreatedAt: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'segment',
      context: {
        viewName: 'segmentRecordPageFields',
        viewFieldName: 'createdAt',
        fieldName: 'createdAt',
        position: 0,
        isVisible: true,
        size: 150,
        viewFieldGroupName: 'system',
      },
    }),
    segmentRecordPageFieldsCreatedBy: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'segment',
      context: {
        viewName: 'segmentRecordPageFields',
        viewFieldName: 'createdBy',
        fieldName: 'createdBy',
        position: 1,
        isVisible: true,
        size: 150,
        viewFieldGroupName: 'system',
      },
    }),
    segmentRecordPageFieldsUpdatedAt: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'segment',
      context: {
        viewName: 'segmentRecordPageFields',
        viewFieldName: 'updatedAt',
        fieldName: 'updatedAt',
        position: 2,
        isVisible: true,
        size: 150,
        viewFieldGroupName: 'system',
      },
    }),
    segmentRecordPageFieldsUpdatedBy: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'segment',
      context: {
        viewName: 'segmentRecordPageFields',
        viewFieldName: 'updatedBy',
        fieldName: 'updatedBy',
        position: 3,
        isVisible: true,
        size: 150,
        viewFieldGroupName: 'system',
      },
    }),
  };
};
