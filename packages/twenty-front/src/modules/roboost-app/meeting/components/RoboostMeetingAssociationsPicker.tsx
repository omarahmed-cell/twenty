import { useObjectMetadataItems } from '@/object-metadata/hooks/useObjectMetadataItems';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { type RoboostActivityTarget } from '@/roboost-app/activity/states/roboostActivityComposerState';
import {
  getRoboostLabelIdentifierFieldName,
  getRoboostRecordLabel,
} from '@/roboost-app/fields/getRoboostRecordLabel';
import { Checkbox } from '@/roboost-ui/components/Checkbox';
import { Icon } from '@/roboost-ui/components/Icon';
import { Input } from '@/roboost-ui/components/Input';
import { Popover } from '@/roboost-ui/components/Popover';
import { cx } from '@/roboost-ui/utils/cx';
import { useLingui } from '@lingui/react/macro';
import { isNonEmptyString } from '@sniptt/guards';
import { useState } from 'react';
import { type RecordGqlOperationFilter } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';
import { FieldMetadataType } from '~/generated-metadata/graphql';

export const ROBOOST_MEETING_ASSOCIABLE_OBJECTS = [
  'person',
  'company',
  'opportunity',
  'service',
];

const SELECTED = 'selected';

type RoboostMeetingAssociationsPickerProps = {
  targets: RoboostActivityTarget[];
  onChange: (targets: RoboostActivityTarget[]) => void;
};

const RoboostMeetingAssociationSearch = ({
  objectNameSingular,
  search,
  targets,
  onToggle,
}: {
  objectNameSingular: string;
  search: string;
  targets: RoboostActivityTarget[];
  onToggle: (target: RoboostActivityTarget, checked: boolean) => void;
}) => {
  const { t } = useLingui();
  const { objectMetadataItems } = useObjectMetadataItems();
  const objectMetadataItem = objectMetadataItems.find(
    (item) => item.nameSingular === objectNameSingular,
  );
  const labelFieldName = getRoboostLabelIdentifierFieldName(objectMetadataItem);
  const labelField = objectMetadataItem?.fields.find(
    (field) => field.name === labelFieldName,
  );
  const term = `%${search.trim()}%`;
  const filter: RecordGqlOperationFilter | undefined = isNonEmptyString(
    search.trim(),
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
  });

  return (
    <>
      {records.map((record) => {
        const label = getRoboostRecordLabel(record, objectMetadataItem);
        const isChecked = targets.some(
          (target) => target.recordId === record.id,
        );

        return (
          <label key={record.id} className="rb-mtg-pick-row">
            <Checkbox
              checked={isChecked}
              onChange={(checked) =>
                onToggle(
                  { objectNameSingular, recordId: record.id, label },
                  checked,
                )
              }
            />
            <span className="rb-mtg-pick-text">
              <span>{label || t`Untitled`}</span>
            </span>
          </label>
        );
      })}
      {!loading && records.length === 0 && (
        <div className="rb-mtg-pick-empty">{t`No matches`}</div>
      )}
    </>
  );
};

// HubSpot-style: record types with counts on the left, "Selected" first; search and tick on the right
export const RoboostMeetingAssociationsPicker = ({
  targets,
  onChange,
}: RoboostMeetingAssociationsPickerProps) => {
  const { t } = useLingui();
  const { objectMetadataItems } = useObjectMetadataItems();
  const [activeType, setActiveType] = useState(SELECTED);
  const [search, setSearch] = useState('');

  const types = ROBOOST_MEETING_ASSOCIABLE_OBJECTS.map((nameSingular) =>
    objectMetadataItems.find(
      (item) => item.nameSingular === nameSingular && item.isActive,
    ),
  ).filter(isDefined);

  const onToggle = (target: RoboostActivityTarget, checked: boolean) =>
    onChange(
      checked
        ? [...targets, target]
        : targets.filter(
            (current) =>
              !(
                current.recordId === target.recordId &&
                current.objectNameSingular === target.objectNameSingular
              ),
          ),
    );

  const searchLower = search.trim().toLowerCase();

  return (
    <Popover
      ariaLabel={t`Associations`}
      className="rb-mtg-pick rb-mtg-assoc"
      trigger={({ toggle, isOpen }) => (
        <button
          type="button"
          className="rb-act-inline"
          aria-expanded={isOpen}
          onClick={toggle}
        >
          {targets.length === 1
            ? t`Associated with 1 record`
            : t`Associated with ${targets.length} records`}
          <Icon name="caret" size={12} />
        </button>
      )}
    >
      {() => (
        <div className="rb-mtg-assoc-body">
          <div className="rb-mtg-assoc-types">
            {[
              { id: SELECTED, label: t`Selected`, count: targets.length },
              ...types.map((type) => ({
                id: type.nameSingular,
                label: type.labelPlural,
                count: targets.filter(
                  (target) => target.objectNameSingular === type.nameSingular,
                ).length,
              })),
            ].map((type) => (
              <button
                key={type.id}
                type="button"
                className={cx(
                  'rb-mtg-assoc-type',
                  activeType === type.id && 'is-on',
                )}
                onClick={() => {
                  setActiveType(type.id);
                  setSearch('');
                }}
              >
                <span>{type.label}</span>
                <span className="rb-mtg-assoc-count">{type.count}</span>
              </button>
            ))}
          </div>
          <div className="rb-mtg-pick-body">
            <Input
              variant="search"
              size="sm"
              placeholder={
                activeType === SELECTED
                  ? t`Search current associations`
                  : t`Search`
              }
              aria-label={t`Search associations`}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <div className="rb-mtg-pick-list">
              {activeType === SELECTED ? (
                types.map((type) => {
                  const selected = targets.filter(
                    (target) =>
                      target.objectNameSingular === type.nameSingular &&
                      target.label.toLowerCase().includes(searchLower),
                  );

                  return selected.length === 0 ? null : (
                    <div key={type.nameSingular}>
                      <div className="rb-mtg-pick-section">
                        {type.labelPlural}
                      </div>
                      {selected.map((target) => (
                        <label
                          key={target.recordId}
                          className="rb-mtg-pick-row"
                        >
                          <Checkbox
                            checked
                            onChange={(checked) => onToggle(target, checked)}
                          />
                          <span className="rb-mtg-pick-text">
                            <span>{target.label || t`Untitled`}</span>
                          </span>
                        </label>
                      ))}
                    </div>
                  );
                })
              ) : (
                <RoboostMeetingAssociationSearch
                  key={activeType}
                  objectNameSingular={activeType}
                  search={search}
                  targets={targets}
                  onToggle={onToggle}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </Popover>
  );
};
