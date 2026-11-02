import {
  type FieldMetadataType,
  type FieldSyncPolicy,
} from 'twenty-shared/types';

// TO_ONE: the join column lives on the target. TO_MANY: it lives on the sources.
export type FieldSyncCardinality =
  | { cardinality: 'TO_ONE'; joinColumnName: string }
  | {
      cardinality: 'TO_MANY';
      sourceJoinColumnName: string;
      policy: FieldSyncPolicy;
    };

export type ResolvedFieldSyncConfig = {
  targetFieldId: string;
  targetFieldName: string;
  targetObjectNameSingular: string;
  sourceObjectNameSingular: string;
  sourceFieldName: string;
  sourceFieldType: FieldMetadataType;
} & FieldSyncCardinality;
