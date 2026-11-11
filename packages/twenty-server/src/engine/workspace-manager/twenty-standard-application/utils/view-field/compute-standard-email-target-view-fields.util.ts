import { type FlatViewField } from 'src/engine/metadata-modules/flat-view-field/types/flat-view-field.type';
import {
  createStandardViewFieldFlatMetadata,
  type CreateStandardViewFieldArgs,
} from 'src/engine/workspace-manager/twenty-standard-application/utils/view-field/create-standard-view-field-flat-metadata.util';

export const computeStandardEmailTargetViewFields = (
  args: Omit<CreateStandardViewFieldArgs<'emailTarget'>, 'context'>,
): Record<string, FlatViewField> => {
  return {
    allEmailTargetsId: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'emailTarget',
      context: {
        viewName: 'allEmailTargets',
        viewFieldName: 'id',
        fieldName: 'id',
        position: 0,
        isVisible: true,
        size: 210,
      },
    }),
    allEmailTargetsEmail: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'emailTarget',
      context: {
        viewName: 'allEmailTargets',
        viewFieldName: 'email',
        fieldName: 'email',
        position: 1,
        isVisible: true,
        size: 150,
      },
    }),
    // All morph targets are included so the surviving field after dedup always has a viewField
    allEmailTargetsTargetPerson: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'emailTarget',
      context: {
        viewName: 'allEmailTargets',
        viewFieldName: 'targetPerson',
        fieldName: 'targetPerson',
        position: 2,
        isVisible: true,
        size: 150,
      },
    }),
    allEmailTargetsTargetCompany: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'emailTarget',
      context: {
        viewName: 'allEmailTargets',
        viewFieldName: 'targetCompany',
        fieldName: 'targetCompany',
        position: 3,
        isVisible: true,
        size: 150,
      },
    }),
    allEmailTargetsTargetOpportunity: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'emailTarget',
      context: {
        viewName: 'allEmailTargets',
        viewFieldName: 'targetOpportunity',
        fieldName: 'targetOpportunity',
        position: 4,
        isVisible: true,
        size: 150,
      },
    }),
    allEmailTargetsTargetService: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'emailTarget',
      context: {
        viewName: 'allEmailTargets',
        viewFieldName: 'targetService',
        fieldName: 'targetService',
        position: 5,
        isVisible: true,
        size: 150,
      },
    }),
  };
};
