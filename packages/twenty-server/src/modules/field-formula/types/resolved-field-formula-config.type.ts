import { type FieldMetadataType } from 'twenty-shared/types';
import { type FormulaOutputFieldType } from 'twenty-shared/utils';

export type FieldFormulaDependency = {
  fieldId: string;
  name: string;
  type: FieldMetadataType;
};

export type ResolvedFieldFormulaConfig = {
  targetFieldId: string;
  targetFieldName: string;
  outputType: FormulaOutputFieldType;
  objectNameSingular: string;
  expression: string;
  dependencies: FieldFormulaDependency[];
};
