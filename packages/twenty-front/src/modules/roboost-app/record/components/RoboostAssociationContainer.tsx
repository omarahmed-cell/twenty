import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { useUpdateOneRecord } from '@/object-record/hooks/useUpdateOneRecord';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import {
  getRoboostLabelIdentifierFieldName,
  getRoboostRecordLabel,
} from '@/roboost-app/fields/getRoboostRecordLabel';
import { RoboostRecordPicker } from '@/roboost-app/fields/RoboostRecordPicker';
import { useOpenRoboostCreatePanel } from '@/roboost-app/hooks/useOpenRoboostCreatePanel';
import { getRoboostListRecordGqlFields } from '@/roboost-app/list/utils/getRoboostListRecordGqlFields';
import {
  getRoboostAssociationCardFields,
  RoboostAssociationCard,
} from '@/roboost-app/record/components/RoboostAssociationCards';
import { RoboostRecordContainer } from '@/roboost-app/record/components/RoboostRecordContainer';
import { type RoboostAssociation } from '@/roboost-app/record/utils/getRoboostAssociations';
import { Button } from '@/roboost-ui/components/Button';
import { Icon } from '@/roboost-ui/components/Icon';
import { Input } from '@/roboost-ui/components/Input';
import { Menu, type MenuEntry } from '@/roboost-ui/components/Menu';
import { cx } from '@/roboost-ui/utils/cx';
import { useLingui } from '@lingui/react/macro';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { AppPath, type RecordGqlFields } from 'twenty-shared/types';
import { getAppPath, isDefined } from 'twenty-shared/utils';

const ASSOCIATION_LIMIT = 100;

type RoboostAssociationSort = 'newest' | 'oldest' | 'name';

type RoboostAssociationContainerProps = {
  association: Extract<RoboostAssociation, { kind: 'many' | 'one' }>;
  recordId: string;
  sourceObjectNameSingular: string;
  relatedRecordId: string | null;
  objectMetadataItems: EnrichedObjectMetadataItem[];
  settingsEntries: MenuEntry[];
  isDropTarget: boolean;
  onDragStart: (id: string) => void;
  onDragOver: (id: string) => void;
  onDrop: (id: string) => void;
  onDragEnd: () => void;
  onSourceRecordChanged: () => void;
};

export const RoboostAssociationContainer = ({
  association,
  recordId,
  sourceObjectNameSingular,
  relatedRecordId,
  objectMetadataItems,
  settingsEntries,
  isDropTarget,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onSourceRecordChanged,
}: RoboostAssociationContainerProps) => {
  const { t } = useLingui();
  const { updateOneRecord } = useUpdateOneRecord();
  const openCreatePanel = useOpenRoboostCreatePanel();
  const [search, setSearch] = useState('');
  const [tagFilter, setTagFilter] = useState<string[]>([]);
  const [sort, setSort] = useState<RoboostAssociationSort>('newest');
  const [isPicking, setIsPicking] = useState(false);

  const target = association.targetObjectMetadataItem;
  const targetLabel = target.labelSingular.toLowerCase();
  const { tagField, lineFields } = getRoboostAssociationCardFields(target);
  const labelField = target.fields.find(
    (field) => field.name === getRoboostLabelIdentifierFieldName(target),
  );
  const avatarField = target.fields.find(
    (field) => field.name === 'avatarUrl' && field.isActive,
  );
  const recordGqlFields: RecordGqlFields = {
    ...getRoboostListRecordGqlFields(
      target,
      [labelField, tagField, ...lineFields].filter(isDefined),
      objectMetadataItems,
    ),
    createdAt: true,
    ...(isDefined(avatarField) ? { avatarUrl: true } : {}),
  };

  const isMany = association.kind === 'many';
  const filter = isMany
    ? { [association.joinColumnName]: { eq: recordId } }
    : { id: { eq: relatedRecordId ?? '' } };

  const { records, totalCount, refetch } = useFindManyRecords<ObjectRecord>({
    objectNameSingular: target.nameSingular,
    filter,
    skip: !isMany && !isDefined(relatedRecordId),
    recordGqlFields,
    orderBy: [{ createdAt: 'DescNullsLast' }],
    limit: ASSOCIATION_LIMIT,
  });

  const shownRecords = !isMany && !isDefined(relatedRecordId) ? [] : records;
  const count = isMany
    ? (totalCount ?? shownRecords.length)
    : shownRecords.length;
  const normalizedSearch = search.trim().toLowerCase();

  const visibleRecords = shownRecords
    .filter(
      (record) =>
        normalizedSearch === '' ||
        getRoboostRecordLabel(record, target)
          .toLowerCase()
          .includes(normalizedSearch),
    )
    .filter(
      (record) =>
        tagFilter.length === 0 ||
        (isDefined(tagField) &&
          tagFilter.includes(String(record[tagField.name] ?? ''))),
    )
    .sort((first, second) => {
      if (sort === 'name') {
        return getRoboostRecordLabel(first, target).localeCompare(
          getRoboostRecordLabel(second, target),
        );
      }
      const difference =
        new Date(String(first.createdAt ?? 0)).getTime() -
        new Date(String(second.createdAt ?? 0)).getTime();

      return sort === 'oldest' ? difference : -difference;
    });

  const linkExisting = async (pickedId: string) => {
    setIsPicking(false);
    if (association.kind === 'many') {
      await updateOneRecord({
        objectNameSingular: target.nameSingular,
        idToUpdate: pickedId,
        updateOneRecordInput: { [association.joinColumnName]: recordId },
      });
      refetch();
    } else {
      await updateOneRecord({
        objectNameSingular: sourceObjectNameSingular,
        idToUpdate: recordId,
        updateOneRecordInput: { [`${association.field.name}Id`]: pickedId },
      });
      onSourceRecordChanged();
    }
  };

  const removeAssociation = async (associatedId: string) => {
    if (association.kind === 'many') {
      await updateOneRecord({
        objectNameSingular: target.nameSingular,
        idToUpdate: associatedId,
        updateOneRecordInput: { [association.joinColumnName]: null },
      });
      refetch();
    } else {
      await updateOneRecord({
        objectNameSingular: sourceObjectNameSingular,
        idToUpdate: recordId,
        updateOneRecordInput: { [`${association.field.name}Id`]: null },
      });
      onSourceRecordChanged();
    }
  };

  const openCreate = () => {
    if (association.kind === 'many') {
      openCreatePanel({
        objectNameSingular: target.nameSingular,
        presetValues: { [association.joinColumnName]: recordId },
      });
    } else {
      openCreatePanel({ objectNameSingular: target.nameSingular });
    }
  };

  const addEntries: MenuEntry[] = [
    {
      id: 'existing',
      label: t`Associate an existing ${targetLabel}`,
      icon: 'link',
      onSelect: () => setIsPicking(true),
    },
    {
      id: 'create',
      label: t`Create a new ${targetLabel}`,
      icon: 'plus',
      onSelect: openCreate,
    },
  ];

  const tagOptions = [...(tagField?.options ?? [])].sort(
    (first, second) => first.position - second.position,
  );
  const listPath = getAppPath(AppPath.RecordIndexPage, {
    objectNamePlural: target.namePlural,
  });
  const viewAllPath =
    association.kind === 'many'
      ? `${listPath}?filterField=${encodeURIComponent(association.joinColumnName)}&filterValue=${encodeURIComponent(recordId)}`
      : listPath;

  return (
    <RoboostRecordContainer
      id={association.id}
      title={association.title}
      count={count}
      defaultOpen
      settingsEntries={settingsEntries}
      isDropTarget={isDropTarget}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      actions={
        <Menu
          align="right"
          minWidth={240}
          entries={addEntries}
          trigger={({ toggle, isOpen }) => (
            <button
              type="button"
              className="rb-rc-actbtn"
              aria-expanded={isOpen}
              onClick={toggle}
            >
              <Icon name="plus" size={12} strokeWidth={2} />
              {isMany || shownRecords.length === 0 ? t`Add` : t`Change`}
            </button>
          )}
        />
      }
    >
      {isPicking && (
        <div className="rb-rc-picker">
          <RoboostRecordPicker
            objectNameSingular={target.nameSingular}
            selectedLabel=""
            placeholder={t`Search ${target.labelPlural.toLowerCase()}`}
            isClearable={false}
            onSelect={(picked) => {
              if (picked !== null) {
                linkExisting(picked.id);
              }
            }}
          />
          <Button variant="ghost" size="sm" onClick={() => setIsPicking(false)}>
            {t`Cancel`}
          </Button>
        </div>
      )}
      {shownRecords.length === 0 && !isPicking ? (
        <div className="rb-rc-empty">
          {t`No ${target.labelPlural.toLowerCase()} yet.`}
          <Button
            variant="secondary"
            size="sm"
            icon="plus"
            onClick={openCreate}
          >
            {t`Add ${targetLabel}`}
          </Button>
        </div>
      ) : (
        <>
          {isMany && (
            <div className="rb-rc-tools">
              <div className="rb-rc-search">
                <Input
                  variant="search"
                  size="sm"
                  value={search}
                  placeholder={t`Search`}
                  aria-label={t`Search ${association.title}`}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>
              {isDefined(tagField) && tagOptions.length > 0 && (
                <Menu
                  align="right"
                  keepOpenOnSelect
                  entries={tagOptions.map((option) => ({
                    id: option.value,
                    label: option.label,
                    isSelected: tagFilter.includes(option.value),
                    onSelect: () =>
                      setTagFilter(
                        tagFilter.includes(option.value)
                          ? tagFilter.filter((value) => value !== option.value)
                          : [...tagFilter, option.value],
                      ),
                  }))}
                  trigger={({ toggle, isOpen }) => (
                    <button
                      type="button"
                      className={cx(
                        'rb-rc-actbtn',
                        tagFilter.length > 0 && 'is-on',
                      )}
                      aria-expanded={isOpen}
                      onClick={toggle}
                    >
                      <Icon name="filter" size={12} />
                      {tagFilter.length > 0
                        ? t`Filters (${tagFilter.length})`
                        : t`Filters`}
                    </button>
                  )}
                />
              )}
              <Menu
                align="right"
                entries={[
                  { id: 'newest', label: t`Newest first` },
                  { id: 'oldest', label: t`Oldest first` },
                  { id: 'name', label: t`Name A to Z` },
                ].map((entry) => ({
                  ...entry,
                  isSelected: entry.id === sort,
                  onSelect: () => setSort(entry.id as RoboostAssociationSort),
                }))}
                trigger={({ toggle, isOpen }) => (
                  <button
                    type="button"
                    className="rb-rc-actbtn"
                    aria-expanded={isOpen}
                    onClick={toggle}
                  >
                    {t`Sort`}
                    <Icon name="caret" size={12} />
                  </button>
                )}
              />
            </div>
          )}
          <div className="rb-rc-scroll">
            {visibleRecords.map((record) => (
              <RoboostAssociationCard
                key={record.id}
                record={record}
                objectMetadataItem={target}
                tagField={tagField}
                lineFields={lineFields}
                onRemove={() => removeAssociation(record.id)}
              />
            ))}
            {visibleRecords.length === 0 && shownRecords.length > 0 && (
              <div className="rb-rc-nomatch">{t`Nothing matches.`}</div>
            )}
          </div>
          {isMany && (
            <div className="rb-rc-foot">
              <Link className="rb-view-all" to={viewAllPath}>
                {t`View all associated ${association.title}`}
                <Icon name="external-link" size={13} />
              </Link>
            </div>
          )}
        </>
      )}
    </RoboostRecordContainer>
  );
};
