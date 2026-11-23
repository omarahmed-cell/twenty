import { useTimelineActivities } from '@/activities/timeline-activities/hooks/useTimelineActivities';
import { useTimelineActivityTypes } from '@/activities/timeline-activities/hooks/useTimelineActivityTypes';
import { EventRelationFieldDiffValues } from '@/activities/timeline-activities/rows/main-object/components/EventRelationFieldDiffValues';
import { getTimelineActivityAction } from '@/activities/timeline-activities/utils/getTimelineActivityAction';
import { isRelationFieldChangeValue } from '@/activities/timeline-activities/utils/relationFieldChangeValue';
import { useObjectMetadataItems } from '@/object-metadata/hooks/useObjectMetadataItems';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import {
  roboostFieldHistoryState,
  type RoboostFieldHistoryTarget,
} from '@/roboost-app/history/states/roboostFieldHistoryState';
import { type RoboostDatePreset } from '@/roboost-app/history/types/RoboostDatePreset';
import {
  type RoboostFieldHistoryEntry,
  type RoboostFieldHistorySource,
} from '@/roboost-app/history/types/RoboostFieldHistoryEntry';
import { getRoboostDatePresetRange } from '@/roboost-app/history/utils/getRoboostDatePresetRange';
import { getRoboostFieldHistoryEntries } from '@/roboost-app/history/utils/getRoboostFieldHistoryEntries';
import { formatRoboostDateTime } from '@/roboost-app/utils/formatRoboostDateTime';
import { formatRoboostFieldValue } from '@/roboost-app/utils/formatRoboostFieldValue';
import { Icon } from '@/roboost-ui/components/Icon';
import { Input } from '@/roboost-ui/components/Input';
import { Menu } from '@/roboost-ui/components/Menu';
import { SidePanel } from '@/roboost-ui/components/SidePanel';
import { useAtomState } from '@/ui/utilities/state/jotai/hooks/useAtomState';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CoreObjectNameSingular } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';
import { FieldMetadataType } from '~/generated-metadata/graphql';

type WorkflowRecord = { id: string; name: string | null; __typename: string };

const DAY_IN_MS = 24 * 3600 * 1000;
const TIMELINE_PAGE_SIZE = 60;

const HistoryFilterMenu = <TValue extends string>({
  label,
  value,
  labels,
  onSelect,
}: {
  label: string;
  value: TValue;
  labels: Record<TValue, string>;
  onSelect: (value: TValue) => void;
}) => (
  <Menu
    minWidth={200}
    entries={(Object.keys(labels) as TValue[]).map((key) => ({
      id: key,
      label: labels[key],
      isSelected: key === value,
      onSelect: () => onSelect(key),
    }))}
    trigger={({ toggle, isOpen }) => (
      <button
        type="button"
        className="rb-history-filter"
        aria-expanded={isOpen}
        onClick={toggle}
      >
        <span className="rb-history-filter-label">{label}</span>
        <b>{labels[value]}</b>
        <Icon name="caret" size={12} />
      </button>
    )}
  />
);

const RoboostFieldHistoryContent = ({
  target,
  onClose,
}: {
  target: RoboostFieldHistoryTarget;
  onClose: () => void;
}) => {
  const { t } = useLingui();
  const { objectMetadataItems } = useObjectMetadataItems();
  const [search, setSearch] = useState('');
  const [source, setSource] = useState<RoboostFieldHistorySource | 'all'>(
    'all',
  );
  const [datePreset, setDatePreset] = useState<RoboostDatePreset>('all');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const objectMetadataItem = objectMetadataItems.find(
    (item) => item.nameSingular === target.objectNameSingular,
  );
  const field = objectMetadataItem?.fields.find(
    (item) => item.name === target.fieldName,
  );

  const { timelineActivities, firstQueryLoading, fetchMoreRecords } =
    useTimelineActivities({
      id: target.recordId,
      targetObjectNameSingular: target.objectNameSingular,
    });
  const { timelineActivityTypeMaps } = useTimelineActivityTypes();

  const entries = isDefined(field)
    ? getRoboostFieldHistoryEntries({
        timelineActivities,
        field,
        isUpdateRow: (timelineActivity) =>
          getTimelineActivityAction(
            timelineActivity,
            timelineActivityTypeMaps,
          ) === 'updated',
      })
    : [];

  const workflowIds = [
    ...new Set(entries.map((entry) => entry.workflowId).filter(isDefined)),
  ];
  const { records: workflows } = useFindManyRecords<WorkflowRecord>({
    objectNameSingular: CoreObjectNameSingular.Workflow,
    filter: { id: { in: workflowIds } },
    recordGqlFields: { id: true, name: true },
    skip: workflowIds.length === 0,
  });

  const sourceLabels: Record<RoboostFieldHistorySource | 'all', string> = {
    all: t`All`,
    user: t`User`,
    workflow: t`Workflow`,
    import: t`Import`,
    api: t`API`,
    system: t`System`,
  };
  const dateLabels: Record<RoboostDatePreset, string> = {
    all: t`All`,
    today: t`Today`,
    yesterday: t`Yesterday`,
    thisWeek: t`This week`,
    lastWeek: t`Last week`,
    thisMonth: t`This month`,
    lastMonth: t`Last month`,
    custom: t`Custom range`,
  };

  const formatValue = (value: unknown) =>
    isDefined(field) ? formatRoboostFieldValue(field, value) : '';

  const isInDateRange = (entry: RoboostFieldHistoryEntry) => {
    const happensAt = new Date(entry.happensAt);

    if (datePreset === 'all') {
      return true;
    }

    if (datePreset === 'custom') {
      const start = customStart === '' ? null : new Date(customStart);
      const end =
        customEnd === ''
          ? null
          : new Date(new Date(customEnd).getTime() + DAY_IN_MS);

      return (
        (start === null || happensAt >= start) &&
        (end === null || happensAt < end)
      );
    }

    const { start, end } = getRoboostDatePresetRange(datePreset);

    return happensAt >= start && happensAt < end;
  };

  const searchTerm = search.trim().toLowerCase();
  const visibleEntries = entries.filter(
    (entry) =>
      (source === 'all' || entry.source === source) &&
      isInDateRange(entry) &&
      (searchTerm === '' ||
        `${formatValue(entry.after)} ${entry.actorName ?? ''}`
          .toLowerCase()
          .includes(searchTerm)),
  );

  const renderChangedTo = (entry: RoboostFieldHistoryEntry) => {
    if (
      isDefined(field) &&
      field.type === FieldMetadataType.RELATION &&
      isRelationFieldChangeValue(entry.after)
    ) {
      return (
        <EventRelationFieldDiffValues
          fieldDiff={{ before: undefined, after: entry.after }}
          fieldMetadataItem={field}
        />
      );
    }

    return formatValue(entry.after);
  };

  const renderSource = (entry: RoboostFieldHistoryEntry) => {
    if (entry.source === 'workflow') {
      const workflow = workflows.find((item) => item.id === entry.workflowId);

      return (
        <>
          <span>{t`Workflow`}</span>
          {isDefined(workflow) && (
            <Link
              className="rb-history-link"
              to={`/object/workflow/${workflow.id}`}
              title={workflow.name ?? undefined}
            >
              <span className="rb-truncate">
                {workflow.name ?? t`Workflow`}
              </span>
              <Icon name="link" size={12} />
            </Link>
          )}
        </>
      );
    }

    if (entry.source === 'user') {
      return <span>{entry.actorName ?? t`User`}</span>;
    }

    return <span>{sourceLabels[entry.source]}</span>;
  };

  return (
    <SidePanel title={t`Details`} onClose={onClose} width={620}>
      <div className="rb-history">
        <div className="rb-history-field">
          {field?.label ?? target.fieldName}
        </div>
        <p className="rb-history-intro">
          {t`Every change to this property on this record, newest first.`}
        </p>
        <div className="rb-history-search">
          <Input
            variant="search"
            size="sm"
            value={search}
            placeholder={t`Search`}
            aria-label={t`Search history`}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <div className="rb-history-filters">
          <HistoryFilterMenu
            label={t`Source`}
            value={source}
            labels={sourceLabels}
            onSelect={setSource}
          />
          <HistoryFilterMenu
            label={t`Date`}
            value={datePreset}
            labels={dateLabels}
            onSelect={setDatePreset}
          />
        </div>
        {datePreset === 'custom' && (
          <div className="rb-history-range">
            <input
              type="date"
              className="rb-input rb-input-sm"
              aria-label={t`From`}
              value={customStart}
              onChange={(event) => setCustomStart(event.target.value)}
            />
            <span>{t`to`}</span>
            <input
              type="date"
              className="rb-input rb-input-sm"
              aria-label={t`To`}
              value={customEnd}
              onChange={(event) => setCustomEnd(event.target.value)}
            />
          </div>
        )}
        <table className="rb-history-table">
          <thead>
            <tr>
              <th>{t`Changed to`}</th>
              <th>{t`Date`}</th>
              <th>{t`Source`}</th>
            </tr>
          </thead>
          <tbody>
            {visibleEntries.map((entry) => (
              <tr key={entry.id}>
                <td className="rb-history-value">{renderChangedTo(entry)}</td>
                <td className="rb-history-date">
                  {formatRoboostDateTime(entry.happensAt)}
                </td>
                <td>
                  <div className="rb-history-source">{renderSource(entry)}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {firstQueryLoading && (
          <div className="rb-history-empty">{t`Loading history…`}</div>
        )}
        {!firstQueryLoading && visibleEntries.length === 0 && (
          <div className="rb-history-empty">
            {entries.length === 0
              ? t`No changes recorded for this property yet.`
              : t`No changes match these filters.`}
          </div>
        )}
        {!firstQueryLoading &&
          timelineActivities.length >= TIMELINE_PAGE_SIZE && (
            <button
              type="button"
              className="rb-link rb-history-more"
              onClick={() => fetchMoreRecords()}
            >
              {t`Load older changes`}
            </button>
          )}
      </div>
    </SidePanel>
  );
};

export const RoboostFieldHistoryPanel = () => {
  const [roboostFieldHistory, setRoboostFieldHistory] = useAtomState(
    roboostFieldHistoryState,
  );

  if (!isDefined(roboostFieldHistory)) {
    return null;
  }

  return (
    <RoboostFieldHistoryContent
      key={`${roboostFieldHistory.recordId}-${roboostFieldHistory.fieldName}`}
      target={roboostFieldHistory}
      onClose={() => setRoboostFieldHistory(null)}
    />
  );
};
