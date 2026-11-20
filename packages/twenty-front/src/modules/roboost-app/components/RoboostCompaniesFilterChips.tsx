import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import {
  type RoboostCompanyListFilters,
  type RoboostDateRange,
} from '@/roboost-app/types/RoboostCompanyListFilters';
import {
  getRoboostPersonName,
  type RoboostFullName,
} from '@/roboost-app/utils/getRoboostPersonName';
import { FilterChip } from '@/roboost-ui/components/FilterChip';
import { Icon } from '@/roboost-ui/components/Icon';
import { Menu, type MenuEntry } from '@/roboost-ui/components/Menu';
import { ROBOOST_UI_THEME } from '@/roboost-ui/constants/RoboostUiTheme';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { Link } from 'react-router-dom';
import { CoreObjectNameSingular } from 'twenty-shared/types';
import { FieldMetadataType } from '~/generated-metadata/graphql';

const StyledRow = styled.div`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const StyledSpacer = styled.div`
  flex: 1;
`;

const StyledSquareChip = styled.button`
  align-items: center;
  background: ${ROBOOST_UI_THEME.surface};
  border: 1px solid ${ROBOOST_UI_THEME.borderStrong};
  border-radius: ${ROBOOST_UI_THEME.radiusSm};
  color: ${ROBOOST_UI_THEME.textMuted};
  cursor: pointer;
  display: inline-flex;
  height: 30px;
  justify-content: center;
  padding: 0;
  width: 30px;

  &:hover {
    background: ${ROBOOST_UI_THEME.surfaceHover};
    color: ${ROBOOST_UI_THEME.text};
  }
`;

const StyledAdvancedLink = styled(Link)`
  align-items: center;
  border-radius: ${ROBOOST_UI_THEME.radiusSm};
  color: ${ROBOOST_UI_THEME.accentText};
  display: inline-flex;
  font-family: ${ROBOOST_UI_THEME.fontSans};
  font-size: 13px;
  font-weight: 500;
  gap: 6px;
  height: 30px;
  padding: 0 10px;
  text-decoration: none;

  &:hover {
    background: ${ROBOOST_UI_THEME.surfaceHover};
  }
`;

const StyledClear = styled.button`
  background: none;
  border: none;
  color: ${ROBOOST_UI_THEME.accentText};
  cursor: pointer;
  font-family: ${ROBOOST_UI_THEME.fontSans};
  font-size: 13px;
  font-weight: 500;
`;

type MemberRecord = { id: string; name?: RoboostFullName };

type RoboostCompaniesFilterChipsProps = {
  filters: RoboostCompanyListFilters;
  onFiltersChange: (filters: RoboostCompanyListFilters) => void;
  fieldsByName: Map<string, FieldMetadataItem>;
  advancedFiltersPath: string;
  hasActiveFilters: boolean;
};

export const RoboostCompaniesFilterChips = ({
  filters,
  onFiltersChange,
  fieldsByName,
  advancedFiltersPath,
  hasActiveFilters,
}: RoboostCompaniesFilterChipsProps) => {
  const { t } = useLingui();

  const { records: members } = useFindManyRecords<
    MemberRecord & { __typename: string }
  >({
    objectNameSingular: CoreObjectNameSingular.WorkspaceMember,
    recordGqlFields: { id: true, name: true },
    limit: 200,
  });

  const dateRangeLabels: Record<RoboostDateRange, string> = {
    any: t`Any time`,
    last7: t`Last 7 days`,
    last30: t`Last 30 days`,
    last90: t`Last 90 days`,
    last365: t`Last 12 months`,
  };

  const dateRangeEntries = (
    selected: RoboostDateRange,
    apply: (range: RoboostDateRange) => void,
  ): MenuEntry[] =>
    (Object.keys(dateRangeLabels) as RoboostDateRange[]).map((range) => ({
      id: range,
      label: dateRangeLabels[range],
      isSelected: range === selected,
      onSelect: () => apply(range),
    }));

  const ownerLabel =
    filters.ownerId === 'any'
      ? t`Any`
      : filters.ownerId === 'me'
        ? t`Me`
        : filters.ownerId === 'none'
          ? t`No owner`
          : getRoboostPersonName(
              members.find((member) => member.id === filters.ownerId)?.name,
            );

  const toggleSelectValue = (fieldName: string, value: string) => {
    const current = filters.selectValuesByFieldName[fieldName] ?? [];

    onFiltersChange({
      ...filters,
      selectValuesByFieldName: {
        ...filters.selectValuesByFieldName,
        [fieldName]: current.includes(value)
          ? current.filter((selected) => selected !== value)
          : [...current, value],
      },
    });
  };

  const renderSelectChip = (fieldName: string) => {
    const fieldMetadataItem = fieldsByName.get(fieldName);

    if (fieldMetadataItem === undefined) {
      return null;
    }

    const selected = filters.selectValuesByFieldName[fieldName] ?? [];
    const options = [...(fieldMetadataItem.options ?? [])].sort(
      (first, second) => first.position - second.position,
    );
    const value =
      selected.length === 0
        ? t`Any`
        : selected.length === 1
          ? (options.find((option) => option.value === selected[0])?.label ??
            selected[0])
          : t`${selected.length} selected`;

    return (
      <FilterChip
        key={fieldName}
        label={
          fieldName === 'leadStatus' ? t`Lead status` : fieldMetadataItem.label
        }
        value={value}
        isActive={selected.length > 0}
        keepOpenOnSelect
        entries={options.map((option) => ({
          id: option.value,
          label: option.label,
          isSelected: selected.includes(option.value),
          onSelect: () => toggleSelectValue(fieldName, option.value),
        }))}
      />
    );
  };

  const addableSelectFields = [...fieldsByName.values()].filter(
    (field) =>
      field.type === FieldMetadataType.SELECT &&
      field.name !== 'leadStatus' &&
      !filters.extraSelectFieldNames.includes(field.name),
  );

  return (
    <StyledRow>
      {fieldsByName.has('accountOwner') && (
        <FilterChip
          label={t`Company owner`}
          value={ownerLabel}
          isActive={filters.ownerId !== 'any'}
          entries={[
            { id: 'any', label: t`Anyone` },
            { id: 'me', label: t`Me` },
            { id: 'none', label: t`No owner` },
            ...members.map((member) => ({
              id: member.id,
              label: getRoboostPersonName(member.name),
            })),
          ].map((option) => ({
            ...option,
            isSelected: filters.ownerId === option.id,
            onSelect: () => onFiltersChange({ ...filters, ownerId: option.id }),
          }))}
        />
      )}
      <FilterChip
        label={t`Create date`}
        value={
          filters.createdWithin === 'any'
            ? undefined
            : dateRangeLabels[filters.createdWithin]
        }
        isActive={filters.createdWithin !== 'any'}
        entries={dateRangeEntries(filters.createdWithin, (range) =>
          onFiltersChange({ ...filters, createdWithin: range }),
        )}
      />
      {fieldsByName.has('lastActivityDate') && (
        <FilterChip
          label={t`Last activity date`}
          value={
            filters.lastActivityWithin === 'any'
              ? undefined
              : dateRangeLabels[filters.lastActivityWithin]
          }
          isActive={filters.lastActivityWithin !== 'any'}
          entries={dateRangeEntries(filters.lastActivityWithin, (range) =>
            onFiltersChange({ ...filters, lastActivityWithin: range }),
          )}
        />
      )}
      {renderSelectChip('leadStatus')}
      {filters.extraSelectFieldNames.map(renderSelectChip)}
      <Menu
        entries={addableSelectFields.map((field) => ({
          id: field.name,
          label: field.label,
          onSelect: () =>
            onFiltersChange({
              ...filters,
              extraSelectFieldNames: [
                ...filters.extraSelectFieldNames,
                field.name,
              ],
            }),
        }))}
        trigger={({ toggle, isOpen }) => (
          <StyledSquareChip
            type="button"
            aria-label={t`Add filter`}
            aria-expanded={isOpen}
            onClick={toggle}
          >
            <Icon name="plus" size={16} />
          </StyledSquareChip>
        )}
      />
      {hasActiveFilters && (
        <StyledClear
          type="button"
          onClick={() =>
            onFiltersChange({
              ownerId: 'any',
              createdWithin: 'any',
              lastActivityWithin: 'any',
              selectValuesByFieldName: {},
              extraSelectFieldNames: filters.extraSelectFieldNames,
            })
          }
        >
          {t`Clear all`}
        </StyledClear>
      )}
      <StyledSpacer />
      <StyledAdvancedLink to={advancedFiltersPath}>
        <Icon name="sliders" size={14} />
        {t`Advanced filters`}
      </StyledAdvancedLink>
    </StyledRow>
  );
};
