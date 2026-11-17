import { type ActorMetadata } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { type PropertySettings } from '@/properties/types/PropertySettings';

export const NO_PROPERTY_GROUP_FILTER = 'none';
export const ALL_FILTER = 'all';

export type PropertyTableRow = {
  fieldMetadataItem: FieldMetadataItem;
  membershipId: string | null;
  propertyGroupId: string | null;
  groupName: string | null;
  positionInGroup: number;
  typeLabel: string;
  typeFilterLabel: string;
  appLabel: string;
  createdBy: Pick<ActorMetadata, 'source' | 'name'> | null;
};

export const buildPropertyTableRows = ({
  fieldMetadataItems,
  propertySettings,
  getTypeLabel,
  getTypeFilterLabel,
  getAppLabel,
}: {
  fieldMetadataItems: FieldMetadataItem[];
  propertySettings: PropertySettings | null;
  getTypeLabel: (fieldMetadataItem: FieldMetadataItem) => string;
  getTypeFilterLabel: (fieldMetadataItem: FieldMetadataItem) => string;
  getAppLabel: (fieldMetadataItem: FieldMetadataItem) => string;
}): PropertyTableRow[] => {
  const groupNameById = new Map(
    (propertySettings?.groups ?? []).map(({ id, name }) => [id, name]),
  );
  const membershipByFieldId = new Map(
    (propertySettings?.memberships ?? []).map((membership) => [
      membership.fieldMetadataId,
      membership,
    ]),
  );
  const creationByFieldId = new Map(
    (propertySettings?.creations ?? []).map((creation) => [
      creation.fieldMetadataId,
      creation,
    ]),
  );

  return fieldMetadataItems.map((fieldMetadataItem) => {
    const membership = membershipByFieldId.get(fieldMetadataItem.id);
    const groupName = isDefined(membership)
      ? (groupNameById.get(membership.propertyGroupId) ?? null)
      : null;

    return {
      fieldMetadataItem,
      membershipId: isDefined(groupName) ? (membership?.id ?? null) : null,
      propertyGroupId: isDefined(groupName)
        ? (membership?.propertyGroupId ?? null)
        : null,
      groupName,
      positionInGroup: membership?.position ?? 0,
      typeLabel: getTypeLabel(fieldMetadataItem),
      typeFilterLabel: getTypeFilterLabel(fieldMetadataItem),
      appLabel: getAppLabel(fieldMetadataItem),
      createdBy: creationByFieldId.get(fieldMetadataItem.id)?.createdBy ?? null,
    };
  });
};

export const filterPropertyTableRows = ({
  rows,
  searchTerm,
  groupFilter,
  typeFilter,
  appFilter,
  createdByFilter,
  getCreatedByLabel,
}: {
  rows: PropertyTableRow[];
  searchTerm: string;
  groupFilter: string;
  typeFilter: string;
  appFilter: string;
  createdByFilter: string;
  getCreatedByLabel: (row: PropertyTableRow) => string;
}): PropertyTableRow[] => {
  const normalizedSearch = searchTerm.trim().toLowerCase();

  const filtered = rows.filter(
    (row) =>
      (normalizedSearch === '' ||
        row.fieldMetadataItem.label.toLowerCase().includes(normalizedSearch) ||
        row.fieldMetadataItem.name.toLowerCase().includes(normalizedSearch)) &&
      (groupFilter === ALL_FILTER ||
        (groupFilter === NO_PROPERTY_GROUP_FILTER
          ? !isDefined(row.propertyGroupId)
          : row.propertyGroupId === groupFilter)) &&
      (typeFilter === ALL_FILTER || row.typeFilterLabel === typeFilter) &&
      (appFilter === ALL_FILTER || row.appLabel === appFilter) &&
      (createdByFilter === ALL_FILTER ||
        getCreatedByLabel(row) === createdByFilter),
  );

  const isOneGroup =
    groupFilter !== ALL_FILTER && groupFilter !== NO_PROPERTY_GROUP_FILTER;

  // Inside one group the rows follow the group's own order, which is what the record page will show
  return isOneGroup
    ? [...filtered].sort(
        (left, right) => left.positionInGroup - right.positionInGroup,
      )
    : [...filtered].sort((left, right) =>
        left.fieldMetadataItem.label.localeCompare(
          right.fieldMetadataItem.label,
        ),
      );
};
