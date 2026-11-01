import { FieldMetadataType } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';
import { WORKFLOW_ACTION_EXECUTION_DATE_TOKEN } from 'twenty-shared/workflow';

import { findManyFlatEntityByIdInFlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/utils/find-many-flat-entity-by-id-in-flat-entity-maps.util';
import { type ObjectMetadataInfo } from 'src/modules/workflow/common/workspace-services/workflow-metadata-read.workspace-service';

export const resolveActionExecutionDateFields = (
  objectRecord: Record<string, unknown>,
  objectMetadataInfo: Pick<
    ObjectMetadataInfo,
    'flatObjectMetadata' | 'flatFieldMetadataMaps'
  >,
  executedAt: Date,
): Record<string, unknown> => {
  const { flatObjectMetadata, flatFieldMetadataMaps } = objectMetadataInfo;

  const resolvedRecord = { ...objectRecord };

  const dateFields = findManyFlatEntityByIdInFlatEntityMaps({
    flatEntityIds: flatObjectMetadata.fieldIds,
    flatEntityMaps: flatFieldMetadataMaps,
  })
    .filter(isDefined)
    .filter(
      (field) =>
        field.type === FieldMetadataType.DATE_TIME ||
        field.type === FieldMetadataType.DATE,
    );

  for (const field of dateFields) {
    if (resolvedRecord[field.name] !== WORKFLOW_ACTION_EXECUTION_DATE_TOKEN) {
      continue;
    }

    const executedAtIso = executedAt.toISOString();

    resolvedRecord[field.name] =
      field.type === FieldMetadataType.DATE_TIME
        ? executedAtIso
        : executedAtIso.slice(0, 10);
  }

  return resolvedRecord;
};
