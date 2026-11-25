import {
  ROBOOST_ASSOCIATION_JUNCTION_OBJECT_NAMES,
  ROBOOST_ASSOCIATION_OBJECT_NAMES,
} from 'twenty-shared/constants';
import { FieldMetadataType, RelationType } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

import { type FlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/types/flat-entity-maps.type';
import { findFlatEntityByIdInFlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/utils/find-flat-entity-by-id-in-flat-entity-maps.util';
import { type OrmFlatFieldMetadata } from 'src/engine/metadata-modules/flat-field-metadata/types/orm-flat-field-metadata.type';
import { type FlatObjectMetadata } from 'src/engine/metadata-modules/flat-object-metadata/types/flat-object-metadata.type';
import { type MutationKind } from 'src/engine/twenty-orm/sql/utils/build-mutation-statement.util';
import { type RoboostRecordAccessSubject } from 'src/engine/metadata-modules/role/types/roboost-record-access-maps.type';

type RelationSettings = {
  relationType?: RelationType;
  joinColumnName?: string;
} | null;

const getRelationSettings = (flatFieldMetadata: OrmFlatFieldMetadata) =>
  flatFieldMetadata.settings as RelationSettings;

// With Edit associations off, links between CRM records can't be added, changed or removed
export const findRoboostAssociationViolation = ({
  subject,
  flatObjectMetadata,
  flatObjectMetadataMaps,
  flatFieldMetadataMaps,
  operationType,
  updatedColumns,
}: {
  subject: RoboostRecordAccessSubject;
  flatObjectMetadata: FlatObjectMetadata;
  flatObjectMetadataMaps: FlatEntityMaps<FlatObjectMetadata>;
  flatFieldMetadataMaps: FlatEntityMaps<OrmFlatFieldMetadata>;
  operationType: MutationKind | 'insert';
  updatedColumns: string[];
}): string | null => {
  if (subject.permissions.toggles.editAssociations === true) {
    return null;
  }

  if (
    ROBOOST_ASSOCIATION_JUNCTION_OBJECT_NAMES.includes(
      flatObjectMetadata.nameSingular,
    )
  ) {
    return 'editing associations is turned off for this user';
  }

  if (
    operationType !== 'update' ||
    !ROBOOST_ASSOCIATION_OBJECT_NAMES.includes(flatObjectMetadata.nameSingular)
  ) {
    return null;
  }

  const associationJoinColumns = flatObjectMetadata.fieldIds
    .map((fieldId) =>
      findFlatEntityByIdInFlatEntityMaps({
        flatEntityId: fieldId,
        flatEntityMaps: flatFieldMetadataMaps,
      }),
    )
    .filter(isDefined)
    .filter(
      (flatFieldMetadata) =>
        flatFieldMetadata.type === FieldMetadataType.RELATION &&
        getRelationSettings(flatFieldMetadata)?.relationType ===
          RelationType.MANY_TO_ONE &&
        isDefined(flatFieldMetadata.relationTargetObjectMetadataId) &&
        ROBOOST_ASSOCIATION_OBJECT_NAMES.includes(
          findFlatEntityByIdInFlatEntityMaps({
            flatEntityId: flatFieldMetadata.relationTargetObjectMetadataId,
            flatEntityMaps: flatObjectMetadataMaps,
          })?.nameSingular ?? '',
        ),
    )
    .map(
      (flatFieldMetadata) =>
        getRelationSettings(flatFieldMetadata)?.joinColumnName,
    )
    .filter(isDefined);

  const changedAssociationColumn = updatedColumns.find((columnName) =>
    associationJoinColumns.includes(columnName),
  );

  return isDefined(changedAssociationColumn)
    ? `changing "${changedAssociationColumn}" edits an association, which is turned off for this user`
    : null;
};
