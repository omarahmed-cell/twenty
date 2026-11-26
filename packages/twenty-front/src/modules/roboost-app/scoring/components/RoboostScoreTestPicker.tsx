import { useObjectMetadataItem } from '@/object-metadata/hooks/useObjectMetadataItem';
import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { getRoboostRecordLabel } from '@/roboost-app/fields/getRoboostRecordLabel';
import { FloatingPanel } from '@/roboost-ui/components/FloatingPanel';
import { MenuSearch } from '@/roboost-ui/components/MenuSearch';
import { cx } from '@/roboost-ui/utils/cx';
import { useLingui } from '@lingui/react/macro';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import {
  type RecordGqlFields,
  type RecordGqlOperationFilter,
} from 'twenty-shared/types';
import {
  formatRoboostCurrencyValue,
  isDefined,
  type RoboostScoreObjectName,
} from 'twenty-shared/utils';
import { useDebounce } from 'use-debounce';

type PickedRecord = Record<string, unknown> & {
  id: string;
  __typename: string;
};

export type RoboostScoreTestRecord = { id: string; label: string };

type RoboostScoreTestPickerProps = {
  objectName: RoboostScoreObjectName;
  trigger: (props: {
    ref: (element: HTMLElement | null) => void;
    toggle: () => void;
    isOpen: boolean;
  }) => ReactNode;
  onPick: (record: RoboostScoreTestRecord) => void;
};

const FIELDS_BY_OBJECT: Record<RoboostScoreObjectName, RecordGqlFields> = {
  opportunity: {
    id: true,
    name: true,
    stage: true,
    dealAmount: true,
    currency: true,
  },
  company: { id: true, name: true, domainName: true },
  person: { id: true, name: true, emails: true },
};

const searchFilter = (
  objectName: RoboostScoreObjectName,
  term: string,
): RecordGqlOperationFilter | undefined => {
  if (term === '') {
    return undefined;
  }
  const pattern = `%${term}%`;

  return objectName === 'person'
    ? {
        or: [
          { name: { firstName: { ilike: pattern } } },
          { name: { lastName: { ilike: pattern } } },
          { emails: { primaryEmail: { ilike: pattern } } },
        ],
      }
    : { name: { ilike: pattern } };
};

// Name plus the fields that tell records apart: stage and amount for deals
const describe = (
  objectName: RoboostScoreObjectName,
  record: PickedRecord,
  objectMetadataItem: EnrichedObjectMetadataItem,
) => {
  if (objectName === 'opportunity') {
    const stageField = objectMetadataItem.fields.find(
      (field) => field.name === 'stage',
    );
    const stage =
      stageField?.options?.find((option) => option.value === record.stage)
        ?.label ?? '';
    const amountText = isDefined(record.dealAmount)
      ? formatRoboostCurrencyValue(
          Number(record.dealAmount),
          (record.currency as string | null | undefined) ?? null,
        )
      : '';

    return [stage, amountText].filter((part) => part !== '').join(' · ');
  }
  if (objectName === 'person') {
    return (
      (record.emails as { primaryEmail?: string } | undefined)?.primaryEmail ??
      ''
    );
  }

  return (
    (record.domainName as { primaryLinkUrl?: string } | undefined)
      ?.primaryLinkUrl ?? ''
  );
};

export const RoboostScoreTestPicker = ({
  objectName,
  trigger,
  onPick,
}: RoboostScoreTestPickerProps) => {
  const { t } = useLingui();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebounce(search.trim(), 250);
  const panelRef = useRef<HTMLDivElement>(null);
  const { objectMetadataItem } = useObjectMetadataItem({
    objectNameSingular: objectName,
  });
  const { records, loading } = useFindManyRecords<PickedRecord>({
    objectNameSingular: objectName,
    recordGqlFields: FIELDS_BY_OBJECT[objectName],
    filter: searchFilter(objectName, debouncedSearch),
    orderBy: [{ updatedAt: 'DescNullsLast' }],
    limit: 30,
    skip: !isOpen,
  });

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const closeOnOutsidePointer = (event: PointerEvent) => {
      const target = event.target;

      if (
        target instanceof Node &&
        (panelRef.current?.contains(target) === true ||
          anchor?.contains(target) === true)
      ) {
        return;
      }
      setIsOpen(false);
    };

    document.addEventListener('pointerdown', closeOnOutsidePointer, true);

    return () =>
      document.removeEventListener('pointerdown', closeOnOutsidePointer, true);
  }, [anchor, isOpen]);

  return (
    <>
      {trigger({
        ref: setAnchor,
        isOpen,
        toggle: () => setIsOpen(!isOpen),
      })}
      {isOpen && (
        <FloatingPanel
          anchor={anchor}
          panelRef={panelRef}
          align="end"
          minWidth={340}
          className="rb-menu rb-menu-portal rb-sct-picker"
          role="listbox"
          aria-label={t`Pick a record to test`}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              setIsOpen(false);
            }
          }}
        >
          <MenuSearch
            value={search}
            placeholder={t`Search by name`}
            onChange={setSearch}
          />
          <div className="rb-menu-list">
            {records.map((record) => {
              const label =
                getRoboostRecordLabel(
                  record,
                  objectMetadataItem as EnrichedObjectMetadataItem,
                ) || t`Untitled`;
              const description = describe(
                objectName,
                record,
                objectMetadataItem as EnrichedObjectMetadataItem,
              );

              return (
                <div
                  key={record.id}
                  role="option"
                  aria-selected={false}
                  className={cx('rb-menu-item rb-sct-option')}
                  onClick={() => {
                    setIsOpen(false);
                    onPick({ id: record.id, label });
                  }}
                >
                  <span className="rb-menu-label">{label}</span>
                  {description !== '' && (
                    <span className="rb-sct-desc">{description}</span>
                  )}
                </div>
              );
            })}
            {records.length === 0 && (
              <div className="rb-menu-empty">
                {loading ? t`Loading` : t`No matches`}
              </div>
            )}
          </div>
        </FloatingPanel>
      )}
    </>
  );
};
