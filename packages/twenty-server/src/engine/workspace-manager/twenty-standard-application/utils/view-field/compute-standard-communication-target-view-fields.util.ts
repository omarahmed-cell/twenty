import { type FlatViewField } from 'src/engine/metadata-modules/flat-view-field/types/flat-view-field.type';
import {
  createStandardViewFieldFlatMetadata,
  type CreateStandardViewFieldArgs,
} from 'src/engine/workspace-manager/twenty-standard-application/utils/view-field/create-standard-view-field-flat-metadata.util';

export const computeStandardCommunicationTargetViewFields = (
  args: Omit<CreateStandardViewFieldArgs<'communicationTarget'>, 'context'>,
): Record<string, FlatViewField> => {
  return {
    allCommunicationTargetsId: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'communicationTarget',
      context: {
        viewName: 'allCommunicationTargets',
        viewFieldName: 'id',
        fieldName: 'id',
        position: 0,
        isVisible: true,
        size: 210,
      },
    }),
    allCommunicationTargetsCommunication: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'communicationTarget',
      context: {
        viewName: 'allCommunicationTargets',
        viewFieldName: 'communication',
        fieldName: 'communication',
        position: 1,
        isVisible: true,
        size: 150,
      },
    }),
    // All morph targets are included so the surviving field after dedup always has a viewField
    allCommunicationTargetsTargetPerson: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'communicationTarget',
      context: {
        viewName: 'allCommunicationTargets',
        viewFieldName: 'targetPerson',
        fieldName: 'targetPerson',
        position: 2,
        isVisible: true,
        size: 150,
      },
    }),
    allCommunicationTargetsTargetCompany: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'communicationTarget',
      context: {
        viewName: 'allCommunicationTargets',
        viewFieldName: 'targetCompany',
        fieldName: 'targetCompany',
        position: 3,
        isVisible: true,
        size: 150,
      },
    }),
    allCommunicationTargetsTargetOpportunity:
      createStandardViewFieldFlatMetadata({
        ...args,
        objectName: 'communicationTarget',
        context: {
          viewName: 'allCommunicationTargets',
          viewFieldName: 'targetOpportunity',
          fieldName: 'targetOpportunity',
          position: 4,
          isVisible: true,
          size: 150,
        },
      }),
    allCommunicationTargetsTargetService: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'communicationTarget',
      context: {
        viewName: 'allCommunicationTargets',
        viewFieldName: 'targetService',
        fieldName: 'targetService',
        position: 5,
        isVisible: true,
        size: 150,
      },
    }),
  };
};
