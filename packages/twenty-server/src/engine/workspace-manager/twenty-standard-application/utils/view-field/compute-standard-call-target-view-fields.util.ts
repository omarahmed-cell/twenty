import { type FlatViewField } from 'src/engine/metadata-modules/flat-view-field/types/flat-view-field.type';
import {
  createStandardViewFieldFlatMetadata,
  type CreateStandardViewFieldArgs,
} from 'src/engine/workspace-manager/twenty-standard-application/utils/view-field/create-standard-view-field-flat-metadata.util';

export const computeStandardCallTargetViewFields = (
  args: Omit<CreateStandardViewFieldArgs<'callTarget'>, 'context'>,
): Record<string, FlatViewField> => {
  return {
    allCallTargetsId: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'callTarget',
      context: {
        viewName: 'allCallTargets',
        viewFieldName: 'id',
        fieldName: 'id',
        position: 0,
        isVisible: true,
        size: 210,
      },
    }),
    allCallTargetsCall: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'callTarget',
      context: {
        viewName: 'allCallTargets',
        viewFieldName: 'call',
        fieldName: 'call',
        position: 1,
        isVisible: true,
        size: 150,
      },
    }),
    // All morph targets are included so the surviving field after dedup always has a viewField
    allCallTargetsTargetPerson: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'callTarget',
      context: {
        viewName: 'allCallTargets',
        viewFieldName: 'targetPerson',
        fieldName: 'targetPerson',
        position: 2,
        isVisible: true,
        size: 150,
      },
    }),
    allCallTargetsTargetCompany: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'callTarget',
      context: {
        viewName: 'allCallTargets',
        viewFieldName: 'targetCompany',
        fieldName: 'targetCompany',
        position: 3,
        isVisible: true,
        size: 150,
      },
    }),
    allCallTargetsTargetOpportunity: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'callTarget',
      context: {
        viewName: 'allCallTargets',
        viewFieldName: 'targetOpportunity',
        fieldName: 'targetOpportunity',
        position: 4,
        isVisible: true,
        size: 150,
      },
    }),
    allCallTargetsTargetService: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'callTarget',
      context: {
        viewName: 'allCallTargets',
        viewFieldName: 'targetService',
        fieldName: 'targetService',
        position: 5,
        isVisible: true,
        size: 150,
      },
    }),
  };
};
