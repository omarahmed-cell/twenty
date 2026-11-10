import { type FlatViewField } from 'src/engine/metadata-modules/flat-view-field/types/flat-view-field.type';
import {
  createStandardViewFieldFlatMetadata,
  type CreateStandardViewFieldArgs,
} from 'src/engine/workspace-manager/twenty-standard-application/utils/view-field/create-standard-view-field-flat-metadata.util';

export const computeStandardOpportunityContactViewFields = (
  args: Omit<CreateStandardViewFieldArgs<'opportunityContact'>, 'context'>,
): Record<string, FlatViewField> => {
  return {
    allOpportunityContactsId: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'opportunityContact',
      context: {
        viewName: 'allOpportunityContacts',
        viewFieldName: 'id',
        fieldName: 'id',
        position: 0,
        isVisible: true,
        size: 210,
      },
    }),
    allOpportunityContactsOpportunity: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'opportunityContact',
      context: {
        viewName: 'allOpportunityContacts',
        viewFieldName: 'opportunity',
        fieldName: 'opportunity',
        position: 1,
        isVisible: true,
        size: 150,
      },
    }),
    allOpportunityContactsPerson: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'opportunityContact',
      context: {
        viewName: 'allOpportunityContacts',
        viewFieldName: 'person',
        fieldName: 'person',
        position: 2,
        isVisible: true,
        size: 150,
      },
    }),
    allOpportunityContactsCreatedAt: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'opportunityContact',
      context: {
        viewName: 'allOpportunityContacts',
        viewFieldName: 'createdAt',
        fieldName: 'createdAt',
        position: 3,
        isVisible: true,
        size: 150,
      },
    }),
  };
};
