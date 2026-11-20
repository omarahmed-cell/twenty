import { useCreateActivityForTargetRecord } from '@/activities/hooks/useCreateActivityForTargetRecord';
import { useCurrentPageLayoutOrThrow } from '@/page-layout/hooks/useCurrentPageLayoutOrThrow';
import { useTargetRecord } from '@/ui/layout/contexts/useTargetRecord';
import { css } from '@linaria/core';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { Link, useLocation } from 'react-router-dom';
import { CoreObjectNameSingular } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';
import {
  IconCalendarEvent,
  IconCheckbox,
  IconMail,
  IconNotes,
  IconPhone,
  type IconComponent,
} from 'twenty-ui/icon';
import { themeCssVariables } from 'twenty-ui/theme';
import { WidgetType } from '~/generated-metadata/graphql';

const StyledQuickActions = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[2]};
  grid-template-columns: repeat(auto-fit, minmax(44px, 1fr));
  padding: ${themeCssVariables.spacing[3]} ${themeCssVariables.spacing[3]} 0;
`;

const quickActionClassName = css`
  align-items: center;
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.md};
  box-sizing: border-box;
  color: ${themeCssVariables.font.color.secondary};
  cursor: pointer;
  display: flex;
  flex-direction: column;
  font-family: inherit;
  font-size: ${themeCssVariables.font.size.xs};
  gap: ${themeCssVariables.spacing[1]};
  min-width: 0;
  padding: ${themeCssVariables.spacing[2]} ${themeCssVariables.spacing[1]};
  text-decoration: none;

  &:hover {
    background: ${themeCssVariables.accent.accent2};
    border-color: ${themeCssVariables.accent.accent5};
    color: ${themeCssVariables.accent.accent11};
  }

  &:focus-visible {
    outline: 2px solid ${themeCssVariables.color.blue};
    outline-offset: 2px;
  }
`;

const StyledQuickActionLabel = styled.span`
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

type QuickAction = {
  key: string;
  label: string;
  Icon: IconComponent;
} & ({ onClick: () => void } | { tabId: string });

type TabQuickAction = {
  key: string;
  label: string;
  Icon: IconComponent;
  widgetType: WidgetType;
};

export const RecordPageQuickActions = () => {
  const { t } = useLingui();
  const targetRecord = useTargetRecord();
  const { currentPageLayout } = useCurrentPageLayoutOrThrow();
  const location = useLocation();

  const note = useCreateActivityForTargetRecord({
    targetRecord,
    activityObjectNameSingular: CoreObjectNameSingular.Note,
  });
  const task = useCreateActivityForTargetRecord({
    targetRecord,
    activityObjectNameSingular: CoreObjectNameSingular.Task,
  });

  const findTabIdWithWidget = (widgetType: WidgetType) =>
    currentPageLayout.tabs.find((tab) =>
      tab.widgets.some((widget) => widget.type === widgetType),
    )?.id;

  const tabQuickActions: TabQuickAction[] = [
    {
      key: 'email',
      label: t`Email`,
      Icon: IconMail,
      widgetType: WidgetType.EMAILS,
    },
    {
      key: 'call',
      label: t`Call`,
      Icon: IconPhone,
      widgetType: WidgetType.CALLS,
    },
    {
      key: 'meeting',
      label: t`Meeting`,
      Icon: IconCalendarEvent,
      widgetType: WidgetType.CALENDAR,
    },
  ];

  const quickActions: QuickAction[] = [
    ...(note.canCreateActivity
      ? [
          {
            key: 'note',
            label: t`Note`,
            Icon: IconNotes,
            onClick: note.createActivity,
          },
        ]
      : []),
    ...tabQuickActions.flatMap(({ widgetType, ...action }) => {
      const tabId = findTabIdWithWidget(widgetType);

      return isDefined(tabId) ? [{ ...action, tabId }] : [];
    }),
    ...(task.canCreateActivity
      ? [
          {
            key: 'task',
            label: t`Task`,
            Icon: IconCheckbox,
            onClick: task.createActivity,
          },
        ]
      : []),
  ];

  if (quickActions.length === 0) {
    return null;
  }

  return (
    <StyledQuickActions>
      {quickActions.map((action) => {
        const content = (
          <>
            <action.Icon size={16} />
            <StyledQuickActionLabel>{action.label}</StyledQuickActionLabel>
          </>
        );

        return 'tabId' in action ? (
          <Link
            key={action.key}
            className={quickActionClassName}
            to={{ search: location.search, hash: `#${action.tabId}` }}
            state={location.state}
          >
            {content}
          </Link>
        ) : (
          <button
            key={action.key}
            type="button"
            className={quickActionClassName}
            onClick={action.onClick}
          >
            {content}
          </button>
        );
      })}
    </StyledQuickActions>
  );
};
