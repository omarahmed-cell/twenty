import { useQuery } from '@apollo/client/react';
import { ROBOOST_TEAMS } from '@/roboost-app/users-and-teams/graphql/roboostUsersQueries';
import { type RoboostTeam } from '@/roboost-app/users-and-teams/types/RoboostUsers';
import {
  getRoboostTeamIdFromFilterValue,
  toRoboostTeamFilterValue,
} from '@/roboost-app/users-and-teams/utils/roboostTeamFilterValue';
import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { type RoboostListSort } from '@/roboost-app/list/components/RoboostListTable';
import { RoboostSortPopover } from '@/roboost-app/list/components/RoboostSortPopover';
import {
  type RoboostDateRange,
  type RoboostListFilters,
} from '@/roboost-app/list/types/RoboostListFilters';
import {
  getRoboostPersonName,
  type RoboostFullName,
} from '@/roboost-app/utils/getRoboostPersonName';
import { FilterChip } from '@/roboost-ui/components/FilterChip';
import { Icon } from '@/roboost-ui/components/Icon';
import { Input } from '@/roboost-ui/components/Input';
import { Menu, type MenuEntry } from '@/roboost-ui/components/Menu';
import { cx } from '@/roboost-ui/utils/cx';
import { useLingui } from '@lingui/react/macro';
import { type ReactNode } from 'react';
import { CoreObjectNameSingular } from 'twenty-shared/types';
import { isDefined, ROBOOST_FILTER_BLANK_VALUE } from 'twenty-shared/utils';
import { FieldMetadataType } from '~/generated-metadata/graphql';

type MemberRecord = { id: string; name?: RoboostFullName; __typename: string };

type RoboostListToolbarProps = {
  objectMetadataItem: EnrichedObjectMetadataItem;
  search: string;
  onSearchChange: (search: string) => void;
  filters: RoboostListFilters;
  onFiltersChange: (filters: RoboostListFilters) => void;
  ownerField: FieldMetadataItem | undefined;
  statusField: FieldMetadataItem | undefined;
  sort: RoboostListSort | null;
  onSortChange: (sort: RoboostListSort | null) => void;
  onOpenAdvanced: () => void;
  onOpenColumns: () => void;
  displayToggle?: ReactNode;
  isFilterRowOpen: boolean;
  onToggleFilterRow: () => void;
};

// Record dates are system fields but are what people sort by most (HubSpot's Create date)
const SORTABLE_SYSTEM_FIELD_NAMES = new Set(['createdAt', 'updatedAt']);

const SORTABLE_TYPES = new Set<string>([
  FieldMetadataType.TEXT,
  FieldMetadataType.NUMBER,
  FieldMetadataType.NUMERIC,
  FieldMetadataType.DATE,
  FieldMetadataType.DATE_TIME,
  FieldMetadataType.SELECT,
  FieldMetadataType.BOOLEAN,
  FieldMetadataType.CURRENCY,
  FieldMetadataType.FULL_NAME,
  FieldMetadataType.LINKS,
  FieldMetadataType.EMAILS,
]);

export const RoboostListToolbar = ({
  objectMetadataItem,
  search,
  onSearchChange,
  filters,
  onFiltersChange,
  ownerField,
  statusField,
  sort,
  onSortChange,
  onOpenAdvanced,
  onOpenColumns,
  displayToggle,
  isFilterRowOpen,
  onToggleFilterRow,
}: RoboostListToolbarProps) => {
  const { t } = useLingui();
  const fieldsByName = new Map(
    objectMetadataItem.fields
      .filter((field) => field.isActive)
      .map((field) => [field.name, field]),
  );

  const { records: members } = useFindManyRecords<MemberRecord>({
    objectNameSingular: CoreObjectNameSingular.WorkspaceMember,
    recordGqlFields: { id: true, name: true },
    limit: 200,
    skip: !isDefined(ownerField),
  });
  const { data: teamsData } = useQuery<{ roboostTeams: RoboostTeam[] }>(
    ROBOOST_TEAMS,
    { fetchPolicy: 'cache-first', skip: !isDefined(ownerField) },
  );
  const teams = teamsData?.roboostTeams ?? [];

  const dateRangeLabels: Record<RoboostDateRange, string> = {
    any: t`Any time`,
    today: t`Today`,
    last7: t`Last 7 days`,
    last30: t`Last 30 days`,
    thisQuarter: t`This quarter`,
    last90: t`Last 90 days`,
    last365: t`Last 12 months`,
  };

  const dateEntries = (
    selected: RoboostDateRange,
    apply: (range: RoboostDateRange) => void,
  ): MenuEntry[] =>
    (Object.keys(dateRangeLabels) as RoboostDateRange[]).map((range) => ({
      id: range,
      label: dateRangeLabels[range],
      isSelected: range === selected,
      onSelect: () => apply(range),
    }));

  const toggleSelectValue = (fieldName: string, value: string) => {
    const current = filters.selectValuesByFieldName[fieldName] ?? [];

    onFiltersChange({
      ...filters,
      selectValuesByFieldName: {
        ...filters.selectValuesByFieldName,
        [fieldName]: current.includes(value)
          ? current.filter((item) => item !== value)
          : [...current, value],
      },
    });
  };

  const renderSelectChip = (field: FieldMetadataItem) => {
    const selected = filters.selectValuesByFieldName[field.name] ?? [];
    const options = [...(field.options ?? [])].sort(
      (first, second) => first.position - second.position,
    );

    return (
      <FilterChip
        key={field.name}
        label={field.label}
        value={
          selected.length === 0
            ? undefined
            : selected.length === 1
              ? selected[0] === ROBOOST_FILTER_BLANK_VALUE
                ? t`Blank`
                : (options.find((option) => option.value === selected[0])
                    ?.label ?? selected[0])
              : t`${selected.length} selected`
        }
        isActive={selected.length > 0}
        keepOpenOnSelect
        entries={[
          { value: ROBOOST_FILTER_BLANK_VALUE, label: t`Blank` },
          ...options,
        ].map((option) => ({
          id: option.value,
          label: option.label,
          isSelected: selected.includes(option.value),
          onSelect: () => toggleSelectValue(field.name, option.value),
        }))}
      />
    );
  };

  const ownerLabel =
    filters.ownerId === 'any'
      ? undefined
      : filters.ownerId === 'me'
        ? t`Me`
        : filters.ownerId === 'none'
          ? t`No owner`
          : isDefined(getRoboostTeamIdFromFilterValue(filters.ownerId))
            ? t`Team: ${
                teams.find(
                  (team) =>
                    team.id ===
                    getRoboostTeamIdFromFilterValue(filters.ownerId),
                )?.name ?? ''
              }`
            : getRoboostPersonName(
                members.find((member) => member.id === filters.ownerId)?.name,
              );

  const addableFields = [...fieldsByName.values()].filter(
    (field) =>
      field.type === FieldMetadataType.SELECT &&
      field.isSystem !== true &&
      field.name !== statusField?.name &&
      !filters.extraSelectFieldNames.includes(field.name),
  );

  const sortableFields = [...fieldsByName.values()]
    .filter(
      (field) =>
        SORTABLE_TYPES.has(field.type) &&
        (field.isSystem !== true ||
          SORTABLE_SYSTEM_FIELD_NAMES.has(field.name)),
    )
    .sort((first, second) => first.label.localeCompare(second.label));

  const hasChipFilters =
    filters.ownerId !== 'any' ||
    filters.createdWithin !== 'any' ||
    filters.lastActivityWithin !== 'any' ||
    Object.values(filters.selectValuesByFieldName).some(
      (values) => values.length > 0,
    );
  const advancedCount =
    filters.advanced.groups.reduce(
      (count, group) => count + group.rules.length,
      0,
    ) +
    filters.advanced.associations.filter((association) =>
      isDefined(association.resolvedFilter),
    ).length;
  const chipCount =
    (filters.ownerId !== 'any' ? 1 : 0) +
    (filters.createdWithin !== 'any' ? 1 : 0) +
    (filters.lastActivityWithin !== 'any' ? 1 : 0) +
    Object.values(filters.selectValuesByFieldName).filter(
      (values) => values.length > 0,
    ).length;
  const activeFilterCount = chipCount + advancedCount;

  return (
    <div className="rb-ls-toolbar">
      <div className="rb-ls-tools">
        <div className="rb-tsearch">
          <Input
            variant="search"
            size="sm"
            value={search}
            placeholder={
              fieldsByName.has('domainName')
                ? t`Search name, phone, or domain`
                : t`Search ${objectMetadataItem.labelPlural.toLowerCase()}`
            }
            aria-label={t`Search`}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </div>
        <button
          type="button"
          className={cx(
            'rb-chip',
            (isFilterRowOpen || activeFilterCount > 0) && 'is-on',
          )}
          aria-expanded={isFilterRowOpen}
          onClick={onToggleFilterRow}
        >
          <Icon name="filter" size={14} />
          {activeFilterCount > 0 ? t`Filter (${activeFilterCount})` : t`Filter`}
        </button>
        <RoboostSortPopover
          sortableFields={sortableFields}
          sort={sort}
          onSortChange={onSortChange}
        />
        <span className="rb-sp" />
        {displayToggle}
        <button
          type="button"
          className="rb-icon-btn"
          aria-label={t`Edit columns`}
          title={t`Edit columns`}
          onClick={onOpenColumns}
        >
          <Icon name="columns" size={16} />
        </button>
      </div>
      {isFilterRowOpen && (
        <div className="rb-ls-tools rb-ls-filters">
          {isDefined(ownerField) && (
            <FilterChip
              label={ownerField.label}
              value={ownerLabel}
              isActive={filters.ownerId !== 'any'}
              entries={[
                ...teams.map((team) => ({
                  id: toRoboostTeamFilterValue(team.id),
                  label: t`Team: ${team.name}`,
                })),
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
                onSelect: () =>
                  onFiltersChange({ ...filters, ownerId: option.id }),
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
            entries={dateEntries(filters.createdWithin, (range) =>
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
              entries={dateEntries(filters.lastActivityWithin, (range) =>
                onFiltersChange({ ...filters, lastActivityWithin: range }),
              )}
            />
          )}
          {isDefined(statusField) && renderSelectChip(statusField)}
          {filters.extraSelectFieldNames
            .map((fieldName) => fieldsByName.get(fieldName))
            .filter(isDefined)
            .map(renderSelectChip)}
          <Menu
            entries={addableFields.map((field) => ({
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
              <button
                type="button"
                className="rb-chip rb-chip-square"
                aria-label={t`Add filter`}
                aria-expanded={isOpen}
                onClick={toggle}
              >
                <Icon name="plus" size={14} strokeWidth={2} />
              </button>
            )}
          />
          {hasChipFilters && (
            <button
              type="button"
              className="rb-link rb-clearall"
              onClick={() =>
                onFiltersChange({
                  ...filters,
                  ownerId: 'any',
                  createdWithin: 'any',
                  lastActivityWithin: 'any',
                  selectValuesByFieldName: {},
                })
              }
            >
              {t`Clear all`}
            </button>
          )}
          <button
            type="button"
            className={cx('rb-link rb-advlink', advancedCount > 0 && 'is-on')}
            onClick={onOpenAdvanced}
          >
            <Icon name="sliders" size={14} />
            {advancedCount > 0
              ? t`Advanced filters (${advancedCount})`
              : t`Advanced filters`}
          </button>
        </div>
      )}
    </div>
  );
};
