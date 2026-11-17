import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SettingsPath } from 'twenty-shared/types';
import { getSettingsPath, isDefined } from 'twenty-shared/utils';
import { LightIconButton, SearchInput } from 'twenty-ui/components/input';
import { Section } from 'twenty-ui/components/layout';
import { IconPlus, IconX } from 'twenty-ui/icon';
import { Button } from 'twenty-ui/primitives/input';
import { OverflowingTextWithTooltip } from 'twenty-ui/primitives/typography';
import { themeCssVariables } from 'twenty-ui/theme';

import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { isHiddenSystemField } from '@/object-metadata/utils/isHiddenSystemField';
import { usePropertySettings } from '@/properties/hooks/usePropertySettings';
import { SettingsPipelineDragHandle } from '@/settings/data-model/pipelines/components/SettingsPipelineDragHandle';
import { computeReorderedPositions } from '@/settings/data-model/pipelines/utils/computeReorderedPositions';
import { useSettingsPropertyActions } from '@/settings/data-model/properties/hooks/useSettingsPropertyActions';
import { propertyCreationContextState } from '@/settings/data-model/properties/states/propertyCreationContextState';
import {
  ALL_FILTER,
  buildPropertyTableRows,
  filterPropertyTableRows,
  NO_PROPERTY_GROUP_FILTER,
  type PropertyTableRow,
} from '@/settings/data-model/properties/utils/buildPropertyTableRows';
import { getPropertyCreatedByLabel } from '@/settings/data-model/properties/utils/getPropertyCreatedByLabel';
import {
  getSettingsFieldDataTypeDisplay,
  getSettingsFieldDataTypeText,
} from '@/settings/data-model/utils/getSettingsFieldDataTypeDisplay';
import { isUserFieldMetadataItem } from '@/settings/data-model/utils/isUserFieldMetadataItem';
import { Select } from '@/ui/input/components/Select';
import { DraggableItem } from '@/ui/layout/draggable-list/components/DraggableItem';
import { DraggableList } from '@/ui/layout/draggable-list/components/DraggableList';
import { Table } from '@/ui/layout/table/components/Table';
import { TableCell } from '@/ui/layout/table/components/TableCell';
import { TableHeader } from '@/ui/layout/table/components/TableHeader';
import { TableRow } from '@/ui/layout/table/components/TableRow';
import { UndecoratedLink } from '@/ui/navigation/link/components/UndecoratedLink/UndecoratedLink';
import { useSetAtomState } from '@/ui/utilities/state/jotai/hooks/useSetAtomState';

const GRID_TEMPLATE_COLUMNS = '24px minmax(160px, 2fr) 1fr 1fr 1fr 110px 36px';

const StyledToolbar = styled.div`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
  padding-bottom: ${themeCssVariables.spacing[2]};
`;

const StyledSearchContainer = styled.div`
  flex: 1;
  min-width: 200px;
`;

const StyledSecondaryText = styled.span`
  color: ${themeCssVariables.font.color.tertiary};
  min-width: 0;
`;

const StyledEmptyState = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  padding: ${themeCssVariables.spacing[4]} 0;
`;

type SettingsPropertiesTabProps = {
  objectMetadataItem: EnrichedObjectMetadataItem;
  groupFilter: string;
  onGroupFilterChange: (groupFilter: string) => void;
};

export const SettingsPropertiesTab = ({
  objectMetadataItem,
  groupFilter,
  onGroupFilterChange,
}: SettingsPropertiesTabProps) => {
  const { t, i18n } = useLingui();
  const navigate = useNavigate();
  const { propertySettings } = usePropertySettings();
  const { addToGroup, removeFromGroup, reorderGroupMembers } =
    useSettingsPropertyActions();
  const setPropertyCreationContext = useSetAtomState(
    propertyCreationContextState,
  );

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState(ALL_FILTER);
  const [createdByFilter, setCreatedByFilter] = useState(ALL_FILTER);

  const objectGroups = useMemo(
    () =>
      (propertySettings?.groups ?? [])
        .filter((group) => group.objectMetadataId === objectMetadataItem.id)
        .sort((left, right) => left.position - right.position),
    [propertySettings, objectMetadataItem.id],
  );

  const selectedGroup = objectGroups.find(({ id }) => id === groupFilter);

  const getTypeLabel = (fieldMetadataItem: FieldMetadataItem) =>
    isUserFieldMetadataItem(fieldMetadataItem)
      ? t`User`
      : getSettingsFieldDataTypeText(
          getSettingsFieldDataTypeDisplay(fieldMetadataItem, (descriptor) =>
            i18n._(descriptor),
          ),
        );

  const rows = buildPropertyTableRows({
    fieldMetadataItems: objectMetadataItem.fields.filter(
      (fieldMetadataItem) => !isHiddenSystemField(fieldMetadataItem),
    ),
    propertySettings,
    getTypeLabel,
  });

  const getCreatedByLabel = (row: PropertyTableRow) =>
    getPropertyCreatedByLabel(row.createdBy);

  const filteredRows = filterPropertyTableRows({
    rows,
    searchTerm,
    groupFilter: isDefined(selectedGroup) ? selectedGroup.id : groupFilter,
    typeFilter,
    createdByFilter,
    getCreatedByLabel,
  });

  const isOrderable =
    isDefined(selectedGroup) &&
    searchTerm.trim() === '' &&
    typeFilter === ALL_FILTER &&
    createdByFilter === ALL_FILTER;

  const typeOptions = [...new Set(rows.map(({ typeLabel }) => typeLabel))]
    .filter((typeLabel) => typeLabel !== '')
    .sort()
    .map((typeLabel) => ({ label: typeLabel, value: typeLabel }));

  const createdByOptions = [...new Set(rows.map(getCreatedByLabel))]
    .sort()
    .map((label) => ({ label, value: label }));

  const groupOptions = [
    { label: t`No group`, value: NO_PROPERTY_GROUP_FILTER },
    ...objectGroups.map(({ id, name }) => ({ label: name, value: id })),
  ];

  const addableRows = rows.filter(
    ({ propertyGroupId }) => propertyGroupId !== selectedGroup?.id,
  );

  const getFieldPath = (fieldMetadataItem: FieldMetadataItem) =>
    getSettingsPath(SettingsPath.ObjectFieldEdit, {
      objectNamePlural: objectMetadataItem.namePlural,
      fieldName: fieldMetadataItem.name,
    });

  const handleCreateProperty = () => {
    setPropertyCreationContext({
      objectMetadataId: objectMetadataItem.id,
      propertyGroupId: selectedGroup?.id ?? null,
    });
    navigate(
      getSettingsPath(SettingsPath.ObjectNewFieldSelect, {
        objectNamePlural: objectMetadataItem.namePlural,
      }),
    );
  };

  const handleDragEnd = (result: {
    source: { index: number };
    destination: { index: number } | null;
  }) => {
    if (!isOrderable || !isDefined(result.destination)) {
      return;
    }

    const members = filteredRows.flatMap(({ membershipId, positionInGroup }) =>
      isDefined(membershipId)
        ? [{ id: membershipId, position: positionInGroup }]
        : [],
    );

    reorderGroupMembers(
      computeReorderedPositions({
        items: members,
        fromIndex: result.source.index,
        toIndex: result.destination.index,
      }),
    );
  };

  const renderRow = (row: PropertyTableRow) => (
    <UndecoratedLink to={getFieldPath(row.fieldMetadataItem)}>
      <TableRow gridTemplateColumns={GRID_TEMPLATE_COLUMNS}>
        <TableCell padding="0">
          {isOrderable && <SettingsPipelineDragHandle />}
        </TableCell>
        <TableCell minWidth="0">
          <OverflowingTextWithTooltip text={row.fieldMetadataItem.label} />
        </TableCell>
        <TableCell minWidth="0">
          <StyledSecondaryText>
            <OverflowingTextWithTooltip text={row.groupName ?? t`No group`} />
          </StyledSecondaryText>
        </TableCell>
        <TableCell minWidth="0">
          <OverflowingTextWithTooltip text={row.typeLabel} />
        </TableCell>
        <TableCell minWidth="0">
          <OverflowingTextWithTooltip text={getCreatedByLabel(row)} />
        </TableCell>
        <TableCell>
          <StyledSecondaryText>
            {new Date(row.fieldMetadataItem.createdAt).toLocaleDateString()}
          </StyledSecondaryText>
        </TableCell>
        <TableCell align="right" padding="0">
          {isDefined(selectedGroup) && isDefined(row.membershipId) && (
            <LightIconButton
              aria-label={t`Remove from group`}
              emphasis="subtle"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();

                if (isDefined(row.membershipId)) {
                  removeFromGroup(row.membershipId);
                }
              }}
            >
              <IconX />
            </LightIconButton>
          )}
        </TableCell>
      </TableRow>
    </UndecoratedLink>
  );

  return (
    <Section.Root>
      <Section.Header
        title={
          isDefined(selectedGroup)
            ? t`Properties in ${selectedGroup.name}`
            : t`Properties`
        }
        description={t`Every property of this object, with its group and who created it.`}
      />
      <StyledToolbar>
        <StyledSearchContainer>
          <SearchInput
            placeholder={t`Search for a property...`}
            value={searchTerm}
            onValueChange={setSearchTerm}
          />
        </StyledSearchContainer>
        <Select
          dropdownId="settings-properties-group-filter"
          options={groupOptions}
          value={groupFilter}
          emptyOption={{ label: t`All groups`, value: ALL_FILTER }}
          withSearchInput
          onChange={onGroupFilterChange}
        />
        <Select
          dropdownId="settings-properties-type-filter"
          options={typeOptions}
          value={typeFilter}
          emptyOption={{ label: t`All field types`, value: ALL_FILTER }}
          withSearchInput
          onChange={setTypeFilter}
        />
        <Select
          dropdownId="settings-properties-created-by-filter"
          options={createdByOptions}
          value={createdByFilter}
          emptyOption={{ label: t`All users`, value: ALL_FILTER }}
          withSearchInput
          onChange={setCreatedByFilter}
        />
        {isDefined(selectedGroup) && (
          <Select
            dropdownId="settings-properties-add-to-group"
            options={addableRows.map(({ fieldMetadataItem }) => ({
              label: fieldMetadataItem.label,
              value: fieldMetadataItem.id,
            }))}
            value=""
            emptyOption={{ label: t`Add properties`, value: '' }}
            withSearchInput
            onChange={(fieldMetadataId) => {
              if (fieldMetadataId !== '') {
                addToGroup({
                  propertyGroupId: selectedGroup.id,
                  objectMetadataId: objectMetadataItem.id,
                  fieldMetadataIds: [fieldMetadataId],
                });
              }
            }}
          />
        )}
        <Button
          variant="solid"
          color="accent"
          size="sm"
          startIcon={<IconPlus />}
          onClick={handleCreateProperty}
        >
          {t`Create property`}
        </Button>
      </StyledToolbar>
      <Table>
        <TableRow gridTemplateColumns={GRID_TEMPLATE_COLUMNS}>
          <TableHeader />
          <TableHeader>{t`Name`}</TableHeader>
          <TableHeader>{t`Group`}</TableHeader>
          <TableHeader>{t`Field type`}</TableHeader>
          <TableHeader>{t`Created by`}</TableHeader>
          <TableHeader>{t`Created date`}</TableHeader>
          <TableHeader />
        </TableRow>
        {filteredRows.length === 0 ? (
          <StyledEmptyState>{t`No property matches these filters`}</StyledEmptyState>
        ) : isOrderable ? (
          <DraggableList
            onDragEnd={handleDragEnd}
            draggableItems={
              <>
                {filteredRows.map((row, index) => (
                  <DraggableItem
                    key={row.fieldMetadataItem.id}
                    draggableId={row.fieldMetadataItem.id}
                    index={index}
                    itemComponent={renderRow(row)}
                  />
                ))}
              </>
            }
          />
        ) : (
          filteredRows.map((row) => (
            <div key={row.fieldMetadataItem.id}>{renderRow(row)}</div>
          ))
        )}
      </Table>
    </Section.Root>
  );
};
