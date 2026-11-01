export const FIELD_SYNC_POLICIES = [
  'FIRST_CREATED',
  'MOST_RECENTLY_CREATED',
] as const;

export type FieldSyncPolicy = (typeof FIELD_SYNC_POLICIES)[number];

// Mirrors a property of an associated record; policy only applies to to-many relations.
export type FieldMetadataSyncSettings = {
  relationFieldMetadataId: string;
  sourceFieldMetadataId: string;
  policy?: FieldSyncPolicy;
};
