import { Avatar } from '@/roboost-ui/components/Avatar';
import { Checkbox } from '@/roboost-ui/components/Checkbox';
import { Icon } from '@/roboost-ui/components/Icon';
import { Tag } from '@/roboost-ui/components/Tag';
import { ROBOOST_UI_THEME } from '@/roboost-ui/constants/RoboostUiTheme';
import { type RoboostAvatarTone } from '@/roboost-ui/types/RoboostAvatarTone';
import { type RoboostTone } from '@/roboost-ui/types/RoboostTone';
import { getPageNumbers } from '@/roboost-ui/utils/getPageNumbers';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { type ReactNode, useState } from 'react';

const StyledWrap = styled.div`
  background: ${ROBOOST_UI_THEME.surface};
  border: 1px solid ${ROBOOST_UI_THEME.border};
  border-radius: ${ROBOOST_UI_THEME.radiusMd};
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
`;

const StyledScroll = styled.div`
  flex: 1;
  min-height: 0;
  overflow: auto;
`;

const StyledTable = styled.table`
  border-collapse: separate;
  border-spacing: 0;
  font-size: 13px;
  width: 100%;

  th,
  td {
    border-bottom: 1px solid ${ROBOOST_UI_THEME.borderSubtle};
    padding: 8px 12px;
    text-align: left;
    white-space: nowrap;
  }

  thead th {
    background: ${ROBOOST_UI_THEME.surfaceSunken};
    border-bottom: 1px solid ${ROBOOST_UI_THEME.border};
    color: ${ROBOOST_UI_THEME.textMuted};
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.06em;
    position: sticky;
    text-transform: uppercase;
    top: 0;
    z-index: 2;
  }

  thead th[data-sortable='true'] {
    cursor: pointer;
  }

  thead th[data-sortable='true']:hover {
    color: ${ROBOOST_UI_THEME.textSecondary};
  }

  tbody tr {
    background: ${ROBOOST_UI_THEME.surface};
  }

  tbody tr[data-clickable='true'] {
    cursor: pointer;
  }

  tbody tr:hover {
    background: ${ROBOOST_UI_THEME.surfaceHover};
  }

  tbody tr[aria-selected='true'] {
    background: ${ROBOOST_UI_THEME.accentSoft};
  }

  tbody tr[aria-selected='true']:hover {
    background: ${ROBOOST_UI_THEME.accentSoftHover};
  }

  .roboost-col-check {
    padding-left: 12px;
    padding-right: 0;
    width: 40px;
  }

  .roboost-sticky {
    background: inherit;
    left: 0;
    position: sticky;
    z-index: 1;
  }

  .roboost-sticky-second {
    background: inherit;
    left: 40px;
    position: sticky;
    z-index: 1;
  }

  thead th.roboost-sticky,
  thead th.roboost-sticky-second {
    z-index: 3;
  }

  .roboost-sticky-shadow {
    box-shadow: inset -1px 0 0 ${ROBOOST_UI_THEME.border};
  }

  .roboost-td-strong {
    color: ${ROBOOST_UI_THEME.text};
    font-weight: 500;
  }

  .roboost-td-mono {
    color: ${ROBOOST_UI_THEME.textSecondary};
    font-family: ${ROBOOST_UI_THEME.fontMono};
  }

  .roboost-td-num {
    font-family: ${ROBOOST_UI_THEME.fontMono};
    font-variant-numeric: tabular-nums;
    text-align: right;
  }
`;

const StyledHeadInner = styled.span`
  align-items: center;
  display: inline-flex;
  gap: 4px;
`;

const StyledSortIcon = styled.span<{ isActive: boolean }>`
  color: ${({ isActive }) =>
    isActive ? ROBOOST_UI_THEME.accent : ROBOOST_UI_THEME.textDisabled};
  display: inline-flex;
`;

const StyledAvatarCell = styled.span`
  align-items: center;
  display: flex;
  flex-wrap: nowrap;
  gap: 8px;
`;

const StyledFoot = styled.div`
  align-items: center;
  background: ${ROBOOST_UI_THEME.surface};
  border-top: 1px solid ${ROBOOST_UI_THEME.border};
  color: ${ROBOOST_UI_THEME.textSecondary};
  display: flex;
  flex: none;
  font-size: 13px;
  gap: 12px;
  justify-content: space-between;
  padding: 8px 12px;
`;

const StyledFootRight = styled.div`
  align-items: center;
  display: inline-flex;
  gap: 16px;
`;

const StyledPageSize = styled.label`
  align-items: center;
  display: inline-flex;
  gap: 6px;

  select {
    background: ${ROBOOST_UI_THEME.surface};
    border: 1px solid ${ROBOOST_UI_THEME.borderStrong};
    border-radius: ${ROBOOST_UI_THEME.radiusSm};
    color: ${ROBOOST_UI_THEME.text};
    font-family: ${ROBOOST_UI_THEME.fontSans};
    font-size: 13px;
    height: 28px;
    padding: 0 6px;
  }
`;

const StyledPager = styled.div`
  align-items: center;
  display: inline-flex;
  gap: 4px;
`;

const StyledPagerButton = styled.button`
  align-items: center;
  background: ${ROBOOST_UI_THEME.surface};
  border: 1px solid ${ROBOOST_UI_THEME.borderStrong};
  border-radius: ${ROBOOST_UI_THEME.radiusSm};
  color: ${ROBOOST_UI_THEME.textSecondary};
  cursor: pointer;
  display: inline-flex;
  height: 28px;
  justify-content: center;
  padding: 0;
  width: 28px;

  &:hover:not(:disabled) {
    background: ${ROBOOST_UI_THEME.surfaceHover};
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.45;
  }
`;

const StyledPageButton = styled.button`
  align-items: center;
  background: ${ROBOOST_UI_THEME.surface};
  border: 1px solid ${ROBOOST_UI_THEME.borderStrong};
  border-radius: ${ROBOOST_UI_THEME.radiusSm};
  color: ${ROBOOST_UI_THEME.text};
  cursor: pointer;
  display: inline-flex;
  font-family: ${ROBOOST_UI_THEME.fontSans};
  font-size: 13px;
  font-weight: 500;
  height: 28px;
  justify-content: center;
  min-width: 28px;
  padding: 0 6px;

  &:hover {
    background: ${ROBOOST_UI_THEME.surfaceHover};
  }

  &[aria-current='true'] {
    background: ${ROBOOST_UI_THEME.accent};
    border-color: ${ROBOOST_UI_THEME.accent};
    color: ${ROBOOST_UI_THEME.textOnAccent};
  }
`;

const StyledGap = styled.span`
  color: ${ROBOOST_UI_THEME.textMuted};
  padding: 0 2px;
`;

const StyledEmpty = styled.div`
  color: ${ROBOOST_UI_THEME.textMuted};
  font-size: 13px;
  padding: 32px 16px;
  text-align: center;
`;

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
      <StyledAvatarCell>
        <Avatar name={value.name} src={value.src} size="sm" tone={value.tone} />
        <span className="roboost-td-strong">{value.name}</span>
      </StyledAvatarCell>
    ) : null;
  }

  return value as ReactNode;
};

const getCellClassName = (column: Column, stickyClassNames: string[]) =>
  [
    column.type === 'strong' ? 'roboost-td-strong' : '',
    column.type === 'mono' ? 'roboost-td-mono' : '',
    column.type === 'num' ? 'roboost-td-num' : '',
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
        ? ['roboost-sticky-second', 'roboost-sticky-shadow']
        : ['roboost-sticky', 'roboost-sticky-shadow'];
    }

    return [];
  };

  const currentPage = page?.current ?? 1;
  const pageCount = page?.pages ?? 1;

  return (
    <StyledWrap className={className}>
      <StyledScroll style={maxHeight !== undefined ? { maxHeight } : undefined}>
        <StyledTable>
          <thead>
            <tr>
              {selectable && (
                <th
                  className={`roboost-col-check ${stickyFirst ? 'roboost-sticky' : ''}`}
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
                    <StyledHeadInner>
                      <span>{column.label}</span>
                      {column.sortable === true && (
                        <StyledSortIcon isActive={isActive}>
                          <Icon name="sort" size={16} />
                        </StyledSortIcon>
                      )}
                    </StyledHeadInner>
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
                      className={`roboost-col-check ${stickyFirst ? 'roboost-sticky' : ''}`}
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
        </StyledTable>
        {rows.length === 0 && emptyState !== undefined && (
          <StyledEmpty>{emptyState}</StyledEmpty>
        )}
      </StyledScroll>
      {page !== undefined && (
        <StyledFoot>
          <span>
            {isSomeSelected
              ? t`${currentSelectedIds.length} selected`
              : `${page.from ?? 1}–${page.to ?? rows.length} ${t`of`} ${page.count ?? rows.length}`}
          </span>
          <StyledFootRight>
            {page.pageSizeOptions !== undefined &&
              onPageSizeChange !== undefined && (
                <StyledPageSize>
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
                </StyledPageSize>
              )}
            <StyledPager>
              <StyledPagerButton
                type="button"
                disabled={currentPage <= 1}
                aria-label={t`Previous page`}
                onClick={() => onPageChange?.(currentPage - 1)}
              >
                <Icon name="chevron-left" size={16} />
              </StyledPagerButton>
              {getPageNumbers(currentPage, pageCount).map((item) =>
                typeof item === 'number' ? (
                  <StyledPageButton
                    key={item}
                    type="button"
                    aria-current={item === currentPage}
                    onClick={() => onPageChange?.(item)}
                  >
                    {item}
                  </StyledPageButton>
                ) : (
                  <StyledGap key={item}>…</StyledGap>
                ),
              )}
              <StyledPagerButton
                type="button"
                disabled={currentPage >= pageCount}
                aria-label={t`Next page`}
                onClick={() => onPageChange?.(currentPage + 1)}
              >
                <Icon name="chevron-right" size={16} />
              </StyledPagerButton>
            </StyledPager>
          </StyledFootRight>
        </StyledFoot>
      )}
    </StyledWrap>
  );
};
