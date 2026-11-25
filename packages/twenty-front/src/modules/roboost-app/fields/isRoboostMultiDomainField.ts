import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';

// Only the company Domain keeps extra values; other link fields stay single
export const isRoboostMultiDomainField = (
  field: Pick<FieldMetadataItem, 'name'>,
) => field.name === 'domainName';
