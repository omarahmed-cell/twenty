import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { FieldMetadataType } from '~/generated-metadata/graphql';

// Relations are written through their join column
export const getRoboostFieldInputKey = (field: FieldMetadataItem) =>
  field.type === FieldMetadataType.RELATION ? `${field.name}Id` : field.name;
