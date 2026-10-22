import { type FlatViewField } from 'src/engine/metadata-modules/flat-view-field/types/flat-view-field.type';
import {
  createStandardViewFieldFlatMetadata,
  type CreateStandardViewFieldArgs,
} from 'src/engine/workspace-manager/twenty-standard-application/utils/view-field/create-standard-view-field-flat-metadata.util';

export const computeStandardCommunicationViewFields = (
  args: Omit<CreateStandardViewFieldArgs<'communication'>, 'context'>,
): Record<string, FlatViewField> => {
  return {
    allCommunicationsTitle: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'communication',
      context: {
        viewName: 'allCommunications',
        viewFieldName: 'title',
        fieldName: 'title',
        position: 0,
        isVisible: true,
        size: 210,
      },
    }),
    allCommunicationsDirection: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'communication',
      context: {
        viewName: 'allCommunications',
        viewFieldName: 'direction',
        fieldName: 'direction',
        position: 2,
        isVisible: true,
        size: 150,
      },
    }),
    allCommunicationsBodyV2: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'communication',
      context: {
        viewName: 'allCommunications',
        viewFieldName: 'bodyV2',
        fieldName: 'bodyV2',
        position: 3,
        isVisible: true,
        size: 150,
      },
    }),
    allCommunicationsCreatedBy: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'communication',
      context: {
        viewName: 'allCommunications',
        viewFieldName: 'createdBy',
        fieldName: 'createdBy',
        position: 4,
        isVisible: true,
        size: 150,
      },
    }),
    allCommunicationsCreatedAt: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'communication',
      context: {
        viewName: 'allCommunications',
        viewFieldName: 'createdAt',
        fieldName: 'createdAt',
        position: 5,
        isVisible: true,
        size: 150,
      },
    }),
    communicationRecordPageFieldsDirection: createStandardViewFieldFlatMetadata(
      {
        ...args,
        objectName: 'communication',
        context: {
          viewName: 'communicationRecordPageFields',
          viewFieldName: 'direction',
          fieldName: 'direction',
          position: 1,
          isVisible: true,
          size: 150,
          viewFieldGroupName: 'general',
        },
      },
    ),
    communicationRecordPageFieldsCreatedAt: createStandardViewFieldFlatMetadata(
      {
        ...args,
        objectName: 'communication',
        context: {
          viewName: 'communicationRecordPageFields',
          viewFieldName: 'createdAt',
          fieldName: 'createdAt',
          position: 2,
          isVisible: true,
          size: 150,
          viewFieldGroupName: 'general',
        },
      },
    ),
    communicationRecordPageFieldsCreatedBy: createStandardViewFieldFlatMetadata(
      {
        ...args,
        objectName: 'communication',
        context: {
          viewName: 'communicationRecordPageFields',
          viewFieldName: 'createdBy',
          fieldName: 'createdBy',
          position: 3,
          isVisible: true,
          size: 150,
          viewFieldGroupName: 'general',
        },
      },
    ),
    communicationRecordPageFieldsTimelineActivities:
      createStandardViewFieldFlatMetadata({
        ...args,
        objectName: 'communication',
        context: {
          viewName: 'communicationRecordPageFields',
          viewFieldName: 'timelineActivities',
          fieldName: 'timelineActivities',
          position: 4,
          isVisible: false,
          size: 150,
          viewFieldGroupName: 'general',
        },
      }),
    allCommunicationsCommunicationTargets: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'communication',
      context: {
        viewName: 'allCommunications',
        viewFieldName: 'communicationTargets',
        fieldName: 'communicationTargets',
        position: 1,
        isVisible: true,
        size: 150,
      },
    }),
    communicationRecordPageFieldsCommunicationTargets:
      createStandardViewFieldFlatMetadata({
        ...args,
        objectName: 'communication',
        context: {
          viewName: 'communicationRecordPageFields',
          viewFieldName: 'communicationTargets',
          fieldName: 'communicationTargets',
          position: 0,
          isVisible: true,
          size: 150,
          viewFieldGroupName: 'general',
        },
      }),
    communicationRecordPageFieldsAttachments:
      createStandardViewFieldFlatMetadata({
        ...args,
        objectName: 'communication',
        context: {
          viewName: 'communicationRecordPageFields',
          viewFieldName: 'attachments',
          fieldName: 'attachments',
          position: 5,
          isVisible: false,
          size: 150,
          viewFieldGroupName: 'general',
        },
      }),
    allCommunicationsChannelType: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'communication',
      context: {
        viewName: 'allCommunications',
        viewFieldName: 'channelType',
        fieldName: 'channelType',
        position: 6,
        isVisible: true,
        size: 150,
      },
    }),
    communicationRecordPageFieldsChannelType:
      createStandardViewFieldFlatMetadata({
        ...args,
        objectName: 'communication',
        context: {
          viewName: 'communicationRecordPageFields',
          viewFieldName: 'channelType',
          fieldName: 'channelType',
          position: 6,
          isVisible: true,
          size: 150,
          viewFieldGroupName: 'general',
        },
      }),
  };
};
