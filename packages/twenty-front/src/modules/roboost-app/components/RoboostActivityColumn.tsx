import { type RoboostLayoutOverviewSection } from '@/roboost-app/layout/types/RoboostRecordLayout';
import { RoboostFeedItemView } from '@/roboost-app/components/RoboostFeedItemView';
import { RoboostActivityTypeFilter } from '@/roboost-app/timeline/components/RoboostActivityTypeFilter';
import { ROBOOST_ALL_ACTIVITY_TYPE_KEYS } from '@/roboost-app/timeline/constants/RoboostAllActivityTypeKeys';
import { useRoboostEmailContacts } from '@/roboost-app/timeline/hooks/useRoboostEmailContacts';
import { type RoboostActivityTypeKey } from '@/roboost-app/timeline/types/RoboostActivityTypeKey';
import { getRoboostEmailThreadKey } from '@/roboost-app/timeline/utils/getRoboostEmailThreadKey';
import { parseRoboostEmailAddresses } from '@/roboost-app/timeline/utils/parseRoboostEmailAddresses';
import {
  type RoboostFeedItem,
  type RoboostFeedKind,
} from '@/roboost-app/types/RoboostFeedItem';
import { type RoboostDateRange } from '@/roboost-app/list/types/RoboostListFilters';
import { getRoboostRangeStart } from '@/roboost-app/list/utils/getRoboostRangeStart';
import { useRoboostUserVars } from '@/roboost-app/hooks/useRoboostUserVars';
import { FilterChip } from '@/roboost-ui/components/FilterChip';
import { Input } from '@/roboost-ui/components/Input';
import { Tabs } from '@/roboost-ui/components/Tabs';
import { ROBOOST_UI_THEME } from '@/roboost-ui/constants/RoboostUiTheme';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { Fragment, useState } from 'react';
import { Link } from 'react-router-dom';

const TIMELINE_COLLAPSED_USER_VAR = 'roboost.timelineCardsCollapsed';

export type RoboostRecordMainTab = 'overview' | 'activities';
export type RoboostActivitySubTab =
  | 'all'
  | 'notes'
  | 'emails'
  | 'calls'
  | 'tasks'
  | 'meetings';

const KINDS_BY_SUB_TAB: Record<
  RoboostActivitySubTab,
  RoboostFeedKind[] | null
> = {
  all: null,
  notes: ['note'],
  emails: ['email', 'tracking'],
  calls: ['call', 'communication'],
  tasks: ['task'],
  meetings: ['meeting'],
};

type RoboostActivityDateRange =
  | Extract<
      RoboostDateRange,
      'any' | 'today' | 'last7' | 'last30' | 'thisQuarter'
    >
  | 'custom';

const OVERVIEW_ITEM_COUNT = 5;

const StyledColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
`;

const StyledTabsRow = styled.div`
  align-items: flex-end;
  border-bottom: 1px solid ${ROBOOST_UI_THEME.border};
  display: flex;
  gap: 12px;
`;

const StyledTabsSlot = styled.div`
  flex: 1;
  min-width: 0;
`;

const StyledCustomize = styled(Link)`
  color: ${ROBOOST_UI_THEME.accentText};
  font-size: 13px;
  font-weight: 500;
  line-height: 16px;
  padding-bottom: 10px;
  text-decoration: none;
  white-space: nowrap;
`;

const StyledSubTabs = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
`;

const StyledSubTab = styled.button`
  background: transparent;
  border: 1px solid transparent;
  border-radius: ${ROBOOST_UI_THEME.radiusFull};
  color: ${ROBOOST_UI_THEME.textSecondary};
  cursor: pointer;
  font-family: ${ROBOOST_UI_THEME.fontSans};
  font-size: 13px;
  font-weight: 500;
  height: 28px;
  line-height: 16px;
  padding: 0 10px;
  white-space: nowrap;

  &:hover {
    background: ${ROBOOST_UI_THEME.surfaceHover};
    color: ${ROBOOST_UI_THEME.text};
  }

  &[aria-current='true'] {
    background: ${ROBOOST_UI_THEME.accentSoft};
    color: ${ROBOOST_UI_THEME.accentText};
  }
`;

const StyledTools = styled.div`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const StyledSearch = styled.div`
  width: 220px;
`;

const StyledChipButton = styled.button`
  align-items: center;
  background: ${ROBOOST_UI_THEME.surface};
  border: 1px solid ${ROBOOST_UI_THEME.borderStrong};
  border-radius: ${ROBOOST_UI_THEME.radiusSm};
  color: ${ROBOOST_UI_THEME.textSecondary};
  cursor: pointer;
  display: inline-flex;
  font-family: ${ROBOOST_UI_THEME.fontSans};
  font-size: 12px;
  font-weight: 500;
  height: 28px;
  padding: 0 10px;

  &:hover {
    background: ${ROBOOST_UI_THEME.surfaceHover};
    color: ${ROBOOST_UI_THEME.text};
  }
`;

const StyledChips = styled.div`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const StyledClearAll = styled.button`
  background: none;
  border: none;
  color: ${ROBOOST_UI_THEME.accentText};
  cursor: pointer;
  font-family: ${ROBOOST_UI_THEME.fontSans};
  font-size: 12px;
  font-weight: 500;
`;

const StyledCustomRange = styled.div`
  align-items: center;
  color: ${ROBOOST_UI_THEME.textSecondary};
  display: flex;
  font-size: 12px;
  gap: 6px;
`;

const StyledDateInput = styled.div`
  width: 150px;
`;

const StyledMonth = styled.p`
  color: ${ROBOOST_UI_THEME.textMuted};
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  line-height: 14px;
  margin: 0;
  text-transform: uppercase;
`;

const StyledFeed = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
`;

const StyledEmpty = styled.div`
  background: ${ROBOOST_UI_THEME.surface};
  border: 1px dashed ${ROBOOST_UI_THEME.borderStrong};
  border-radius: ${ROBOOST_UI_THEME.radiusLg};
  color: ${ROBOOST_UI_THEME.textMuted};
  font-size: 13px;
  line-height: 18px;
  padding: 24px;
  text-align: center;
`;

const StyledSectionTitle = styled.h3`
  color: ${ROBOOST_UI_THEME.text};
  font-size: 13px;
  font-weight: 600;
  margin: 0;
`;

const MONTH_FORMAT = new Intl.DateTimeFormat('en-GB', {
  month: 'long',
  year: 'numeric',
});

const getMonthLabel = (date: string) => {
  const parsed = new Date(date);

  return Number.isNaN(parsed.getTime()) ? '' : MONTH_FORMAT.format(parsed);
};

type RoboostActivityColumnProps = {
  items: RoboostFeedItem[];
  loading: boolean;
  mainTab: RoboostRecordMainTab;
  onMainTabChange: (tab: RoboostRecordMainTab) => void;
  subTab: RoboostActivitySubTab;
  onSubTabChange: (tab: RoboostActivitySubTab) => void;
  customizePath: string;
  members: { id: string; name: string }[];
  overviewSections: RoboostLayoutOverviewSection[];
  isPinned: (item: RoboostFeedItem) => boolean;
  onTogglePin: (item: RoboostFeedItem) => void;
  onChanged: () => void;
};

export const RoboostActivityColumn = ({
  items,
  loading,
  mainTab,
  onMainTabChange,
  subTab,
  onSubTabChange,
  customizePath,
  members,
  overviewSections,
  isPinned,
  onTogglePin,
  onChanged,
}: RoboostActivityColumnProps) => {
  const { t } = useLingui();
  const [search, setSearch] = useState('');
  const [typeKeys, setTypeKeys] = useState<RoboostActivityTypeKey[]>(
    ROBOOST_ALL_ACTIVITY_TYPE_KEYS,
  );
  const [dateRange, setDateRange] = useState<RoboostActivityDateRange>('any');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [creatorId, setCreatorId] = useState<string | null>(null);
  const [showTracking, setShowTracking] = useState(true);
  const [showCanceledMeetings, setShowCanceledMeetings] = useState(true);
  const [showCompletedTasks, setShowCompletedTasks] = useState(true);
  const { getUserVar, setUserVar } = useRoboostUserVars();
  // Cards open expanded like HubSpot; "Collapse all" is remembered per user
  const isCollapsedByDefault =
    getUserVar<boolean>(TIMELINE_COLLAPSED_USER_VAR) === true;
  const [toggledIds, setToggledIds] = useState<string[]>([]);
  const isItemExpanded = (id: string) =>
    isCollapsedByDefault !== toggledIds.includes(id);

  const dateRangeLabels: Record<RoboostActivityDateRange, string> = {
    any: t`Any time`,
    today: t`Today`,
    last7: t`Last 7 days`,
    last30: t`Last 30 days`,
    thisQuarter: t`This quarter`,
    custom: t`Custom range`,
  };

  const subTabs: { id: RoboostActivitySubTab; label: string }[] = [
    { id: 'all', label: t`All activities` },
    { id: 'notes', label: t`Notes` },
    { id: 'emails', label: t`Emails` },
    { id: 'calls', label: t`Calls` },
    { id: 'tasks', label: t`Tasks` },
    { id: 'meetings', label: t`Meetings` },
  ];

  const rangeStart =
    dateRange === 'custom'
      ? customFrom
      : dateRange === 'any'
        ? undefined
        : getRoboostRangeStart(dateRange, new Date());
  const rangeEnd =
    dateRange === 'custom' && customTo !== ''
      ? `${customTo}T23:59:59.999`
      : undefined;
  const normalizedSearch = search.trim().toLowerCase();
  const subTabKinds = KINDS_BY_SUB_TAB[subTab];

  const visibleItems = items.filter((item) => {
    if (subTabKinds !== null && !subTabKinds.includes(item.kind)) {
      return false;
    }
    if (!typeKeys.includes(item.typeKey)) {
      return false;
    }
    if (!showTracking && item.kind === 'tracking') {
      return false;
    }
    if (creatorId !== null && item.creatorId !== creatorId) {
      return false;
    }
    if (!showCanceledMeetings && item.isCanceled === true) {
      return false;
    }
    if (!showCompletedTasks && item.kind === 'task' && item.status === 'DONE') {
      return false;
    }
    const itemTime = new Date(item.date).getTime();

    if (
      (rangeStart !== undefined &&
        rangeStart !== '' &&
        itemTime < new Date(rangeStart).getTime()) ||
      (rangeEnd !== undefined && itemTime > new Date(rangeEnd).getTime())
    ) {
      return false;
    }

    return (
      normalizedSearch === '' ||
      `${item.title} ${item.body} ${item.ownerName}`
        .toLowerCase()
        .includes(normalizedSearch)
    );
  });

  const expandableIds = visibleItems
    .filter((item) => item.kind !== 'update' && item.kind !== 'tracking')
    .map((item) => item.id);
  const isAnyExpanded = expandableIds.some(isItemExpanded);
  const hasFilters =
    typeKeys.length < ROBOOST_ALL_ACTIVITY_TYPE_KEYS.length ||
    dateRange !== 'any' ||
    creatorId !== null ||
    !showTracking ||
    !showCanceledMeetings ||
    !showCompletedTasks;

  const emailItems = items.filter((item) => item.kind === 'email');
  const contactByEmail = useRoboostEmailContacts(
    emailItems.flatMap((item) =>
      [item.email?.from, item.email?.to, item.email?.cc].flatMap((value) =>
        parseRoboostEmailAddresses(value).map(({ email }) => email),
      ),
    ),
  );
  const threadByKey = new Map<
    string,
    { id: string; date: string; from: string }[]
  >();

  for (const item of [...emailItems].reverse()) {
    const key = getRoboostEmailThreadKey(item.title);
    const thread = threadByKey.get(key) ?? [];

    thread.push({
      id: item.email?.id ?? item.id,
      date: item.date,
      from: parseRoboostEmailAddresses(item.email?.from)[0]?.name ?? '',
    });
    threadByKey.set(key, thread);
  }

  const pinnedItems = items.filter(isPinned);

  const renderFeed = (feedItems: RoboostFeedItem[]) => {
    let previousMonth = '';

    return (
      <StyledFeed>
        {feedItems.map((item) => {
          const month = getMonthLabel(item.date);
          const showMonth = month !== previousMonth;

          previousMonth = month;

          return (
            <Fragment key={item.id}>
              {showMonth && <StyledMonth>{month}</StyledMonth>}
              <RoboostFeedItemView
                item={item}
                isPinned={isPinned(item)}
                onTogglePin={() => onTogglePin(item)}
                onChanged={onChanged}
                contactByEmail={contactByEmail}
                thread={
                  item.kind === 'email' && item.email !== undefined
                    ? (threadByKey.get(getRoboostEmailThreadKey(item.title)) ??
                      [])
                    : []
                }
                isExpanded={isItemExpanded(item.id)}
                onToggleExpanded={(expanded) =>
                  expanded !== isItemExpanded(item.id) &&
                  setToggledIds(
                    toggledIds.includes(item.id)
                      ? toggledIds.filter((id) => id !== item.id)
                      : [...toggledIds, item.id],
                  )
                }
              />
            </Fragment>
          );
        })}
      </StyledFeed>
    );
  };

  const openTasks = items.filter(
    (item) => item.kind === 'task' && item.status !== 'DONE',
  );

  return (
    <StyledColumn>
      <StyledTabsRow>
        <StyledTabsSlot>
          <Tabs
            hasBorder={false}
            tabs={[
              { id: 'overview', label: t`Overview` },
              { id: 'activities', label: t`Activities`, count: items.length },
            ]}
            value={mainTab}
            onChange={(id) => onMainTabChange(id as RoboostRecordMainTab)}
          />
        </StyledTabsSlot>
        <StyledCustomize to={customizePath}>{t`Customize`}</StyledCustomize>
      </StyledTabsRow>

      {mainTab === 'overview' &&
        overviewSections
          .filter((section) => !section.isHidden)
          .map((section) => (
            <Fragment key={section.id}>
              <StyledSectionTitle>{section.title}</StyledSectionTitle>
              {section.id === 'openTasks' &&
                (openTasks.length > 0 ? (
                  renderFeed(openTasks)
                ) : (
                  <StyledEmpty>{t`No open tasks.`}</StyledEmpty>
                ))}
              {section.id === 'pinnedActivities' &&
                (pinnedItems.length > 0 ? (
                  renderFeed(pinnedItems)
                ) : (
                  <StyledEmpty>{t`No pinned activities yet.`}</StyledEmpty>
                ))}
              {section.id === 'latestActivity' &&
                (items.length > 0 ? (
                  renderFeed(items.slice(0, OVERVIEW_ITEM_COUNT))
                ) : (
                  <StyledEmpty>
                    {loading ? t`Loading activity…` : t`No activity yet.`}
                  </StyledEmpty>
                ))}
            </Fragment>
          ))}

      {mainTab === 'activities' && (
        <>
          <StyledSubTabs>
            {subTabs.map((tab) => (
              <StyledSubTab
                key={tab.id}
                type="button"
                aria-current={tab.id === subTab ? 'true' : undefined}
                onClick={() => onSubTabChange(tab.id)}
              >
                {tab.label}
              </StyledSubTab>
            ))}
          </StyledSubTabs>
          <StyledTools>
            <StyledSearch>
              <Input
                icon="search"
                size="sm"
                placeholder={t`Search activities`}
                aria-label={t`Search activities`}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </StyledSearch>
            <StyledChipButton
              type="button"
              onClick={() => {
                setToggledIds([]);
                setUserVar(TIMELINE_COLLAPSED_USER_VAR, isAnyExpanded);
              }}
            >
              {isAnyExpanded ? t`Collapse all` : t`Expand all`}
            </StyledChipButton>
          </StyledTools>
          <StyledChips>
            <RoboostActivityTypeFilter
              selected={typeKeys}
              onChange={setTypeKeys}
            />
            <FilterChip
              label={t`Activity date`}
              value={
                dateRange === 'any' ? undefined : dateRangeLabels[dateRange]
              }
              isActive={dateRange !== 'any'}
              entries={(
                Object.keys(dateRangeLabels) as RoboostActivityDateRange[]
              ).map((range) => ({
                id: range,
                label: dateRangeLabels[range],
                isSelected: range === dateRange,
                onSelect: () => setDateRange(range),
              }))}
            />
            <FilterChip
              label={t`Created by`}
              value={members.find((member) => member.id === creatorId)?.name}
              isActive={creatorId !== null}
              entries={[
                {
                  id: 'anyone',
                  label: t`Anyone`,
                  isSelected: creatorId === null,
                  onSelect: () => setCreatorId(null),
                },
                ...members.map((member) => ({
                  id: member.id,
                  label: member.name,
                  isSelected: member.id === creatorId,
                  onSelect: () => setCreatorId(member.id),
                })),
              ]}
            />
            <FilterChip
              label={t`More`}
              isActive={
                !showTracking || !showCanceledMeetings || !showCompletedTasks
              }
              keepOpenOnSelect
              entries={[
                {
                  id: 'tracking',
                  label: t`Show email tracking`,
                  isSelected: showTracking,
                  onSelect: () => setShowTracking(!showTracking),
                },
                {
                  id: 'canceled',
                  label: t`Show cancelled meetings`,
                  isSelected: showCanceledMeetings,
                  onSelect: () =>
                    setShowCanceledMeetings(!showCanceledMeetings),
                },
                {
                  id: 'completed',
                  label: t`Show completed tasks`,
                  isSelected: showCompletedTasks,
                  onSelect: () => setShowCompletedTasks(!showCompletedTasks),
                },
              ]}
            />
            {dateRange === 'custom' && (
              <StyledCustomRange>
                <StyledDateInput>
                  <Input
                    size="sm"
                    type="date"
                    aria-label={t`From`}
                    value={customFrom}
                    onChange={(event) => setCustomFrom(event.target.value)}
                  />
                </StyledDateInput>
                {t`to`}
                <StyledDateInput>
                  <Input
                    size="sm"
                    type="date"
                    aria-label={t`To`}
                    value={customTo}
                    onChange={(event) => setCustomTo(event.target.value)}
                  />
                </StyledDateInput>
              </StyledCustomRange>
            )}
            {hasFilters && (
              <StyledClearAll
                type="button"
                onClick={() => {
                  setTypeKeys(ROBOOST_ALL_ACTIVITY_TYPE_KEYS);
                  setDateRange('any');
                  setCustomFrom('');
                  setCustomTo('');
                  setCreatorId(null);
                  setShowTracking(true);
                  setShowCanceledMeetings(true);
                  setShowCompletedTasks(true);
                }}
              >
                {t`Clear all`}
              </StyledClearAll>
            )}
          </StyledChips>
          {pinnedItems.length > 0 && subTab === 'all' && (
            <>
              <StyledSectionTitle>{t`Pinned`}</StyledSectionTitle>
              {renderFeed(pinnedItems)}
            </>
          )}
          {visibleItems.length > 0 ? (
            renderFeed(
              subTab === 'all'
                ? visibleItems.filter((item) => !isPinned(item))
                : visibleItems,
            )
          ) : (
            <StyledEmpty>
              {loading
                ? t`Loading activity…`
                : t`No activity matches. Try another tab or clear the filters.`}
            </StyledEmpty>
          )}
        </>
      )}
    </StyledColumn>
  );
};
