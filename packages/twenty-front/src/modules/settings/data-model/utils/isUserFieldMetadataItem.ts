import { CoreObjectNameSingular } from 'twenty-shared/types';

import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { FieldMetadataType, RelationType } from '~/generated-metadata/graphql';

// "User" is a Settings preset over a many-to-one relation to workspaceMember, not a field type.
export const isUserFieldMetadataItem = (
  fieldMetadataItem: Pick<FieldMetadataItem, 'type' | 'relation'>,
) =>
  fieldMetadataItem.type === FieldMetadataType.RELATION &&
  fieldMetadataItem.relation?.type === RelationType.MANY_TO_ONE &&
  fieldMetadataItem.relation.targetObjectMetadata.nameSingular ===
    CoreObjectNameSingular.WorkspaceMember;
