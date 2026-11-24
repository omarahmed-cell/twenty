import { currentWorkspaceMemberState } from '@/auth/states/currentWorkspaceMemberState';
import { useApolloCoreClient } from '@/object-metadata/hooks/useApolloCoreClient';
import { useObjectMetadataItems } from '@/object-metadata/hooks/useObjectMetadataItems';
import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { getRecordsFromRecordConnection } from '@/object-record/cache/utils/getRecordsFromRecordConnection';
import { type RecordGqlOperationFindManyResult } from '@/object-record/graphql/types/RecordGqlOperationFindManyResult';
import { useDeleteManyRecords } from '@/object-record/hooks/useDeleteManyRecords';
import { useFindManyRecordsQuery } from '@/object-record/hooks/useFindManyRecordsQuery';
import { useOpenObjectRecordsSpreadsheetImportDialog } from '@/object-record/spreadsheet-import/hooks/useOpenObjectRecordsSpreadsheetImportDialog';
import { getRoboostRecordLabel } from '@/roboost-app/fields/getRoboostRecordLabel';
import { useOpenRoboostCreatePanel } from '@/roboost-app/hooks/useOpenRoboostCreatePanel';
import { useRoboostPagedRecords } from '@/roboost-app/hooks/useRoboostPagedRecords';
import { useRoboostUserVars } from '@/roboost-app/hooks/useRoboostUserVars';
import { useRoboostViewQueryVariables } from '@/roboost-app/hooks/useRoboostViewQueryVariables';
import { RoboostAdvancedFiltersPanel } from '@/roboost-app/filters/components/RoboostAdvancedFiltersPanel';
import { useRoboostCreateView } from '@/roboost-app/list/hooks/useRoboostCreateView';
import { useRoboostSavedViewState } from '@/roboost-app/list/hooks/useRoboostSavedViewState';
import { isSameRoboostViewState } from '@/roboost-app/list/utils/isSameRoboostViewState';
import { Input } from '@/roboost-ui/components/Input';
import { useToast } from 'twenty-ui/components/feedback';
import { RoboostColumnsModal } from '@/roboost-app/list/components/RoboostColumnsModal';
import {
  ROBOOST_PAGE_SIZE_OPTIONS,
  RoboostListFooter,
} from '@/roboost-app/list/components/RoboostListFooter';
import {
  type RoboostListSort,
  RoboostListTable,
} from '@/roboost-app/list/components/RoboostListTable';
import { RoboostListToolbar } from '@/roboost-app/list/components/RoboostListToolbar';
import { RoboostViewTabs } from '@/roboost-app/list/components/RoboostViewTabs';
import { RoboostBoard } from '@/roboost-app/board/components/RoboostBoard';
import { RoboostBoardMetrics } from '@/roboost-app/board/components/RoboostBoardMetrics';
import { RoboostCardSettingsPanel } from '@/roboost-app/board/components/RoboostCardSettingsPanel';
import { useRoboostBoardCardFields } from '@/roboost-app/board/hooks/useRoboostBoardCardFields';
import { useRoboostPipelines } from '@/roboost-app/board/hooks/useRoboostPipelines';
import { Select } from '@/roboost-ui/components/Select';
import { RoboostListNavigationEffect } from '@/roboost-app/list/components/RoboostListNavigationEffect';
import { useRoboostViewColumns } from '@/roboost-app/list/hooks/useRoboostViewColumns';
import {
  EMPTY_ROBOOST_LIST_FILTERS,
  type RoboostListFilters,
} from '@/roboost-app/list/types/RoboostListFilters';
import { buildRoboostListFilter } from '@/roboost-app/list/utils/buildRoboostListFilter';
import { getRoboostListRecordGqlFields } from '@/roboost-app/list/utils/getRoboostListRecordGqlFields';
import { exportRoboostTableToCsv } from '@/roboost-app/utils/exportRoboostTableToCsv';
import { formatRoboostFieldValue } from '@/roboost-app/utils/formatRoboostFieldValue';
import { Button } from '@/roboost-ui/components/Button';
import { Icon } from '@/roboost-ui/components/Icon';
import { Menu } from '@/roboost-ui/components/Menu';
import { Modal } from '@/roboost-ui/components/Modal';
import { cx } from '@/roboost-ui/utils/cx';
import { SpreadsheetImportProvider } from '@/spreadsheet-import/provider/components/SpreadsheetImportProvider';
import { useAtomFamilySelectorValue } from '@/ui/utilities/state/jotai/hooks/useAtomFamilySelectorValue';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { viewsFromObjectMetadataItemFamilySelector } from '@/views/states/selectors/viewsFromObjectMetadataItemFamilySelector';
import { ViewKey } from '@/views/types/ViewKey';
import { useLingui } from '@lingui/react/macro';
import { isNonEmptyString } from '@sniptt/guards';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  CoreObjectNameSingular,
  type RecordGqlOperationFilter,
} from 'twenty-shared/types';
import { getOrderByForFieldMetadataType, isDefined } from 'twenty-shared/utils';
import { useDebouncedCallback } from 'use-debounce';
import { FieldMetadataType, RelationType } from '~/generated-metadata/graphql';

const EXPORT_LIMIT = 5000;
const OWNER_FIELD_NAMES = [
  'accountOwner',
  'owner',
  'assignee',
  'sdrOwner',
  'assignedTo',
];
const STATUS_FIELD_NAMES = ['leadStatus', 'stage', 'status', 'lifecycleStage'];
const BOARD_OBJECTS = new Set(['opportunity', 'service']);

const SORT_ORDER = { asc: 'AscNullsLast', desc: 'DescNullsLast' } as const;

type RoboostObjectListPageProps = {
  objectMetadataItem: EnrichedObjectMetadataItem;
};

// One list page for every object: views as tabs, toolbar, own-scrolling table and a page-based footer
export const RoboostObjectListPage = ({
  objectMetadataItem,
}: RoboostObjectListPageProps) => {
  const { t } = useLingui();
  const [searchParams, setSearchParams] = useSearchParams();
  const apolloCoreClient = useApolloCoreClient();
  const { objectMetadataItems } = useObjectMetadataItems();
  const currentWorkspaceMember = useAtomStateValue(currentWorkspaceMemberState);
  const { getUserVar, setUserVar } = useRoboostUserVars();
  const openCreatePanel = useOpenRoboostCreatePanel();
  const { openObjectRecordsSpreadsheetImportDialog } =
    useOpenObjectRecordsSpreadsheetImportDialog(
      objectMetadataItem.nameSingular,
    );
  const { deleteManyRecords } = useDeleteManyRecords({
    objectNameSingular: objectMetadataItem.nameSingular,
  });

  const views = useAtomFamilySelectorValue(
    viewsFromObjectMetadataItemFamilySelector,
    { objectMetadataItemId: objectMetadataItem.id },
  );

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filters, setFilters] = useState<RoboostListFilters>(
    EMPTY_ROBOOST_LIST_FILTERS,
  );
  const [sort, setSort] = useState<RoboostListSort | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(ROBOOST_PAGE_SIZE_OPTIONS[1]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isColumnsOpen, setIsColumnsOpen] = useState(false);
  const [frozenDraft, setFrozenDraft] = useState<{
    viewId?: string;
    count: number;
  } | null>(null);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [isFilterRowOpen, setIsFilterRowOpen] = useState(true);
  const [loadedViewId, setLoadedViewId] = useState<string | null>(null);
  const [namingViewMode, setNamingViewMode] = useState<
    'create' | 'clone' | null
  >(null);
  const [viewName, setViewName] = useState('');
  const [isSavingView, setIsSavingView] = useState(false);
  const { enqueueToast } = useToast();
  const { createView } = useRoboostCreateView(objectMetadataItem);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isCardSettingsOpen, setIsCardSettingsOpen] = useState(false);
  const { pipelines } = useRoboostPipelines(objectMetadataItem);
  const {
    cardFields,
    listableFields: cardListableFields,
    saveCardFields,
  } = useRoboostBoardCardFields(objectMetadataItem);

  const updateDebouncedSearch = useDebouncedCallback((value: string) => {
    setDebouncedSearch(value);
    setPage(1);
  }, 300);

  const activeView =
    views.find((view) => view.id === searchParams.get('viewId')) ??
    views.find((view) => view.key === ViewKey.INDEX) ??
    views[0];

  const { savedState, saveViewState } = useRoboostSavedViewState(activeView);

  // Opening a view brings back its last saved filters and sort
  if (isDefined(activeView) && activeView.id !== loadedViewId) {
    setLoadedViewId(activeView.id);
    setFilters(savedState.filters);
    setSort(savedState.sort);
  }
  const frozenVarKey = `roboost.listFrozen.${activeView?.id ?? objectMetadataItem.id}`;
  const savedFrozenCount = getUserVar<number>(frozenVarKey) ?? 1;
  const frozenCount =
    isDefined(frozenDraft) && frozenDraft.viewId === activeView?.id
      ? frozenDraft.count
      : savedFrozenCount;
  const isFrozenDirty = frozenCount !== savedFrozenCount;
  const changeFrozenCount = (count: number) =>
    setFrozenDraft({ viewId: activeView?.id, count });

  const {
    columns,
    applyColumns,
    moveColumn,
    addColumn,
    addColumnAt,
    removeColumn,
    resizeColumn,
    saveColumns,
    resetColumns,
    isDirty: areColumnsDirty,
  } = useRoboostViewColumns({ view: activeView, objectMetadataItem });
  const isViewDirty =
    areColumnsDirty ||
    isFrozenDirty ||
    !isSameRoboostViewState({ filters, sort }, savedState);

  const saveView = async () => {
    setIsSavingView(true);
    try {
      await saveColumns();
      if (isFrozenDirty) {
        await setUserVar(frozenVarKey, frozenCount);
        setFrozenDraft(null);
      }
      await saveViewState({ filters, sort });
      enqueueToast({ status: 'success', children: t`View saved` });
    } catch {
      enqueueToast({
        status: 'error',
        children: t`Only admins can save a shared view. Use Clone to new view to keep these changes.`,
      });
    } finally {
      setIsSavingView(false);
    }
  };

  const resetView = () => {
    resetColumns();
    setFrozenDraft(null);
    setFilters(savedState.filters);
    setSort(savedState.sort);
    setPage(1);
  };

  const submitViewName = async () => {
    const mode = namingViewMode;

    setNamingViewMode(null);
    const viewId = await createView({
      name: viewName,
      sourceView: activeView,
      columns: columns.map((column) => ({
        fieldId: column.field.id,
        size: column.size,
      })),
      state: mode === 'clone' ? { filters, sort } : undefined,
    });

    if (mode === 'clone') {
      await setUserVar(`roboost.listFrozen.${viewId}`, frozenCount);
      resetColumns();
      setFrozenDraft(null);
    }
    setViewName('');
    changeView(viewId);
  };

  const { filter: viewFilter, orderBy: viewOrderBy } =
    useRoboostViewQueryVariables({ view: activeView, objectMetadataItem });

  const activeFields = objectMetadataItem.fields.filter(
    (field) => field.isActive,
  );
  const ownerField = OWNER_FIELD_NAMES.map((name) =>
    activeFields.find(
      (field) =>
        field.name === name &&
        field.relation?.type === RelationType.MANY_TO_ONE &&
        field.relation.targetObjectMetadata.nameSingular ===
          CoreObjectNameSingular.WorkspaceMember,
    ),
  ).find(isDefined);
  const statusField = STATUS_FIELD_NAMES.map((name) =>
    activeFields.find(
      (field) => field.name === name && field.type === FieldMetadataType.SELECT,
    ),
  ).find(isDefined);

  const scopeFieldName = searchParams.get('filterField');
  const scopeValue = searchParams.get('filterValue');
  const scopeFilter =
    isNonEmptyString(scopeFieldName) && isNonEmptyString(scopeValue)
      ? { [scopeFieldName]: { eq: scopeValue } }
      : undefined;

  const filter = buildRoboostListFilter({
    objectMetadataItem,
    viewFilter: isDefined(scopeFilter)
      ? isDefined(viewFilter)
        ? { and: [viewFilter, scopeFilter] }
        : scopeFilter
      : viewFilter,
    search: debouncedSearch,
    filters,
    ownerFieldName: ownerField?.name,
    currentWorkspaceMemberId: currentWorkspaceMember?.id,
    now: new Date(),
  });

  const sortField = isDefined(sort)
    ? objectMetadataItem.fields.find((field) => field.name === sort.fieldName)
    : undefined;
  const orderBy = isDefined(sort)
    ? isDefined(sortField)
      ? getOrderByForFieldMetadataType({
          field: sortField,
          orderByDirection: SORT_ORDER[sort.direction],
        })
      : [{ [sort.fieldName]: SORT_ORDER[sort.direction] }]
    : viewOrderBy.length > 0
      ? viewOrderBy
      : [{ createdAt: 'DescNullsLast' }];

  const recordGqlFields = getRoboostListRecordGqlFields(
    objectMetadataItem,
    columns.map((column) => column.field),
    objectMetadataItems,
  );

  const { records, totalCount, loading, error, hasLoaded, refetch } =
    useRoboostPagedRecords({
      objectNameSingular: objectMetadataItem.nameSingular,
      filter,
      orderBy: orderBy as never,
      recordGqlFields,
      page,
      pageSize,
    });

  const { findManyRecordsQuery } = useFindManyRecordsQuery({
    objectNameSingular: objectMetadataItem.nameSingular,
    recordGqlFields,
  });

  const recordIds = records.map((record) => record.id);
  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize));
  const objectLabelLower = objectMetadataItem.labelPlural.toLowerCase();
  const countLabel = hasLoaded
    ? `${totalCount.toLocaleString('en-US')} ${objectLabelLower}`
    : t`Loading…`;

  const resetPaging = () => {
    setPage(1);
    setSelectedIds([]);
  };

  const changeView = (viewId: string) => {
    const nextSearchParams = new URLSearchParams(searchParams);

    nextSearchParams.set('viewId', viewId);
    setSearchParams(nextSearchParams);
    resetPaging();
  };

  const exportRecords = async () => {
    setIsExporting(true);

    try {
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
      const exportRows = getRecordsFromRecordConnection({
        recordConnection: connection,
      }).filter(
        (record) => selectedIds.length === 0 || selectedIds.includes(record.id),
      );

      exportRoboostTableToCsv({
        headers: columns.map((column) => column.field.label),
        rows: exportRows.map((record) =>
          columns.map((column) =>
            column.field.type === FieldMetadataType.RELATION
              ? getRoboostRecordLabel(
                  record[column.field.name] as Record<string, unknown> & {
                    id: string;
                  },
                  objectMetadataItems.find(
                    (item) =>
                      item.nameSingular ===
                      column.field.relation?.targetObjectMetadata.nameSingular,
                  ),
                )
              : formatRoboostFieldValue(
                  column.field,
                  record[column.field.name],
                ),
          ),
        ),
        fileName: `${objectMetadataItem.labelPlural}.csv`,
      });
    } finally {
      setIsExporting(false);
    }
  };

  const deleteSelected = async () => {
    await deleteManyRecords({ recordIdsToDelete: selectedIds });
    setIsDeleteOpen(false);
    setSelectedIds([]);
    refetch();
  };

  const isBoardObject =
    BOARD_OBJECTS.has(objectMetadataItem.nameSingular) &&
    activeFields.some(
      (field) =>
        field.name === 'stage' && field.type === FieldMetadataType.SELECT,
    );
  const displayVarKey = `roboost.listDisplay.${objectMetadataItem.nameSingular}`;
  const pipelineVarKey = `roboost.boardPipeline.${objectMetadataItem.nameSingular}`;
  const isBoard =
    isBoardObject && getUserVar<string>(displayVarKey) === 'board';
  const selectedPipeline =
    pipelines.find(
      (pipeline) => pipeline.key === getUserVar<string>(pipelineVarKey),
    ) ?? pipelines[0];
  const hasAmountField = activeFields.some((field) => field.name === 'amount');
  const boardFilter: RecordGqlOperationFilter = filter ?? {};

  return (
    <SpreadsheetImportProvider>
      <RoboostListNavigationEffect
        objectNameSingular={objectMetadataItem.nameSingular}
        recordIds={recordIds}
      />
      <div className="rb-list-page">
        <div className="rb-page-head">
          <div>
            <div className="rb-ph-title">{objectMetadataItem.labelPlural}</div>
            <div className="rb-ph-sub">
              {hasLoaded
                ? t`${totalCount.toLocaleString('en-US')} records · Roboost CRM`
                : t`Loading records`}
            </div>
          </div>
          <span className="rb-sp" />
          {/* Data quality module is not built yet */}
          <button type="button" className="rb-hbtn rb-hbtn-ghost">
            {t`Data quality`}
          </button>
          <Menu
            align="right"
            entries={[
              {
                id: 'export',
                label:
                  selectedIds.length > 0
                    ? t`Export ${selectedIds.length} selected`
                    : t`Export this view`,
                icon: 'download',
                onSelect: exportRecords,
              },
              {
                id: 'delete',
                label: t`Delete selected`,
                icon: 'trash',
                isDanger: true,
                isDisabled: selectedIds.length === 0,
                onSelect: () => {
                  if (selectedIds.length > 0) {
                    setIsDeleteOpen(true);
                  }
                },
              },
              { id: 'sep', isSeparator: true },
              {
                id: 'classic',
                label: t`Open classic table`,
                icon: 'table',
                href: `?view=classic${isDefined(activeView) ? `&viewId=${activeView.id}` : ''}`,
              },
            ]}
            trigger={({ toggle, isOpen }) => (
              <button
                type="button"
                className="rb-hbtn"
                aria-expanded={isOpen}
                onClick={toggle}
              >
                {t`Actions`} <Icon name="caret" size={14} />
              </button>
            )}
          />
          <button
            type="button"
            className="rb-hbtn"
            onClick={() => openObjectRecordsSpreadsheetImportDialog()}
          >
            {t`Import`}
          </button>
          <button
            type="button"
            className="rb-hbtn rb-hbtn-accent"
            onClick={() =>
              openCreatePanel({
                objectNameSingular: objectMetadataItem.nameSingular,
              })
            }
          >
            <Icon name="plus" size={14} strokeWidth={2} />
            {t`Create ${objectMetadataItem.labelSingular.toLowerCase()}`}
          </button>
        </div>

        <div className="rb-list-shell">
          <RoboostViewTabs
            objectMetadataItem={objectMetadataItem}
            views={views}
            activeViewId={activeView?.id}
            activeCount={hasLoaded ? totalCount : undefined}
            isDirty={isViewDirty}
            onChange={changeView}
            onCreate={() => setNamingViewMode('create')}
            onClone={() => setNamingViewMode('clone')}
            onSave={saveView}
            onReset={resetView}
          />
          <RoboostListToolbar
            objectMetadataItem={objectMetadataItem}
            search={search}
            onSearchChange={(value) => {
              setSearch(value);
              updateDebouncedSearch(value);
            }}
            filters={filters}
            onFiltersChange={(nextFilters) => {
              setFilters(nextFilters);
              resetPaging();
            }}
            ownerField={ownerField}
            statusField={statusField}
            sort={sort}
            onSortChange={(nextSort) => {
              setSort(nextSort);
              setPage(1);
            }}
            onOpenAdvanced={() => setIsAdvancedOpen(true)}
            isFilterRowOpen={isFilterRowOpen}
            onToggleFilterRow={() => setIsFilterRowOpen(!isFilterRowOpen)}
            onOpenColumns={() => setIsColumnsOpen(true)}
            displayToggle={
              isBoardObject ? (
                <>
                  {isBoard && pipelines.length > 1 && (
                    <Select
                      aria-label={t`Pipeline`}
                      className="rb-pipeline-select"
                      value={selectedPipeline?.key}
                      options={pipelines.map((pipeline) => ({
                        value: pipeline.key,
                        label: pipeline.name,
                      }))}
                      onChange={(key) => setUserVar(pipelineVarKey, key)}
                    />
                  )}
                  <span className="rb-display-toggle" role="group">
                    <button
                      type="button"
                      className={cx('rb-icon-btn', isBoard && 'is-on')}
                      aria-label={t`Board`}
                      aria-pressed={isBoard}
                      onClick={() => setUserVar(displayVarKey, 'board')}
                    >
                      <Icon name="board" size={16} />
                    </button>
                    <button
                      type="button"
                      className={cx('rb-icon-btn', !isBoard && 'is-on')}
                      aria-label={t`Table`}
                      aria-pressed={!isBoard}
                      onClick={() => setUserVar(displayVarKey, 'table')}
                    >
                      <Icon name="table" size={16} />
                    </button>
                  </span>
                  {isBoard && (
                    <button
                      type="button"
                      className="rb-icon-btn"
                      aria-label={t`Card settings`}
                      title={t`Card settings`}
                      onClick={() => setIsCardSettingsOpen(true)}
                    >
                      <Icon name="gear" size={16} />
                    </button>
                  )}
                </>
              ) : undefined
            }
          />
          {isDefined(error) && (
            <div className="rb-ls-error">
              {t`This list could not be loaded: ${error.message}`}
            </div>
          )}
          {isBoard && hasAmountField && (
            <RoboostBoardMetrics
              objectMetadataItem={objectMetadataItem}
              filter={
                isDefined(selectedPipeline) && selectedPipeline.key !== ''
                  ? {
                      and: [
                        boardFilter,
                        { pipeline: { eq: selectedPipeline.key } },
                      ],
                    }
                  : boardFilter
              }
            />
          )}
          {isBoard && isDefined(selectedPipeline) && (
            <RoboostBoard
              objectMetadataItem={objectMetadataItem}
              pipeline={selectedPipeline}
              filter={boardFilter}
              cardFields={cardFields}
              ownerField={ownerField}
            />
          )}
          {isBoard && (
            <div className="rb-ls-foot">
              <span className="rb-lf-count">{countLabel}</span>
              <span className="rb-sp" />
              <span className="rb-lf-right">
                <button
                  type="button"
                  className="rb-icon-btn"
                  aria-label={t`Refresh`}
                  title={t`Refresh`}
                  onClick={() =>
                    apolloCoreClient.refetchQueries({ include: 'active' })
                  }
                >
                  <Icon name="refresh" size={16} />
                </button>
                <button
                  type="button"
                  className="rb-hbtn"
                  disabled={isExporting}
                  onClick={exportRecords}
                >
                  <Icon name="download" size={14} />
                  {isExporting ? t`Exporting…` : t`Export`}
                </button>
              </span>
            </div>
          )}
          {!isBoard && (
            <RoboostListTable
              objectMetadataItem={objectMetadataItem}
              objectMetadataItems={objectMetadataItems}
              columns={columns}
              records={records as (Record<string, unknown> & { id: string })[]}
              frozenCount={Math.min(frozenCount, columns.length)}
              sort={sort}
              onSort={(nextSort) => {
                setSort(nextSort);
                setPage(1);
              }}
              selectedIds={selectedIds}
              onSelectionChange={setSelectedIds}
              onMoveColumn={moveColumn}
              onResizeColumn={resizeColumn}
              onFrozenCountChange={changeFrozenCount}
              onAddColumnAt={addColumnAt}
              onToggleColumn={(fieldId) =>
                columns.some((column) => column.field.id === fieldId)
                  ? removeColumn(fieldId)
                  : addColumn(fieldId)
              }
              isLoading={loading}
            />
          )}
          {!isBoard && (
            <RoboostListFooter
              countLabel={
                selectedIds.length > 0
                  ? t`${selectedIds.length} selected of ${countLabel}`
                  : countLabel
              }
              page={page}
              pageCount={pageCount}
              pageSize={pageSize}
              onPageChange={(nextPage) =>
                setPage(Math.min(Math.max(1, nextPage), pageCount))
              }
              onPageSizeChange={(nextPageSize) => {
                setPageSize(nextPageSize);
                setPage(1);
              }}
              onRefresh={() => refetch()}
              onExport={exportRecords}
              isExporting={isExporting}
              isDirty={isViewDirty}
              isSaving={isSavingView}
              onSave={saveView}
              onClone={() => setNamingViewMode('clone')}
            />
          )}
        </div>
      </div>

      {isCardSettingsOpen && (
        <RoboostCardSettingsPanel
          objectMetadataItem={objectMetadataItem}
          cardFields={cardFields}
          listableFields={cardListableFields}
          onSave={saveCardFields}
          onClose={() => setIsCardSettingsOpen(false)}
        />
      )}
      {isColumnsOpen && (
        <RoboostColumnsModal
          objectMetadataItem={objectMetadataItem}
          selectedFieldIds={columns.map((column) => column.field.id)}
          frozenCount={frozenCount}
          onClose={() => setIsColumnsOpen(false)}
          onApply={async (fieldIds, nextFrozenCount) => {
            setIsColumnsOpen(false);
            applyColumns(fieldIds);
            if (nextFrozenCount !== frozenCount) {
              changeFrozenCount(nextFrozenCount);
            }
          }}
        />
      )}
      {isAdvancedOpen && (
        <RoboostAdvancedFiltersPanel
          objectMetadataItem={objectMetadataItem}
          value={filters.advanced}
          onClose={() => setIsAdvancedOpen(false)}
          onApply={(advanced) => {
            setFilters({ ...filters, advanced });
            resetPaging();
          }}
        />
      )}
      <Modal
        open={namingViewMode !== null}
        title={
          namingViewMode === 'clone' ? t`Clone to new view` : t`Create view`
        }
        subtitle={
          namingViewMode === 'clone'
            ? t`The new view keeps the current columns, filters and sort.`
            : t`It starts with the columns of the current view.`
        }
        onClose={() => setNamingViewMode(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setNamingViewMode(null)}>
              {t`Cancel`}
            </Button>
            <Button
              variant="primary"
              disabled={viewName.trim() === ''}
              onClick={submitViewName}
            >
              {namingViewMode === 'clone' ? t`Clone` : t`Create view`}
            </Button>
          </>
        }
      >
        <Input
          value={viewName}
          placeholder={t`View name`}
          aria-label={t`View name`}
          onChange={(event) => setViewName(event.target.value)}
        />
      </Modal>
      <Modal
        open={isDeleteOpen}
        tone="danger"
        title={t`Delete ${selectedIds.length} ${objectLabelLower}?`}
        subtitle={t`They move to the trash and can be restored from there.`}
        onClose={() => setIsDeleteOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsDeleteOpen(false)}>
              {t`Cancel`}
            </Button>
            <Button variant="primary" tone="danger" onClick={deleteSelected}>
              {t`Delete`}
            </Button>
          </>
        }
      />
    </SpreadsheetImportProvider>
  );
};
