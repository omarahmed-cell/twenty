import { Avatar } from '@/roboost-ui/components/Avatar';
import { Checkbox } from '@/roboost-ui/components/Checkbox';
import { Icon } from '@/roboost-ui/components/Icon';
import { Tag } from '@/roboost-ui/components/Tag';
import { type RoboostAvatarTone } from '@/roboost-ui/types/RoboostAvatarTone';
import { type RoboostTone } from '@/roboost-ui/types/RoboostTone';
import { getPageNumbers } from '@/roboost-ui/utils/getPageNumbers';
import { cx } from '@/roboost-ui/utils/cx';
import { useLingui } from '@lingui/react/macro';
import { type ReactNode, useState } from 'react';

export type DataTableTagValue = {
  tone: RoboostTone;
  dot?: boolean;
  label: ReactNode;
};

export type DataTableAvatarValue = {
  name: string;
  src?: string | null;
  tone?: RoboostAvatarTone;
};

export type Column = {
  key: string;
  label: ReactNode;
  type?: 'text' | 'strong' | 'mono' | 'num' | 'tag' | 'avatar';
  align?: 'left' | 'right';
  sortable?: boolean;
};

export type DataTableRow = { id: string } & Record<string, unknown>;

export type PageInfo = {
  current?: number;
  pages?: number;
  from?: number;
  to?: number;
  count?: number;
  pageSize?: number;
  pageSizeOptions?: number[];
};

export type DataTableSort = { key: string; dir: 'asc' | 'desc' };

export type DataTableProps = {
  columns: Column[];
  rows: DataTableRow[];
  selectable?: boolean;
  stickyFirst?: boolean;
  page?: PageInfo;
  sort?: DataTableSort | null;
  onSort?: (key: string, dir: 'asc' | 'desc') => void;
  maxHeight?: number | string;
  className?: string;
  selectedIds?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
  onRowClick?: (row: DataTableRow) => void;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  emptyState?: ReactNode;
};

const isTagValue = (value: unknown): value is DataTableTagValue =>
  typeof value === 'object' && value !== null && 'tone' in value;

const isAvatarValue = (value: unknown): value is DataTableAvatarValue =>
  typeof value === 'object' && value !== null && 'name' in value;

const renderCellContent = (column: Column, value: unknown): ReactNode => {
  if (column.type === 'tag') {
    return isTagValue(value) ? (
      <Tag tone={value.tone} dot={value.dot}>
        {value.label}
      </Tag>
    ) : null;
  }

  if (column.type === 'avatar') {
    return isAvatarValue(value) ? (
      <span className="rb-avatar-cell">
        <Avatar name={value.name} src={value.src} size="sm" tone={value.tone} />
        <span className="rb-td-strong">{value.name}</span>
      </span>
    ) : null;
  }

  return value as ReactNode;
};

const getCellClassName = (column: Column, stickyClassNames: string[]) =>
  [
    column.type === 'strong' ? 'rb-td-strong' : '',
    column.type === 'mono' ? 'rb-td-mono' : '',
    column.type === 'num' ? 'rb-td-num' : '',
    ...stickyClassNames,
  ]
    .filter(Boolean)
    .join(' ');

export const DataTable = ({
  columns,
  rows,
  selectable = false,
  stickyFirst = false,
  page,
  sort,
  onSort,
  maxHeight,
  className,
  selectedIds,
  onSelectionChange,
  onRowClick,
  onPageChange,
  onPageSizeChange,
  emptyState,
}: DataTableProps) => {
  const { t } = useLingui();
  const [uncontrolledSelectedIds, setUncontrolledSelectedIds] = useState<
    string[]
  >([]);
  const [uncontrolledSort, setUncontrolledSort] =
    useState<DataTableSort | null>(sort ?? null);

  const currentSelectedIds = selectedIds ?? uncontrolledSelectedIds;
  const currentSort = sort !== undefined ? sort : uncontrolledSort;
  const rowIds = rows.map((row) => row.id);
  const isAllSelected =
    rowIds.length > 0 && rowIds.every((id) => currentSelectedIds.includes(id));
  const isSomeSelected = rowIds.some((id) => currentSelectedIds.includes(id));

  const setSelection = (nextSelectedIds: string[]) => {
    if (selectedIds === undefined) {
      setUncontrolledSelectedIds(nextSelectedIds);
    }
    onSelectionChange?.(nextSelectedIds);
  };

  const toggleAll = () =>
    setSelection(
      isAllSelected
        ? currentSelectedIds.filter((id) => !rowIds.includes(id))
        : [...new Set([...currentSelectedIds, ...rowIds])],
    );

  const toggleRow = (id: string) =>
    setSelection(
      currentSelectedIds.includes(id)
        ? currentSelectedIds.filter((selectedId) => selectedId !== id)
        : [...currentSelectedIds, id],
    );

  const clickSort = (column: Column) => {
    if (column.sortable !== true) {
      return;
    }
    const dir =
      currentSort?.key === column.key && currentSort.dir === 'asc'
        ? 'desc'
        : 'asc';

    if (sort === undefined) {
      setUncontrolledSort({ key: column.key, dir });
    }
    onSort?.(column.key, dir);
  };

  const getStickyClassNames = (columnIndex: number) => {
    if (!stickyFirst) {
      return [];
    }
    if (columnIndex === 0) {
      return selectable
        ? ['rb-sticky-second', 'rb-sticky-shadow']
        : ['rb-sticky', 'rb-sticky-shadow'];
    }

    return [];
  };

  const currentPage = page?.current ?? 1;
  const pageCount = page?.pages ?? 1;

  return (
    <div className={cx('rb-table-wrap', className)}>
      <div
        className="rb-table-scroll"
        style={maxHeight !== undefined ? { maxHeight } : undefined}
      >
        <table className="rb-table">
          <thead>
            <tr>
              {selectable && (
                <th
                  className={`rb-col-check ${stickyFirst ? 'rb-sticky' : ''}`}
                >
                  <Checkbox
                    aria-label={t`Select all rows`}
                    checked={isAllSelected}
                    indeterminate={!isAllSelected && isSomeSelected}
                    onChange={toggleAll}
                  />
                </th>
              )}
              {columns.map((column, columnIndex) => {
                const isActive = currentSort?.key === column.key;

                return (
                  <th
                    key={column.key}
                    data-sortable={column.sortable === true}
                    className={getStickyClassNames(columnIndex).join(' ')}
                    style={
                      column.align === 'right'
                        ? { textAlign: 'right' }
                        : undefined
                    }
                    aria-sort={
                      isActive
                        ? currentSort?.dir === 'asc'
                          ? 'ascending'
                          : 'descending'
                        : undefined
                    }
                    onClick={() => clickSort(column)}
                  >
                    <span className="rb-th-inner">
                      <span>{column.label}</span>
                      {column.sortable === true && (
                        <span
                          className={cx(
                            'rb-sort-icon',
                            isActive && 'is-active',
                          )}
                        >
                          <Icon name="sort" size={16} />
                        </span>
                      )}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const isSelected = currentSelectedIds.includes(row.id);

              return (
                <tr
                  key={row.id}
                  aria-selected={isSelected}
                  data-clickable={onRowClick !== undefined}
                  onClick={() => onRowClick?.(row)}
                >
                  {selectable && (
                    <td
                      className={`rb-col-check ${stickyFirst ? 'rb-sticky' : ''}`}
                    >
                      <Checkbox
                        aria-label={t`Select row`}
                        checked={isSelected}
                        onChange={() => toggleRow(row.id)}
                      />
                    </td>
                  )}
                  {columns.map((column, columnIndex) => (
                    <td
                      key={column.key}
                      className={getCellClassName(
                        column,
                        getStickyClassNames(columnIndex),
                      )}
                      style={
                        column.align === 'right'
                          ? { textAlign: 'right' }
                          : undefined
                      }
                    >
                      {renderCellContent(column, row[column.key])}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
        {rows.length === 0 && emptyState !== undefined && (
          <div className="rb-table-empty">{emptyState}</div>
        )}
      </div>
      {page !== undefined && (
        <div className="rb-table-foot">
          <span>
            {isSomeSelected
              ? t`${currentSelectedIds.length} selected`
              : `${page.from ?? 1}–${page.to ?? rows.length} ${t`of`} ${page.count ?? rows.length}`}
          </span>
          <div className="rb-foot-right">
            {page.pageSizeOptions !== undefined &&
              onPageSizeChange !== undefined && (
                <label className="rb-page-size">
                  {t`Rows per page`}
                  <select
                    value={page.pageSize}
                    onChange={(event) =>
                      onPageSizeChange(Number(event.target.value))
                    }
                  >
                    {page.pageSizeOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            <div className="rb-pager">
              <button
                className="rb-pager-btn"
                type="button"
                disabled={currentPage <= 1}
                aria-label={t`Previous page`}
                onClick={() => onPageChange?.(currentPage - 1)}
              >
                <Icon name="chevron-left" size={16} />
              </button>
              {getPageNumbers(currentPage, pageCount).map((item) =>
                typeof item === 'number' ? (
                  <button
                    className="rb-pager-page"
                    key={item}
                    type="button"
                    aria-current={item === currentPage}
                    onClick={() => onPageChange?.(item)}
                  >
                    {item}
                  </button>
                ) : (
                  <span className="rb-muted rb-pager-gap" key={item}>
                    …
                  </span>
                ),
              )}
              <button
                className="rb-pager-btn"
                type="button"
                disabled={currentPage >= pageCount}
                aria-label={t`Next page`}
                onClick={() => onPageChange?.(currentPage + 1)}
              >
                <Icon name="chevron-right" size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
