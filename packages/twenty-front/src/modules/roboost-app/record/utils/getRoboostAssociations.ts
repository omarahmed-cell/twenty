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
      id: string;
      kind: 'junction';
      field: FieldMetadataItem;
      title: string;
      targetObjectMetadataItem: EnrichedObjectMetadataItem;
      junctionObjectMetadataItem: EnrichedObjectMetadataItem;
      // Junction column pointing back at the record whose page shows the card
      sourceJoinColumnName: string;
      targetFieldName: string;
      targetJoinColumnName: string;
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

// Hidden junctions shown as a card of the records on their far side: a deal's contacts
const ROBOOST_JUNCTION_ASSOCIATIONS: {
  sourceObjectNameSingular: string;
  junctionObjectNameSingular: string;
  targetFieldName: string;
}[] = [
  {
    sourceObjectNameSingular: 'opportunity',
    junctionObjectNameSingular: 'opportunityContact',
    targetFieldName: 'person',
  },
];

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

    const junction = ROBOOST_JUNCTION_ASSOCIATIONS.find(
      (candidate) =>
        candidate.sourceObjectNameSingular ===
          objectMetadataItem.nameSingular &&
        candidate.junctionObjectNameSingular === target?.nameSingular,
    );

    if (isDefined(junction) && isDefined(target)) {
      const targetField = target.fields.find(
        (junctionField) =>
          junctionField.name === junction.targetFieldName &&
          junctionField.isActive,
      );
      const farTarget = findObject(
        targetField?.relation?.targetObjectMetadata.nameSingular,
      );

      if (
        relation.type === RelationType.ONE_TO_MANY &&
        isDefined(targetField) &&
        isDefined(farTarget)
      ) {
        associations.push({
          id: field.name,
          kind: 'junction',
          field,
          title: field.label,
          targetObjectMetadataItem: farTarget,
          junctionObjectMetadataItem: target,
          sourceJoinColumnName: `${relation.targetFieldMetadata.name}Id`,
          targetFieldName: targetField.name,
          targetJoinColumnName: `${targetField.name}Id`,
        });
      }
      continue;
    }

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
