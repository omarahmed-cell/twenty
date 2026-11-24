import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';

// Stored as a fraction (0.429), shown as 42.9%: one decimal, no trailing ".0"
export const formatRoboostPercentage = (fraction: number) =>
  `${Number((fraction * 100).toFixed(1)).toLocaleString('en-US', {
    maximumFractionDigits: 1,
  })}%`;

export const isRoboostPercentageField = (
  field: Pick<FieldMetadataItem, 'settings'>,
) =>
  (field.settings as { type?: string } | null | undefined)?.type ===
  'percentage';
