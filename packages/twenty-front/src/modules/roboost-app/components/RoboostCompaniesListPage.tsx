import { currentWorkspaceMemberState } from '@/auth/states/currentWorkspaceMemberState';
import { useApolloCoreClient } from '@/object-metadata/hooks/useApolloCoreClient';
import { useObjectMetadataItem } from '@/object-metadata/hooks/useObjectMetadataItem';
import { getRecordsFromRecordConnection } from '@/object-record/cache/utils/getRecordsFromRecordConnection';
import { type RecordGqlOperationFindManyResult } from '@/object-record/graphql/types/RecordGqlOperationFindManyResult';
import { useCreateOneRecord } from '@/object-record/hooks/useCreateOneRecord';
import { useFindManyRecordsQuery } from '@/object-record/hooks/useFindManyRecordsQuery';
import { RoboostCompaniesFilterChips } from '@/roboost-app/components/RoboostCompaniesFilterChips';
import { ROBOOST_COMPANY_COLUMNS } from '@/roboost-app/constants/RoboostCompanyColumns';
import { useRoboostPagedRecords } from '@/roboost-app/hooks/useRoboostPagedRecords';
import { useRoboostViewQueryVariables } from '@/roboost-app/hooks/useRoboostViewQueryVariables';
import { roboostCompanyVisibleColumnsState } from '@/roboost-app/states/roboostCompanyVisibleColumnsState';
import {
  EMPTY_ROBOOST_COMPANY_LIST_FILTERS,
  type RoboostCompanyListFilters,
} from '@/roboost-app/types/RoboostCompanyListFilters';
import { buildRoboostCompanyFilter } from '@/roboost-app/utils/buildRoboostCompanyFilter';
import { buildRoboostCompanyRow } from '@/roboost-app/utils/buildRoboostCompanyRow';
import { exportRoboostTableToCsv } from '@/roboost-app/utils/exportRoboostTableToCsv';
import { getRoboostCompanyRecordGqlFields } from '@/roboost-app/utils/getRoboostCompanyRecordGqlFields';
import { Button } from '@/roboost-ui/components/Button';
import {
  type Column,
  DataTable,
  type DataTableRow,
  type DataTableSort,
} from '@/roboost-ui/components/DataTable';
import { Icon } from '@/roboost-ui/components/Icon';
import { Input } from '@/roboost-ui/components/Input';
import { Menu } from '@/roboost-ui/components/Menu';
import { Tabs } from '@/roboost-ui/components/Tabs';
import { ROBOOST_UI_THEME } from '@/roboost-ui/constants/RoboostUiTheme';
import { useAtomFamilySelectorValue } from '@/ui/utilities/state/jotai/hooks/useAtomFamilySelectorValue';
import { useAtomState } from '@/ui/utilities/state/jotai/hooks/useAtomState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { viewsFromObjectMetadataItemFamilySelector } from '@/views/states/selectors/viewsFromObjectMetadataItemFamilySelector';
import { ViewKey } from '@/views/types/ViewKey';
import { resolveViewNamePlaceholders } from '@/views/utils/resolveViewNamePlaceholders';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useNavigateApp } from '~/hooks/useNavigateApp';
import { AppPath, CoreObjectNameSingular } from 'twenty-shared/types';
import { getAppPath, isDefined } from 'twenty-shared/utils';
import { useDebouncedCallback } from 'use-debounce';

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
const EXPORT_LIMIT = 2000;

const StyledPage = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  padding: 20px 24px 28px;
`;

const StyledHeader = styled.div`
  align-items: flex-start;
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
`;

const StyledHeading = styled.div`
  flex: 1;
  min-width: 0;
`;

const StyledTitle = styled.h1`
  color: ${ROBOOST_UI_THEME.text};
  font-family: ${ROBOOST_UI_THEME.fontDisplay};
  font-size: 22px;
  font-weight: 600;
  letter-spacing: -0.01em;
  line-height: 28px;
  margin: 0;
`;

const StyledSubtitle = styled.p`
  color: ${ROBOOST_UI_THEME.textMuted};
  font-size: 13px;
  line-height: 18px;
  margin: 4px 0 0;
`;

const StyledSubtitleView = styled.span`
  color: ${ROBOOST_UI_THEME.textSecondary};
`;

const StyledHeaderActions = styled.div`
  align-items: center;
  display: flex;
  flex: none;
  gap: 8px;
`;

const StyledToolbarCard = styled.div`
  background: ${ROBOOST_UI_THEME.surface};
  border: 1px solid ${ROBOOST_UI_THEME.border};
  border-radius: ${ROBOOST_UI_THEME.radiusMd};
  box-shadow: ${ROBOOST_UI_THEME.shadowXs};
  margin-bottom: 12px;
`;

const StyledTabsRow = styled.div`
  padding: 0 12px;
`;

const StyledToolbar = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px 16px;
`;

const StyledToolbarRow = styled.div`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
`;

const StyledSearch = styled.div`
  width: 260px;
`;

const StyledSpacer = styled.div`
  flex: 1;
`;

const StyledColumnsButton = styled.button`
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

const StyledTableArea = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
`;

const StyledError = styled.div`
  color: ${ROBOOST_UI_THEME.dangerText};
  font-size: 13px;
  padding: 8px 0;
`;

const SORT_DIRECTION_TO_ORDER: Record<'asc' | 'desc', string> = {
  asc: 'AscNullsLast',
  desc: 'DescNullsLast',
};

export const RoboostCompaniesListPage = () => {
  const { t, i18n } = useLingui();
  const navigateApp = useNavigateApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const apolloCoreClient = useApolloCoreClient();
  const currentWorkspaceMember = useAtomStateValue(currentWorkspaceMemberState);

  const { objectMetadataItem } = useObjectMetadataItem({
    objectNameSingular: CoreObjectNameSingular.Company,
  });
  const views = useAtomFamilySelectorValue(
    viewsFromObjectMetadataItemFamilySelector,
    { objectMetadataItemId: objectMetadataItem.id },
  );

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filters, setFilters] = useState<RoboostCompanyListFilters>(
    EMPTY_ROBOOST_COMPANY_LIST_FILTERS,
  );
  const [sort, setSort] = useState<DataTableSort | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isFilterRowShown, setIsFilterRowShown] = useState(true);
  const [roboostCompanyVisibleColumns, setRoboostCompanyVisibleColumns] =
    useAtomState(roboostCompanyVisibleColumnsState);

  const updateDebouncedSearch = useDebouncedCallback((value: string) => {
    setDebouncedSearch(value);
    setPage(1);
  }, 300);

  const fieldsByName = new Map(
    objectMetadataItem.fields
      .filter((field) => field.isActive)
      .map((field) => [field.name, field]),
  );
  const availableFieldNames = new Set(fieldsByName.keys());

  const availableColumns = ROBOOST_COMPANY_COLUMNS.filter((column) =>
    availableFieldNames.has(column.fieldName),
  );
  const visibleColumns = availableColumns.filter(
    (column) =>
      column.kind === 'name' ||
      roboostCompanyVisibleColumns.includes(column.fieldName),
  );

  const defaultView =
    views.find((view) => view.key === ViewKey.INDEX) ?? views[0];
  const activeView =
    views.find((view) => view.id === searchParams.get('viewId')) ?? defaultView;

  const { filter: viewFilter, orderBy: viewOrderBy } =
    useRoboostViewQueryVariables({ view: activeView, objectMetadataItem });

  const filter = buildRoboostCompanyFilter({
    viewFilter,
    search: debouncedSearch,
    filters,
    currentWorkspaceMemberId: currentWorkspaceMember?.id,
    availableFieldNames,
    now: new Date(),
  });

  const orderBy = isDefined(sort)
    ? [{ [sort.key]: SORT_DIRECTION_TO_ORDER[sort.dir] }]
    : viewOrderBy.length > 0
      ? viewOrderBy
      : [{ name: 'AscNullsLast' }];

  const recordGqlFields = getRoboostCompanyRecordGqlFields(availableColumns);

  const { records, totalCount, loading, error, hasLoaded } =
    useRoboostPagedRecords({
      objectNameSingular: CoreObjectNameSingular.Company,
      filter,
      orderBy: orderBy as never,
      recordGqlFields,
      page,
      pageSize,
    });

  const { findManyRecordsQuery } = useFindManyRecordsQuery({
    objectNameSingular: CoreObjectNameSingular.Company,
    recordGqlFields,
  });

  const { createOneRecord: createCompany } = useCreateOneRecord({
    objectNameSingular: CoreObjectNameSingular.Company,
  });

  const getColumnLabel = (fieldName: string) => {
    const column = availableColumns.find(
      (candidate) => candidate.fieldName === fieldName,
    );

    return isDefined(column?.label)
      ? i18n._(column.label)
      : (fieldsByName.get(fieldName)?.label ?? fieldName);
  };

  const tableColumns: Column[] = visibleColumns.map((column) => ({
    key: column.fieldName,
    label: getColumnLabel(column.fieldName),
    type:
      column.kind === 'name' || column.kind === 'member'
        ? 'avatar'
        : column.kind === 'select' && column.fieldName === 'leadStatus'
          ? 'tag'
          : column.kind === 'mono'
            ? 'mono'
            : column.kind === 'number'
              ? 'num'
              : 'text',
    align: column.kind === 'number' ? 'right' : undefined,
    sortable: column.sortable,
  }));

  const rows: DataTableRow[] = records.map((record) =>
    buildRoboostCompanyRow(record, visibleColumns, fieldsByName),
  );

  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize));
  const from = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalCount);

  const activeViewName = resolveViewNamePlaceholders(
    activeView?.name,
    objectMetadataItem,
  );

  const hasActiveFilters =
    filters.ownerId !== 'any' ||
    filters.createdWithin !== 'any' ||
    filters.lastActivityWithin !== 'any' ||
    Object.values(filters.selectValuesByFieldName).some(
      (values) => values.length > 0,
    );

  const changeFilters = (nextFilters: RoboostCompanyListFilters) => {
    setFilters(nextFilters);
    setPage(1);
    setSelectedIds([]);
  };

  const changeView = (viewId: string) => {
    const nextSearchParams = new URLSearchParams(searchParams);

    nextSearchParams.set('viewId', viewId);
    setSearchParams(nextSearchParams);
    setSort(null);
    setPage(1);
    setSelectedIds([]);
  };

  const openCompany = (companyId: string) =>
    navigateApp(AppPath.RecordShowPage, {
      objectNameSingular: CoreObjectNameSingular.Company,
      objectRecordId: companyId,
    });

  const addCompany = async () => {
    const company = await createCompany({});

    openCompany(company.id);
  };

  const classicPath = `${getAppPath(AppPath.RecordIndexPage, {
    objectNamePlural: objectMetadataItem.namePlural,
  })}?view=classic${isDefined(activeView) ? `&viewId=${activeView.id}` : ''}`;

  const exportCompanies = async () => {
    const { data } =
      await apolloCoreClient.query<RecordGqlOperationFindManyResult>({
        query: findManyRecordsQuery,
        variables: { filter, orderBy, limit: EXPORT_LIMIT },
        fetchPolicy: 'network-only',
      });
    const connection = data?.[objectMetadataItem.namePlural];

    if (!isDefined(connection)) {
      return;
    }

    const exportRecords = getRecordsFromRecordConnection({
      recordConnection: connection,
    }).filter(
      (record) => selectedIds.length === 0 || selectedIds.includes(record.id),
    );

    exportRoboostTableToCsv({
      headers: visibleColumns.map((column) => getColumnLabel(column.fieldName)),
      rows: exportRecords.map((record) => {
        const row = buildRoboostCompanyRow(
          record,
          visibleColumns,
          fieldsByName,
        );

        return visibleColumns.map((column) => {
          const value = row[column.fieldName];

          if (typeof value === 'object' && value !== null) {
            return String(
              'name' in value
                ? value.name
                : 'label' in value
                  ? value.label
                  : '',
            );
          }

          return String(value ?? '');
        });
      }),
      fileName: `${activeViewName || t`Companies`}.csv`,
    });
  };

  return (
    <StyledPage>
      <StyledHeader>
        <StyledHeading>
          <StyledTitle>{objectMetadataItem.labelPlural}</StyledTitle>
          <StyledSubtitle>
            {hasLoaded
              ? t`${totalCount.toLocaleString('en-US')} records`
              : t`Loading records`}{' '}
            &middot; {t`showing`}{' '}
            <StyledSubtitleView>{activeViewName}</StyledSubtitleView>
          </StyledSubtitle>
        </StyledHeading>
        <StyledHeaderActions>
          <Menu
            align="right"
            entries={[
              {
                id: 'classic',
                label: t`Open classic table`,
                icon: 'columns',
                href: classicPath,
              },
            ]}
            trigger={({ toggle, isOpen }) => (
              <Button
                variant="ghost"
                iconOnly
                icon="more"
                aria-label={t`More actions`}
                aria-expanded={isOpen}
                onClick={toggle}
              />
            )}
          />
          <Button variant="secondary" icon="export" onClick={exportCompanies}>
            {t`Export`}
          </Button>
          <Button variant="primary" icon="plus" onClick={addCompany}>
            {t`Add companies`}
          </Button>
        </StyledHeaderActions>
      </StyledHeader>

      <StyledToolbarCard>
        <StyledTabsRow>
          <Tabs
            tabs={views.map((view) => ({
              id: view.id,
              label: resolveViewNamePlaceholders(view.name, objectMetadataItem),
              count:
                view.id === activeView?.id && hasLoaded
                  ? totalCount
                  : undefined,
            }))}
            value={activeView?.id}
            onChange={changeView}
          />
        </StyledTabsRow>
        <StyledToolbar>
          <StyledToolbarRow>
            <StyledSearch>
              <Input
                icon="search"
                placeholder={t`Search companies`}
                aria-label={t`Search companies`}
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  updateDebouncedSearch(event.target.value);
                }}
              />
            </StyledSearch>
            <Button
              variant="secondary"
              icon="filter"
              aria-expanded={isFilterRowShown}
              onClick={() => setIsFilterRowShown(!isFilterRowShown)}
            >
              {t`Filters`}
            </Button>
            <Menu
              entries={availableColumns
                .filter((column) => column.sortable)
                .flatMap((column) => [
                  {
                    id: `${column.fieldName}-asc`,
                    label: `${getColumnLabel(column.fieldName)} ↑`,
                    isSelected:
                      sort?.key === column.fieldName && sort.dir === 'asc',
                    onSelect: () => {
                      setSort({ key: column.fieldName, dir: 'asc' });
                      setPage(1);
                    },
                  },
                  {
                    id: `${column.fieldName}-desc`,
                    label: `${getColumnLabel(column.fieldName)} ↓`,
                    isSelected:
                      sort?.key === column.fieldName && sort.dir === 'desc',
                    onSelect: () => {
                      setSort({ key: column.fieldName, dir: 'desc' });
                      setPage(1);
                    },
                  },
                ])}
              trigger={({ toggle, isOpen }) => (
                <Button
                  variant="ghost"
                  icon="sort-lines"
                  aria-expanded={isOpen}
                  onClick={toggle}
                >
                  {t`Sort`}
                </Button>
              )}
            />
            <StyledSpacer />
            <Menu
              align="right"
              keepOpenOnSelect
              entries={availableColumns
                .filter((column) => column.kind !== 'name')
                .map((column) => ({
                  id: column.fieldName,
                  label: getColumnLabel(column.fieldName),
                  isSelected: roboostCompanyVisibleColumns.includes(
                    column.fieldName,
                  ),
                  onSelect: () =>
                    setRoboostCompanyVisibleColumns(
                      roboostCompanyVisibleColumns.includes(column.fieldName)
                        ? roboostCompanyVisibleColumns.filter(
                            (fieldName) => fieldName !== column.fieldName,
                          )
                        : [...roboostCompanyVisibleColumns, column.fieldName],
                    ),
                }))}
              trigger={({ toggle, isOpen }) => (
                <StyledColumnsButton
                  type="button"
                  aria-label={t`Edit columns`}
                  aria-expanded={isOpen}
                  onClick={toggle}
                >
                  <Icon name="columns" size={16} />
                </StyledColumnsButton>
              )}
            />
          </StyledToolbarRow>
          {isFilterRowShown && (
            <RoboostCompaniesFilterChips
              filters={filters}
              onFiltersChange={changeFilters}
              fieldsByName={fieldsByName}
              advancedFiltersPath={classicPath}
              hasActiveFilters={hasActiveFilters}
            />
          )}
        </StyledToolbar>
      </StyledToolbarCard>

      {isDefined(error) && (
        <StyledError>{t`Companies could not be loaded: ${error.message}`}</StyledError>
      )}

      <StyledTableArea>
        <DataTable
          columns={tableColumns}
          rows={rows}
          selectable
          stickyFirst
          sort={sort}
          onSort={(key, dir) => {
            setSort({ key, dir });
            setPage(1);
          }}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          onRowClick={(row) => openCompany(row.id)}
          emptyState={
            loading && !hasLoaded
              ? t`Loading companies…`
              : t`No companies match these filters.`
          }
          page={{
            current: page,
            pages: pageCount,
            from,
            to,
            count: totalCount,
            pageSize,
            pageSizeOptions: PAGE_SIZE_OPTIONS,
          }}
          onPageChange={(nextPage) => {
            setPage(Math.min(Math.max(1, nextPage), pageCount));
          }}
          onPageSizeChange={(nextPageSize) => {
            setPageSize(nextPageSize);
            setPage(1);
          }}
        />
      </StyledTableArea>
    </StyledPage>
  );
};
