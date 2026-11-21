import { useObjectMetadataItems } from '@/object-metadata/hooks/useObjectMetadataItems';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import {
  getRoboostLabelIdentifierFieldName,
  getRoboostRecordLabel,
} from '@/roboost-app/fields/getRoboostRecordLabel';
import { Avatar } from '@/roboost-ui/components/Avatar';
import { Icon } from '@/roboost-ui/components/Icon';
import { useLingui } from '@lingui/react/macro';
import { isNonEmptyString } from '@sniptt/guards';
import { type FocusEvent, useState } from 'react';
import { type RecordGqlOperationFilter } from 'twenty-shared/types';
import { FieldMetadataType } from '~/generated-metadata/graphql';
import { useDebounce } from 'use-debounce';

type RoboostRecordPickerProps = {
  objectNameSingular: string;
  selectedLabel: string;
  placeholder?: string;
  onSelect: (record: { id: string; label: string } | null) => void;
  isClearable?: boolean;
  isDisabled?: boolean;
};

export const RoboostRecordPicker = ({
  objectNameSingular,
  selectedLabel,
  placeholder,
  onSelect,
  isClearable = true,
  isDisabled = false,
}: RoboostRecordPickerProps) => {
  const { t } = useLingui();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebounce(search, 250);
  const { objectMetadataItems } = useObjectMetadataItems();

  const objectMetadataItem = objectMetadataItems.find(
    (item) => item.nameSingular === objectNameSingular,
  );
  const labelFieldName = getRoboostLabelIdentifierFieldName(objectMetadataItem);
  const labelField = objectMetadataItem?.fields.find(
    (field) => field.name === labelFieldName,
  );
  const term = `%${debouncedSearch.trim()}%`;

  const filter: RecordGqlOperationFilter | undefined = isNonEmptyString(
    debouncedSearch.trim(),
  )
    ? labelField?.type === FieldMetadataType.FULL_NAME
      ? {
          or: [
            { [labelFieldName]: { firstName: { ilike: term } } },
            { [labelFieldName]: { lastName: { ilike: term } } },
          ],
        }
      : { [labelFieldName]: { ilike: term } }
    : undefined;

  const { records, loading } = useFindManyRecords({
    objectNameSingular,
    filter,
    limit: 20,
    skip: !isOpen,
  });

  return (
    <div
      className="rb-select rb-picker"
      onBlur={(event: FocusEvent<HTMLDivElement>) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setIsOpen(false);
        }
      }}
    >
      <button
        type="button"
        className={`rb-select-trigger ${isNonEmptyString(selectedLabel) ? '' : 'is-placeholder'}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        disabled={isDisabled}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="rb-truncate">
          {isNonEmptyString(selectedLabel)
            ? selectedLabel
            : (placeholder ?? t`Select…`)}
        </span>
        <Icon name="caret" className="rb-caret" size={16} />
      </button>
      {isOpen && (
        <div
          className="rb-menu rb-picker-menu"
          role="listbox"
          tabIndex={-1}
          onMouseDown={(event) => {
            if (!(event.target instanceof HTMLInputElement)) {
              event.preventDefault();
            }
          }}
        >
          <div className="rb-picker-search">
            <input
              className="rb-input rb-input-sm"
              value={search}
              placeholder={t`Search`}
              aria-label={t`Search`}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          {isClearable && isNonEmptyString(selectedLabel) && (
            <button
              type="button"
              className="rb-menu-item"
              onClick={() => {
                onSelect(null);
                setIsOpen(false);
              }}
            >
              <Icon name="x" size={16} />
              <span className="rb-menu-label">{t`Clear`}</span>
            </button>
          )}
          {records.map((record) => {
            const label = getRoboostRecordLabel(record, objectMetadataItem);

            return (
              <button
                key={record.id}
                type="button"
                className="rb-menu-item"
                role="option"
                aria-selected={label === selectedLabel}
                onClick={() => {
                  onSelect({ id: record.id, label });
                  setIsOpen(false);
                }}
              >
                <Avatar
                  name={label}
                  src={(record.avatarUrl as string | undefined) ?? null}
                  size="xs"
                />
                <span className="rb-menu-label">{label}</span>
              </button>
            );
          })}
          {!loading && records.length === 0 && (
            <div className="rb-menu-heading" style={{ textTransform: 'none' }}>
              {t`No matches`}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
