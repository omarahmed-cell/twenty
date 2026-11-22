import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { CoreObjectNameSingular } from 'twenty-shared/types';
import { capitalize, isDefined } from 'twenty-shared/utils';
import { RelationType } from '~/generated-metadata/graphql';

export type RoboostAssociation =
  | {
      id: string;
      kind: 'many';
      field: FieldMetadataItem;
      title: string;
      targetObjectMetadataItem: EnrichedObjectMetadataItem;
      joinColumnName: string;
    }
  | {
      id: string;
      kind: 'one';
      field: FieldMetadataItem;
      title: string;
      targetObjectMetadataItem: EnrichedObjectMetadataItem;
    }
  | {
      id: 'attachments';
      kind: 'attachments';
      title: string;
      joinColumnName: string;
    };

// Activities have their own column; members and system objects are not associations
const EXCLUDED_TARGET_OBJECTS = new Set<string>([
  CoreObjectNameSingular.WorkspaceMember,
  CoreObjectNameSingular.Attachment,
  CoreObjectNameSingular.TimelineActivity,
  CoreObjectNameSingular.Note,
  CoreObjectNameSingular.Task,
  CoreObjectNameSingular.Workflow,
  CoreObjectNameSingular.WorkflowRun,
  CoreObjectNameSingular.WorkflowVersion,
]);

export const getRoboostAssociations = (
  objectMetadataItem: EnrichedObjectMetadataItem,
  objectMetadataItems: EnrichedObjectMetadataItem[],
  attachmentsTitle: string,
): RoboostAssociation[] => {
  const findObject = (nameSingular: string | undefined) =>
    objectMetadataItems.find(
      (item) => item.nameSingular === nameSingular && item.isActive,
    );

  const associations: RoboostAssociation[] = [];

  for (const field of objectMetadataItem.fields) {
    const relation = field.relation;

    if (!field.isActive || !isDefined(relation)) {
      continue;
    }
    const target = findObject(relation.targetObjectMetadata.nameSingular);

    if (
      !isDefined(target) ||
      target.isSystem ||
      EXCLUDED_TARGET_OBJECTS.has(target.nameSingular)
    ) {
      continue;
    }

    if (relation.type === RelationType.ONE_TO_MANY) {
      associations.push({
        id: field.name,
        kind: 'many',
        field,
        title: field.label,
        targetObjectMetadataItem: target,
        joinColumnName: `${relation.targetFieldMetadata.name}Id`,
      });
    } else if (relation.type === RelationType.MANY_TO_ONE) {
      associations.push({
        id: field.name,
        kind: 'one',
        field,
        title: field.label,
        targetObjectMetadataItem: target,
      });
    }
  }

  const hasAttachments = objectMetadataItem.fields.some(
    (field) =>
      field.isActive &&
      field.relation?.targetObjectMetadata.nameSingular ===
        CoreObjectNameSingular.Attachment,
  );

  if (hasAttachments) {
    associations.push({
      id: 'attachments',
      kind: 'attachments',
      title: attachmentsTitle,
      joinColumnName: `target${capitalize(objectMetadataItem.nameSingular)}Id`,
    });
  }

  return associations;
};
