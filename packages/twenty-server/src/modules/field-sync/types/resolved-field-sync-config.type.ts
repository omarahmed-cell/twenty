import { type FieldMetadataType } from 'twenty-shared/types';

export type ResolvedFieldSyncConfig = {
  targetFieldId: string;
  targetFieldName: string;
  targetObjectNameSingular: string;
  joinColumnName: string;
  sourceObjectNameSingular: string;
  sourceFieldName: string;
  sourceFieldType: FieldMetadataType;
};
