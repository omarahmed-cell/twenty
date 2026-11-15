import { type FlatViewField } from 'src/engine/metadata-modules/flat-view-field/types/flat-view-field.type';
import {
  createStandardViewFieldFlatMetadata,
  type CreateStandardViewFieldArgs,
} from 'src/engine/workspace-manager/twenty-standard-application/utils/view-field/create-standard-view-field-flat-metadata.util';

export const computeStandardOpportunityCollaboratorViewFields = (
  args: Omit<CreateStandardViewFieldArgs<'opportunityCollaborator'>, 'context'>,
): Record<string, FlatViewField> => {
  return {
    allOpportunityCollaboratorsId: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'opportunityCollaborator',
      context: {
        viewName: 'allOpportunityCollaborators',
        viewFieldName: 'id',
        fieldName: 'id',
        position: 0,
        isVisible: true,
        size: 210,
      },
    }),
    allOpportunityCollaboratorsOpportunity: createStandardViewFieldFlatMetadata(
      {
        ...args,
        objectName: 'opportunityCollaborator',
        context: {
          viewName: 'allOpportunityCollaborators',
          viewFieldName: 'opportunity',
          fieldName: 'opportunity',
          position: 1,
          isVisible: true,
          size: 150,
        },
      },
    ),
    allOpportunityCollaboratorsWorkspaceMember:
      createStandardViewFieldFlatMetadata({
        ...args,
        objectName: 'opportunityCollaborator',
        context: {
          viewName: 'allOpportunityCollaborators',
          viewFieldName: 'workspaceMember',
          fieldName: 'workspaceMember',
          position: 2,
          isVisible: true,
          size: 150,
        },
      }),
    allOpportunityCollaboratorsCreatedAt: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'opportunityCollaborator',
      context: {
        viewName: 'allOpportunityCollaborators',
        viewFieldName: 'createdAt',
        fieldName: 'createdAt',
        position: 3,
        isVisible: true,
        size: 150,
      },
    }),
  };
};
