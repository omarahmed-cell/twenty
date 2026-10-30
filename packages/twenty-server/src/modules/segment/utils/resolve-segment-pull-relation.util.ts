import {
  FieldMetadataType,
  RelationType,
  type SegmentTargetObject,
} from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

import { type FlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/types/flat-entity-maps.type';
import { findFlatEntityByIdInFlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/utils/find-flat-entity-by-id-in-flat-entity-maps.util';
import { type FlatFieldMetadata } from 'src/engine/metadata-modules/flat-field-metadata/types/flat-field-metadata.type';
import { type FlatObjectMetadata } from 'src/engine/metadata-modules/flat-object-metadata/types/flat-object-metadata.type';
import {
  SEGMENT_TARGET_OBJECT_CONFIGS,
  SEGMENT_TARGET_OBJECTS,
} from 'src/modules/segment/constants/segment-target-object-configs.constant';
import {
  SegmentException,
  SegmentExceptionCode,
} from 'src/modules/segment/exceptions/segment.exception';

export type SegmentPullRelation =
  | {
      relationType: 'MANY_TO_ONE';
      targetObject: SegmentTargetObject;
      sourceJoinColumnName: string;
    }
  | {
      relationType: 'ONE_TO_MANY';
      targetObject: SegmentTargetObject;
      targetJoinColumnName: string;
    };

const throwInvalidRelation = (message: string): never => {
  throw new SegmentException(
    message,
    SegmentExceptionCode.SEGMENT_PULL_RELATION_INVALID,
  );
};

const getJoinColumnName = (flatFieldMetadata: FlatFieldMetadata) => {
  const settings = flatFieldMetadata.settings as {
    relationType?: RelationType;
    joinColumnName?: string | null;
  } | null;

  return settings?.relationType === RelationType.MANY_TO_ONE
    ? (settings.joinColumnName ?? undefined)
    : undefined;
};

export const resolveSegmentPullRelation = ({
  relationFieldMetadataId,
  sourceObject,
  flatFieldMetadataMaps,
  flatObjectMetadataMaps,
}: {
  relationFieldMetadataId: string;
  sourceObject: SegmentTargetObject;
  flatFieldMetadataMaps: FlatEntityMaps<FlatFieldMetadata>;
  flatObjectMetadataMaps: FlatEntityMaps<FlatObjectMetadata>;
}): SegmentPullRelation => {
  const relationField = findFlatEntityByIdInFlatEntityMaps({
    flatEntityMaps: flatFieldMetadataMaps,
    flatEntityId: relationFieldMetadataId,
  });

  if (
    !isDefined(relationField) ||
    !relationField.isActive ||
    relationField.type !== FieldMetadataType.RELATION
  ) {
    return throwInvalidRelation(
      `Field ${relationFieldMetadataId} is not an active relation`,
    );
  }

  const sourceObjectMetadata = findFlatEntityByIdInFlatEntityMaps({
    flatEntityMaps: flatObjectMetadataMaps,
    flatEntityId: relationField.objectMetadataId,
  });

  if (
    sourceObjectMetadata?.nameSingular !==
    SEGMENT_TARGET_OBJECT_CONFIGS[sourceObject].objectNameSingular
  ) {
    return throwInvalidRelation(
      `Field ${relationFieldMetadataId} does not belong to the source segment's object`,
    );
  }

  const targetObjectMetadata = isDefined(
    relationField.relationTargetObjectMetadataId,
  )
    ? findFlatEntityByIdInFlatEntityMaps({
        flatEntityMaps: flatObjectMetadataMaps,
        flatEntityId: relationField.relationTargetObjectMetadataId,
      })
    : undefined;

  const targetObject = SEGMENT_TARGET_OBJECTS.find(
    (segmentTargetObject) =>
      SEGMENT_TARGET_OBJECT_CONFIGS[segmentTargetObject].objectNameSingular ===
      targetObjectMetadata?.nameSingular,
  );

  if (!isDefined(targetObject)) {
    return throwInvalidRelation(
      `Field ${relationFieldMetadataId} does not point at companies, people or opportunities`,
    );
  }

  const sourceJoinColumnName = getJoinColumnName(relationField);

  if (isDefined(sourceJoinColumnName)) {
    return { relationType: 'MANY_TO_ONE', targetObject, sourceJoinColumnName };
  }

  const inverseField = isDefined(relationField.relationTargetFieldMetadataId)
    ? findFlatEntityByIdInFlatEntityMaps({
        flatEntityMaps: flatFieldMetadataMaps,
        flatEntityId: relationField.relationTargetFieldMetadataId,
      })
    : undefined;

  const targetJoinColumnName =
    isDefined(inverseField) && inverseField.type === FieldMetadataType.RELATION
      ? getJoinColumnName(inverseField)
      : undefined;

  if (!isDefined(targetJoinColumnName)) {
    return throwInvalidRelation(
      `Relation ${relationFieldMetadataId} has no usable join column`,
    );
  }

  return { relationType: 'ONE_TO_MANY', targetObject, targetJoinColumnName };
};
