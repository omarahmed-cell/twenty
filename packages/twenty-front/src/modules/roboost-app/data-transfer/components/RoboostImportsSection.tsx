import { useObjectMetadataItems } from '@/object-metadata/hooks/useObjectMetadataItems';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import {
  ROBOOST_IMPORTS,
  ROBOOST_RENAME_IMPORT,
} from '@/roboost-app/data-transfer/graphql/roboostDataTransferQueries';
import { useRoboostDownloadTransferFile } from '@/roboost-app/data-transfer/hooks/useRoboostDownloadTransferFile';
import { getRoboostPersonName } from '@/roboost-app/utils/getRoboostPersonName';
import { formatRoboostDateTime } from '@/roboost-app/utils/formatRoboostDateTime';
import { Button } from '@/roboost-ui/components/Button';
import { Icon } from '@/roboost-ui/components/Icon';
import { Input } from '@/roboost-ui/components/Input';
import { Menu } from '@/roboost-ui/components/Menu';
import { Select } from '@/roboost-ui/components/Select';
import { cx } from '@/roboost-ui/utils/cx';
import { useMutation, useQuery } from '@apollo/client/react';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { CoreObjectNameSingular } from 'twenty-shared/types';
import { useDebounce } from 'use-debounce';

const PAGE_SIZE = 20;
const DAY_MS = 24 * 3600 * 1000;

type RoboostImportRow = {
  id: string;
  name: string;
  objectNameSingular: string;
  state: 'IN_PROGRESS' | 'DONE' | 'DONE_WITH_ERRORS' | 'FAILED';
  newCount: number;
  updatedCount: number;
  newAssociations: number;
  errorCount: number;
  hasErrorFile: boolean;
  workspaceMemberId: string | null;
  createdByName: string | null;
  createdAt: string;
};

type ColumnKey =
  | 'state'
  | 'object'
  | 'newCount'
  | 'updatedCount'
  | 'newAssociations'
  | 'errors'
  | 'createdBy'
  | 'createdAt';

type MemberRecord = {
  id: string;
  name: { firstName: string; lastName: string } | null;
  __typename: string;
};

const createdRangeStart = (range: string): string | null => {
  const now = new Date();

  switch (range) {
    case 'today':
      return new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
      ).toISOString();
    case 'last7':
      return new Date(now.getTime() - 7 * DAY_MS).toISOString();
    case 'last30':
      return new Date(now.getTime() - 30 * DAY_MS).toISOString();
    case 'thisMonth':
      return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    default:
      return null;
  }
};

export const RoboostImportsSection = ({
  highlightedId,
}: {
  highlightedId: string | null;
}) => {
  const { t } = useLingui();
  const { objectMetadataItems } = useObjectMetadataItems();
  const { downloadImportErrors } = useRoboostDownloadTransferFile();
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebounce(search, 300);
  const [objectFilter, setObjectFilter] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [createdByFilter, setCreatedByFilter] = useState('');
  const [createdRange, setCreatedRange] = useState('any');
  const [page, setPage] = useState(1);
  const [hiddenColumns, setHiddenColumns] = useState<ColumnKey[]>([]);
  const [renaming, setRenaming] = useState<{ id: string; name: string } | null>(
    null,
  );
  const [renameImport] = useMutation(ROBOOST_RENAME_IMPORT);
  const { records: members } = useFindManyRecords<MemberRecord>({
    objectNameSingular: CoreObjectNameSingular.WorkspaceMember,
    recordGqlFields: { id: true, name: true },
    limit: 200,
  });
  const { data, loading, refetch } = useQuery<{
    roboostImports: { items: RoboostImportRow[]; total: number };
  }>(ROBOOST_IMPORTS, {
    variables: {
      search: debouncedSearch,
      objectNameSingular: objectFilter || null,
      state: stateFilter || null,
      createdById: createdByFilter || null,
      createdFrom: createdRangeStart(createdRange),
      page,
      pageSize: PAGE_SIZE,
    },
    fetchPolicy: 'cache-and-network',
  });
  const items = data?.roboostImports.items ?? [];
  const total = data?.roboostImports.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const stateLabels: Record<RoboostImportRow['state'], string> = {
    DONE: t`Done`,
    DONE_WITH_ERRORS: t`Done with errors`,
    FAILED: t`Failed`,
    IN_PROGRESS: t`In progress`,
  };
  const columnLabels: Record<ColumnKey, string> = {
    state: t`Import state`,
    object: t`Object`,
    newCount: t`New records`,
    updatedCount: t`Updated records`,
    newAssociations: t`New associations`,
    errors: t`Errors`,
    createdBy: t`Created by`,
    createdAt: t`Created date`,
  };
  const columns = (Object.keys(columnLabels) as ColumnKey[]).filter(
    (key) => !hiddenColumns.includes(key),
  );
  const objectLabel = (nameSingular: string) =>
    objectMetadataItems.find((item) => item.nameSingular === nameSingular)
      ?.labelPlural ?? nameSingular;
  const importableObjects = objectMetadataItems
    .filter((item) => item.isActive && item.isSystem !== true)
    .sort((first, second) =>
      first.labelPlural.localeCompare(second.labelPlural),
    );
  const resetPage = () => setPage(1);

  const saveRename = async () => {
    if (renaming === null || renaming.name.trim() === '') {
      setRenaming(null);
      return;
    }
    await renameImport({ variables: { id: renaming.id, name: renaming.name } });
    setRenaming(null);
    await refetch();
  };

  const renderCell = (row: RoboostImportRow, column: ColumnKey) => {
    switch (column) {
      case 'state':
        return (
          <span className={cx('rb-dt-state', `is-${row.state.toLowerCase()}`)}>
            <span className="rb-dt-dot" />
            {stateLabels[row.state]}
          </span>
        );
      case 'object':
        return objectLabel(row.objectNameSingular);
      case 'newCount':
        return row.newCount || '--';
      case 'updatedCount':
        return row.updatedCount || '--';
      case 'newAssociations':
        return row.newAssociations || '--';
      case 'errors':
        return row.errorCount > 0 ? (
          <span className="rb-dt-errors">
            {row.errorCount}
            {row.hasErrorFile && (
              <button
                type="button"
                className="rb-link"
                onClick={() => downloadImportErrors(row.id)}
              >
                {t`Download errors`}
              </button>
            )}
          </span>
        ) : (
          '--'
        );
      case 'createdBy':
        return row.createdByName ?? '--';
      case 'createdAt':
        return formatRoboostDateTime(row.createdAt);
    }
  };

  return (
    <div className="rb-dt-card">
      <div className="rb-dt-card-head">
        <div>
          <h3 className="rb-dt-title">{t`Monitor your imports`}</h3>
          <p className="rb-dt-sub">{t`Every import run from the import dialog. Click a name to rename it.`}</p>
        </div>
        <Menu
          align="right"
          minWidth={220}
          keepOpenOnSelect
          entries={(Object.keys(columnLabels) as ColumnKey[]).map((key) => ({
            id: key,
            label: columnLabels[key],
            isSelected: !hiddenColumns.includes(key),
            onSelect: () =>
              setHiddenColumns(
                hiddenColumns.includes(key)
                  ? hiddenColumns.filter((hidden) => hidden !== key)
                  : [...hiddenColumns, key],
              ),
          }))}
          trigger={({ toggle, isOpen }) => (
            <Button
              size="sm"
              variant="secondary"
              aria-expanded={isOpen}
              aria-haspopup="menu"
              onClick={toggle}
            >
              {t`Edit columns`}
            </Button>
          )}
        />
      </div>
      <div className="rb-dt-filters">
        <Select
          aria-label={t`Object`}
          placeholder={t`Object: All`}
          value={objectFilter}
          isClearable
          options={importableObjects.map((item) => ({
            value: item.nameSingular,
            label: item.labelPlural,
          }))}
          onChange={(value) => {
            setObjectFilter(value);
            resetPage();
          }}
        />
        <Select
          aria-label={t`Import state`}
          placeholder={t`State: All`}
          value={stateFilter}
          isClearable
          options={(
            Object.keys(stateLabels) as RoboostImportRow['state'][]
          ).map((state) => ({ value: state, label: stateLabels[state] }))}
          onChange={(value) => {
            setStateFilter(value);
            resetPage();
          }}
        />
        <Select
          aria-label={t`Created by`}
          placeholder={t`Created by: Anyone`}
          value={createdByFilter}
          isClearable
          options={members.map((member) => ({
            value: member.id,
            label: getRoboostPersonName(member.name),
          }))}
          onChange={(value) => {
            setCreatedByFilter(value);
            resetPage();
          }}
        />
        <Select
          aria-label={t`Created date`}
          value={createdRange}
          options={[
            { value: 'any', label: t`Created: Any time` },
            { value: 'today', label: t`Today` },
            { value: 'last7', label: t`Last 7 days` },
            { value: 'last30', label: t`Last 30 days` },
            { value: 'thisMonth', label: t`This month` },
          ]}
          onChange={(value) => {
            setCreatedRange(value || 'any');
            resetPage();
          }}
        />
        <Input
          variant="search"
          size="sm"
          placeholder={t`Search imports`}
          aria-label={t`Search imports`}
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            resetPage();
          }}
        />
      </div>
      <div className="rb-dt-table-wrap">
        <table className="rb-dt-table">
          <thead>
            <tr>
              <th>{t`Import name`}</th>
              {columns.map((column) => (
                <th
                  key={column}
                  className={cx(
                    ['newCount', 'updatedCount', 'newAssociations'].includes(
                      column,
                    ) && 'is-number',
                  )}
                >
                  {columnLabels[column]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((row) => (
              <tr
                key={row.id}
                className={cx(row.id === highlightedId && 'is-highlighted')}
              >
                <td>
                  {renaming?.id === row.id ? (
                    <Input
                      size="sm"
                      aria-label={t`Import name`}
                      value={renaming.name}
                      onChange={(event) =>
                        setRenaming({ id: row.id, name: event.target.value })
                      }
                      onBlur={saveRename}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          saveRename();
                        }
                        if (event.key === 'Escape') {
                          setRenaming(null);
                        }
                      }}
                    />
                  ) : (
                    <button
                      type="button"
                      className="rb-dt-name rb-dt-rename"
                      title={t`Rename`}
                      onClick={() =>
                        setRenaming({ id: row.id, name: row.name })
                      }
                    >
                      <span className="rb-truncate">{row.name}</span>
                      <Icon name="pencil" size={12} />
                    </button>
                  )}
                </td>
                {columns.map((column) => (
                  <td
                    key={column}
                    className={cx(
                      ['newCount', 'updatedCount', 'newAssociations'].includes(
                        column,
                      ) && 'is-number',
                    )}
                  >
                    {renderCell(row, column)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && items.length === 0 && (
          <div className="rb-dt-empty">{t`No imports match.`}</div>
        )}
      </div>
      <div className="rb-dt-pager">
        <span className="rb-dt-muted">{t`${total} imports`}</span>
        <Button
          size="sm"
          variant="secondary"
          disabled={page <= 1}
          onClick={() => setPage(page - 1)}
        >
          {t`Prev`}
        </Button>
        <span>{t`${page} of ${pageCount}`}</span>
        <Button
          size="sm"
          variant="secondary"
          disabled={page >= pageCount}
          onClick={() => setPage(page + 1)}
        >
          {t`Next`}
        </Button>
      </div>
    </div>
  );
};
