import { type FieldMetadataType } from 'twenty-shared/types';
import {
  type FormulaOutputConfig,
  type FormulaOutputFieldType,
} from 'twenty-shared/utils';

export type FieldFormulaDependency = {
  fieldId: string;
  name: string;
  type: FieldMetadataType;
};

export type ResolvedFieldFormulaConfig = {
  targetFieldId: string;
  targetFieldName: string;
  outputType: FormulaOutputFieldType;
  outputConfig: FormulaOutputConfig;
  objectNameSingular: string;
  expression: string;
  dependencies: FieldFormulaDependency[];
};
