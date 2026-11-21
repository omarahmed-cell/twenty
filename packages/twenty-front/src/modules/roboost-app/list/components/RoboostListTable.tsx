import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import {
  getRoboostLabelIdentifierFieldName,
  getRoboostRecordLabel,
} from '@/roboost-app/fields/getRoboostRecordLabel';
import { RoboostAddColumnPopover } from '@/roboost-app/list/components/RoboostAddColumnPopover';
import { RoboostListEditableCell } from '@/roboost-app/list/components/RoboostListEditableCell';
import { type RoboostListColumn } from '@/roboost-app/list/hooks/useRoboostViewColumns';
import { getRoboostAvatarTone } from '@/roboost-app/utils/getRoboostAvatarTone';
import { Avatar } from '@/roboost-ui/components/Avatar';
import { Checkbox } from '@/roboost-ui/components/Checkbox';
import { Icon } from '@/roboost-ui/components/Icon';
import { cx } from '@/roboost-ui/utils/cx';
import { useLingui } from '@lingui/react/macro';
import { isString } from '@sniptt/guards';
import { type CSSProperties, useState } from 'react';
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
  onToggleColumn: (fieldId: string) => void;
  onSaved: () => void;
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
  onToggleColumn,
  onSaved,
  isLoading,
}: RoboostListTableProps) => {
  const { t } = useLingui();
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const labelFieldName = getRoboostLabelIdentifierFieldName(objectMetadataItem);

  const recordIds = records.map((record) => record.id);
  const isAllSelected =
    recordIds.length > 0 && recordIds.every((id) => selectedIds.includes(id));
  const isSomeSelected = recordIds.some((id) => selectedIds.includes(id));

  const getStickyStyle = (columnIndex: number): CSSProperties | undefined => {
    if (columnIndex >= frozenCount) {
      return { minWidth: columns[columnIndex].size };
    }
    const left =
      CHECK_COLUMN_WIDTH +
      columns
        .slice(0, columnIndex)
        .reduce((sum, column) => sum + column.size, 0);

    return { left, minWidth: columns[columnIndex].size };
  };

  const toggleRow = (id: string) =>
    onSelectionChange(
      selectedIds.includes(id)
        ? selectedIds.filter((selectedId) => selectedId !== id)
        : [...selectedIds, id],
    );

  return (
    <div className="rb-ls-tablewrap">
      <table className="rb-ltable">
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
                  style={getStickyStyle(columnIndex)}
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
                    {columnIndex === 0 && column.field.name === labelFieldName
                      ? `${column.field.label}`
                      : column.field.label}
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
          {records.map((record) => {
            const isSelected = selectedIds.includes(record.id);
            const recordPath = getAppPath(AppPath.RecordShowPage, {
              objectNameSingular: objectMetadataItem.nameSingular,
              objectRecordId: record.id,
            });

            return (
              <tr key={record.id} aria-selected={isSelected}>
                <td className="rb-lt-check">
                  <Checkbox
                    aria-label={t`Select row`}
                    checked={isSelected}
                    onChange={() => toggleRow(record.id)}
                  />
                </td>
                {columns.map((column, columnIndex) => {
                  const isLabelColumn = column.field.name === labelFieldName;
                  const label = getRoboostRecordLabel(
                    record,
                    objectMetadataItem,
                  );

                  return (
                    <td
                      key={column.field.id}
                      className={cx(
                        columnIndex < frozenCount && 'rb-lt-sticky',
                        columnIndex === frozenCount - 1 && 'rb-lt-sticky-edge',
                      )}
                      style={getStickyStyle(columnIndex)}
                    >
                      {isLabelColumn ? (
                        <Link className="rb-lcompany" to={recordPath}>
                          <Avatar
                            name={label}
                            src={
                              isString(record.avatarUrl)
                                ? record.avatarUrl
                                : null
                            }
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
                  );
                })}
                <td className="rb-lt-add" />
              </tr>
            );
          })}
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
