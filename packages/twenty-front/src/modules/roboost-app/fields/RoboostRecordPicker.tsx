import { useObjectMetadataItems } from '@/object-metadata/hooks/useObjectMetadataItems';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import {
  getRoboostLabelIdentifierFieldName,
  getRoboostRecordLabel,
} from '@/roboost-app/fields/getRoboostRecordLabel';
import { Avatar } from '@/roboost-ui/components/Avatar';
import { Icon } from '@/roboost-ui/components/Icon';
import { MenuSearch } from '@/roboost-ui/components/MenuSearch';
import { FloatingPanel } from '@/roboost-ui/components/FloatingPanel';
import { useLingui } from '@lingui/react/macro';
import { isNonEmptyString, isString } from '@sniptt/guards';
import { type FocusEvent, useEffect, useRef, useState } from 'react';
import { type RecordGqlOperationFilter } from 'twenty-shared/types';
import { FieldMetadataType } from '~/generated-metadata/graphql';
import { useDebounce } from 'use-debounce';

const PICKER_MIN_WIDTH = 240;
// Inside a record field or table cell the list hangs under the whole field, never over its label
const FIELD_CONTAINER_SELECTOR = '.rb-prop, td';

type RoboostRecordPickerProps = {
  objectNameSingular: string;
  selectedLabel: string;
  placeholder?: string;
  onSelect: (record: { id: string; label: string } | null) => void;
  isClearable?: boolean;
  isDisabled?: boolean;
  autoOpen?: boolean;
  // Extra choices listed above the records, such as teams in a people picker
  leadingOptions?: { id: string; label: string }[];
};

const getRecordSubtitle = (record: Record<string, unknown>) => {
  const emails = record.emails as { primaryEmail?: string } | null | undefined;

  if (isNonEmptyString(emails?.primaryEmail)) {
    return emails.primaryEmail;
  }

  return isString(record.userEmail) && record.userEmail !== ''
    ? record.userEmail
    : undefined;
};

export const RoboostRecordPicker = ({
  objectNameSingular,
  selectedLabel,
  placeholder,
  onSelect,
  isClearable = true,
  isDisabled = false,
  autoOpen = false,
  leadingOptions = [],
}: RoboostRecordPickerProps) => {
  const { t } = useLingui();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const anchorRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const open = () => {
    setSearch('');
    setIsOpen(true);
  };

  // Positioning needs the trigger's rendered rect, so the first open waits for mount
  useEffect(() => {
    if (autoOpen && !isDisabled) {
      open();
    }
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, []);
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
      ref={anchorRef}
      className="rb-select rb-picker"
      onBlur={(event: FocusEvent<HTMLDivElement>) => {
        if (
          !event.currentTarget.contains(event.relatedTarget) &&
          menuRef.current?.contains(event.relatedTarget) !== true
        ) {
          setIsOpen(false);
        }
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
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
        onClick={() => (isOpen ? setIsOpen(false) : open())}
      >
        <span className="rb-truncate">
          {isNonEmptyString(selectedLabel)
            ? selectedLabel
            : (placeholder ?? t`Select…`)}
        </span>
        <Icon name="caret" className="rb-caret" size={16} />
      </button>
      {isOpen && (
        <FloatingPanel
          anchor={
            anchorRef.current?.closest<HTMLElement>(FIELD_CONTAINER_SELECTOR) ??
            anchorRef.current
          }
          panelRef={menuRef}
          matchAnchorWidth
          minWidth={PICKER_MIN_WIDTH}
          onAnchorHidden={() => setIsOpen(false)}
          className="rb-menu rb-menu-portal rb-picker-menu"
          role="listbox"
          tabIndex={-1}
          onMouseDown={(event) => {
            if (!(event.target instanceof HTMLInputElement)) {
              event.preventDefault();
            }
          }}
          onBlur={(event) => {
            if (
              !event.currentTarget.contains(event.relatedTarget) &&
              anchorRef.current?.contains(event.relatedTarget) !== true
            ) {
              setIsOpen(false);
            }
          }}
        >
          <MenuSearch value={search} onChange={setSearch} />
          <div className="rb-menu-list">
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
            {leadingOptions
              .filter((option) =>
                option.label
                  .toLowerCase()
                  .includes(debouncedSearch.trim().toLowerCase()),
              )
              .map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className="rb-menu-item"
                  role="option"
                  aria-selected={option.label === selectedLabel}
                  onClick={() => {
                    onSelect(option);
                    setIsOpen(false);
                  }}
                >
                  <Icon name="contacts" size={16} />
                  <span className="rb-menu-label">{option.label}</span>
                </button>
              ))}
            {records.map((record) => {
              const label = getRoboostRecordLabel(record, objectMetadataItem);
              const subtitle = getRecordSubtitle(record);

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
                  {subtitle !== undefined ? (
                    <span className="rb-menu-label rb-menu-two-line">
                      <span className="rb-menu-label-main">{label}</span>
                      <span className="rb-menu-label-sub">{subtitle}</span>
                    </span>
                  ) : (
                    <span className="rb-menu-label">{label}</span>
                  )}
                </button>
              );
            })}
            {!loading && records.length === 0 && (
              <div className="rb-menu-empty">{t`No matches`}</div>
            )}
          </div>
        </FloatingPanel>
      )}
    </div>
  );
};
