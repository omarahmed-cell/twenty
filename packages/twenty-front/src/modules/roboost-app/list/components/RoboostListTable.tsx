import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import {
  getRoboostLabelIdentifierFieldName,
  getRoboostRecordLabel,
} from '@/roboost-app/fields/getRoboostRecordLabel';
import { RoboostAddColumnPopover } from '@/roboost-app/list/components/RoboostAddColumnPopover';
import { RoboostColumnHeaderMenu } from '@/roboost-app/list/components/RoboostColumnHeaderMenu';
import { RoboostListEditableCell } from '@/roboost-app/list/components/RoboostListEditableCell';
import { type RoboostListColumn } from '@/roboost-app/list/hooks/useRoboostViewColumns';
import { getRoboostColumnMinWidth } from '@/roboost-app/list/utils/getRoboostColumnMinWidth';
import { getRoboostAvatarTone } from '@/roboost-app/utils/getRoboostAvatarTone';
import { Avatar } from '@/roboost-ui/components/Avatar';
import { Checkbox } from '@/roboost-ui/components/Checkbox';
import { Icon } from '@/roboost-ui/components/Icon';
import { cx } from '@/roboost-ui/utils/cx';
import { useLingui } from '@lingui/react/macro';
import { isString } from '@sniptt/guards';
import {
  type CSSProperties,
  memo,
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Link } from 'react-router-dom';
import { AppPath } from 'twenty-shared/types';
import { getAppPath } from 'twenty-shared/utils';
import { FieldMetadataType } from '~/generated-metadata/graphql';

const CHECK_COLUMN_WIDTH = 44;

export type RoboostListSort = { fieldName: string; direction: 'asc' | 'desc' };

type RoboostListRecord = Record<string, unknown> & { id: string };

type RoboostListTableProps = {
  objectMetadataItem: EnrichedObjectMetadataItem;
  objectMetadataItems: EnrichedObjectMetadataItem[];
  columns: RoboostListColumn[];
  records: RoboostListRecord[];
  frozenCount: number;
  sort: RoboostListSort | null;
  onSort: (sort: RoboostListSort) => void;
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onMoveColumn: (fromIndex: number, toIndex: number) => void;
  onResizeColumn: (fieldId: string, size: number) => void;
  onToggleColumn: (fieldId: string) => void;
  onFrozenCountChange: (frozenCount: number) => void;
  onAddColumnAt: (fieldId: string, index: number) => void;
  onSaved?: () => void;
  isLoading: boolean;
};

const isSortable = (type: string) =>
  type !== FieldMetadataType.RELATION &&
  type !== FieldMetadataType.MULTI_SELECT &&
  type !== FieldMetadataType.RICH_TEXT &&
  type !== FieldMetadataType.ACTOR;

export const RoboostListTable = ({
  objectMetadataItem,
  objectMetadataItems,
  columns,
  records,
  frozenCount,
  sort,
  onSort,
  selectedIds,
  onSelectionChange,
  onMoveColumn,
  onResizeColumn,
  onToggleColumn,
  onFrozenCountChange,
  onAddColumnAt,
  onSaved,
  isLoading,
}: RoboostListTableProps) => {
  const { t } = useLingui();
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const tableRef = useRef<HTMLTableElement>(null);

  // While dragging, widths move through CSS variables on the table (no re-render);
  // the final width lands in the view's unsaved changes on release
  const startResize = (
    event: ReactPointerEvent<HTMLSpanElement>,
    column: RoboostListColumn,
    columnIndex: number,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    const table = tableRef.current;
    const startX = event.clientX;
    const startSize = columnWidths[columnIndex];
    const minSize = getRoboostColumnMinWidth(column.field.label);
    let latestSize = startSize;

    const move = (moveEvent: PointerEvent) => {
      latestSize = Math.max(
        minSize,
        Math.round(startSize + moveEvent.clientX - startX),
      );
      table?.style.setProperty(`--rb-cw-${columnIndex}`, `${latestSize}px`);
      let left = CHECK_COLUMN_WIDTH;

      for (let index = 0; index < frozenCount; index++) {
        if (index > columnIndex) {
          table?.style.setProperty(`--rb-cl-${index}`, `${left}px`);
        }
        left += index === columnIndex ? latestSize : columnWidths[index];
      }
    };
    const stop = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', stop);
      if (latestSize !== startSize) {
        onResizeColumn(column.field.id, latestSize);
      }
      requestAnimationFrame(() => {
        table?.style.removeProperty(`--rb-cw-${columnIndex}`);
        for (let index = 0; index < frozenCount; index++) {
          table?.style.removeProperty(`--rb-cl-${index}`);
        }
      });
    };

    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', stop);
  };
  const labelFieldName = getRoboostLabelIdentifierFieldName(objectMetadataItem);

  const recordIds = records.map((record) => record.id);
  const isAllSelected =
    recordIds.length > 0 && recordIds.every((id) => selectedIds.includes(id));
  const isSomeSelected = recordIds.some((id) => selectedIds.includes(id));

  const columnWidths = useMemo(
    () =>
      columns.map((column) =>
        Math.max(getRoboostColumnMinWidth(column.field.label), column.size),
      ),
    [columns],
  );

  const columnStyles = useMemo(() => {
    let left = CHECK_COLUMN_WIDTH;

    return columnWidths.map((width, columnIndex): CSSProperties => {
      const widthValue = `var(--rb-cw-${columnIndex}, ${width}px)`;
      const style: CSSProperties = {
        width: widthValue,
        minWidth: widthValue,
        maxWidth: widthValue,
      };

      if (columnIndex < frozenCount) {
        style.left = `var(--rb-cl-${columnIndex}, ${left}px)`;
      }
      left += width;

      return style;
    });
  }, [columnWidths, frozenCount]);

  // Rows stay memoized while cells change; a selection change re-renders only the row elements, not the cells
  const toggleRow = useCallback(
    (id: string) =>
      onSelectionChange(
        selectedIds.includes(id)
          ? selectedIds.filter((selectedId) => selectedId !== id)
          : [...selectedIds, id],
      ),
    [selectedIds, onSelectionChange],
  );

  return (
    <div className="rb-ls-tablewrap">
      <table ref={tableRef} className="rb-ltable">
        <thead>
          <tr>
            <th className="rb-lt-check">
              <Checkbox
                aria-label={t`Select all rows`}
                checked={isAllSelected}
                indeterminate={!isAllSelected && isSomeSelected}
                onChange={() =>
                  onSelectionChange(
                    isAllSelected
                      ? selectedIds.filter((id) => !recordIds.includes(id))
                      : [...new Set([...selectedIds, ...recordIds])],
                  )
                }
              />
            </th>
            {columns.map((column, columnIndex) => {
              const isActiveSort = sort?.fieldName === column.field.name;
              const canDrag = columnIndex > 0;

              return (
                <th
                  key={column.field.id}
                  className={cx(
                    columnIndex < frozenCount && 'rb-lt-sticky',
                    columnIndex === frozenCount - 1 && 'rb-lt-sticky-edge',
                    dropIndex === columnIndex && 'is-drop-target',
                  )}
                  style={columnStyles[columnIndex]}
                  draggable={canDrag}
                  aria-sort={
                    isActiveSort
                      ? sort?.direction === 'asc'
                        ? 'ascending'
                        : 'descending'
                      : undefined
                  }
                  onDragStart={() => setDraggedIndex(columnIndex)}
                  onDragOver={(event) => {
                    if (draggedIndex !== null && columnIndex > 0) {
                      event.preventDefault();
                      setDropIndex(columnIndex);
                    }
                  }}
                  onDragEnd={() => {
                    setDraggedIndex(null);
                    setDropIndex(null);
                  }}
                  onDrop={() => {
                    if (draggedIndex !== null && draggedIndex !== columnIndex) {
                      onMoveColumn(draggedIndex, columnIndex);
                    }
                    setDraggedIndex(null);
                    setDropIndex(null);
                  }}
                  onClick={() => {
                    if (isSortable(column.field.type)) {
                      onSort({
                        fieldName: column.field.name,
                        direction:
                          isActiveSort && sort?.direction === 'asc'
                            ? 'desc'
                            : 'asc',
                      });
                    }
                  }}
                >
                  <span className="rb-lth">
                    <span className="rb-lth-text">{column.field.label}</span>
                    {isActiveSort && (
                      <span className="rb-sorti">
                        <Icon
                          name={
                            sort?.direction === 'asc'
                              ? 'arrow-up'
                              : 'arrow-down'
                          }
                          size={13}
                        />
                      </span>
                    )}
                    {canDrag && (
                      <span className="rb-dh">
                        <Icon name="grip" size={14} strokeWidth={3} />
                      </span>
                    )}
                  </span>
                  <RoboostColumnHeaderMenu
                    objectMetadataItem={objectMetadataItem}
                    columnLabel={column.field.label}
                    shownFieldIds={columns.map((shown) => shown.field.id)}
                    isFrozen={columnIndex < frozenCount}
                    canRemove={columnIndex > 0}
                    onFreeze={() => onFrozenCountChange(columnIndex + 1)}
                    onUnfreeze={() => onFrozenCountChange(columnIndex)}
                    onAddColumnRight={(fieldId) =>
                      onAddColumnAt(fieldId, columnIndex + 1)
                    }
                    onRemove={() => onToggleColumn(column.field.id)}
                  />
                  <span
                    className="rb-col-resize"
                    role="separator"
                    aria-orientation="vertical"
                    aria-label={t`Resize ${column.field.label}`}
                    draggable={false}
                    onClick={(event) => event.stopPropagation()}
                    onDragStart={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                    }}
                    onPointerDown={(event) =>
                      startResize(event, column, columnIndex)
                    }
                  />
                </th>
              );
            })}
            <th className="rb-lt-add">
              <RoboostAddColumnPopover
                objectMetadataItem={objectMetadataItem}
                selectedFieldIds={columns.map((column) => column.field.id)}
                onToggle={onToggleColumn}
              />
            </th>
          </tr>
        </thead>
        <tbody>
          {records.map((record) => (
            <RoboostListRow
              key={record.id}
              record={record}
              columns={columns}
              columnStyles={columnStyles}
              frozenCount={frozenCount}
              labelFieldName={labelFieldName}
              objectMetadataItem={objectMetadataItem}
              objectMetadataItems={objectMetadataItems}
              isSelected={selectedIds.includes(record.id)}
              onToggle={toggleRow}
              onSaved={onSaved}
            />
          ))}
        </tbody>
      </table>
      {records.length === 0 && (
        <div className="rb-ls-empty">
          {isLoading
            ? t`Loading…`
            : t`No ${objectMetadataItem.labelPlural.toLowerCase()} match this view and filters.`}
        </div>
      )}
    </div>
  );
};

type RoboostListRowProps = {
  record: RoboostListRecord;
  columns: RoboostListColumn[];
  columnStyles: CSSProperties[];
  frozenCount: number;
  labelFieldName: string | undefined;
  objectMetadataItem: EnrichedObjectMetadataItem;
  objectMetadataItems: EnrichedObjectMetadataItem[];
  isSelected: boolean;
  onToggle: (id: string) => void;
  onSaved?: () => void;
};

const RoboostListRow = memo(
  ({
    record,
    columns,
    columnStyles,
    frozenCount,
    labelFieldName,
    objectMetadataItem,
    objectMetadataItems,
    isSelected,
    onToggle,
    onSaved,
  }: RoboostListRowProps) => {
    const { t } = useLingui();
    const recordPath = getAppPath(AppPath.RecordShowPage, {
      objectNameSingular: objectMetadataItem.nameSingular,
      objectRecordId: record.id,
    });
    const label = getRoboostRecordLabel(record, objectMetadataItem);

    return (
      <tr aria-selected={isSelected}>
        <td className="rb-lt-check">
          <Checkbox
            aria-label={t`Select row`}
            checked={isSelected}
            onChange={() => onToggle(record.id)}
          />
        </td>
        {columns.map((column, columnIndex) => (
          <td
            key={column.field.id}
            className={cx(
              columnIndex < frozenCount && 'rb-lt-sticky',
              columnIndex === frozenCount - 1 && 'rb-lt-sticky-edge',
            )}
            style={columnStyles[columnIndex]}
          >
            {column.field.name === labelFieldName ? (
              <Link className="rb-lcompany" to={recordPath}>
                <Avatar
                  name={label}
                  src={isString(record.avatarUrl) ? record.avatarUrl : null}
                  size="sm"
                  tone={getRoboostAvatarTone(label)}
                />
                <span className="rb-truncate">
                  {label === '' ? t`Untitled` : label}
                </span>
              </Link>
            ) : (
              <RoboostListEditableCell
                field={column.field}
                record={record}
                objectMetadataItem={objectMetadataItem}
                objectMetadataItems={objectMetadataItems}
                onSaved={onSaved}
              />
            )}
          </td>
        ))}
        <td className="rb-lt-add" />
      </tr>
    );
  },
);
