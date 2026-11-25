import { useRoboostAccess } from '@/roboost-app/users-and-teams/hooks/useRoboostAccess';
import { canRoboostWriteObject } from '@/roboost-app/users-and-teams/utils/canRoboostWriteObject';
import { getRoboostNoPermissionAttribute } from '@/roboost-ui/utils/getRoboostNoPermissionAttributes';
import { useComposeEmailForTargetRecord } from '@/activities/emails/hooks/useComposeEmailForTargetRecord';
import {
  type RoboostActivityType,
  roboostActivityComposerState,
} from '@/roboost-app/activity/states/roboostActivityComposerState';
import { roboostMeetingSchedulerState } from '@/roboost-app/meeting/states/roboostMeetingSchedulerState';
import { useSetAtomState } from '@/ui/utilities/state/jotai/hooks/useSetAtomState';
import { type ActivityTargetableObject } from '@/activities/types/ActivityTargetableEntity';
import { Icon } from '@/roboost-ui/components/Icon';
import { Menu, type MenuEntry } from '@/roboost-ui/components/Menu';
import { ROBOOST_UI_THEME } from '@/roboost-ui/constants/RoboostUiTheme';
import { type RoboostIconName } from '@/roboost-ui/types/RoboostIconName';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';

const StyledRow = styled.div`
  display: flex;
  gap: 4px;
  margin-top: 14px;
`;

const StyledAction = styled.button`
  align-items: center;
  background: transparent;
  border: none;
  color: ${ROBOOST_UI_THEME.textSecondary};
  cursor: pointer;
  display: flex;
  flex: 1;
  flex-direction: column;
  font-family: ${ROBOOST_UI_THEME.fontSans};
  font-size: 11px;
  font-weight: 500;
  gap: 6px;
  line-height: 13px;
  min-width: 0;
  padding: 4px 1px;

  > span:last-child {
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &:hover:not(:disabled) > span:first-child {
    background: ${ROBOOST_UI_THEME.accentSoft};
    border-color: ${ROBOOST_UI_THEME.accentBorder};
    color: ${ROBOOST_UI_THEME.accentText};
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

const StyledActionIcon = styled.span`
  align-items: center;
  background: ${ROBOOST_UI_THEME.surface};
  border: 1px solid ${ROBOOST_UI_THEME.borderStrong};
  border-radius: 999px;
  color: ${ROBOOST_UI_THEME.textSecondary};
  display: flex;
  height: 34px;
  justify-content: center;
  width: 34px;
`;

const StyledMoreAnchor = styled.div`
  display: flex;
  flex: 1;
  min-width: 0;

  > div {
    flex: 1;
  }

  button {
    width: 100%;
  }
`;

type RoboostRecordQuickActionsProps = {
  targetRecord: ActivityTargetableObject;
  targetLabel: string;
  moreEntries: MenuEntry[];
};

export const RoboostRecordQuickActions = ({
  targetRecord,
  targetLabel,
  moreEntries,
}: RoboostRecordQuickActionsProps) => {
  const { t } = useLingui();
  const setRoboostActivityComposer = useSetAtomState(
    roboostActivityComposerState,
  );

  const setRoboostMeetingScheduler = useSetAtomState(
    roboostMeetingSchedulerState,
  );
  const openMeeting = (mode: 'SCHEDULE' | 'LOG') =>
    setRoboostMeetingScheduler({
      mode,
      contextTarget: {
        objectNameSingular: targetRecord.targetObjectNameSingular,
        recordId: targetRecord.id,
        label: targetLabel,
      },
    });

  const openActivity = (type: RoboostActivityType) =>
    setRoboostActivityComposer({
      type,
      targets: [
        {
          objectNameSingular: targetRecord.targetObjectNameSingular,
          recordId: targetRecord.id,
          label: targetLabel,
        },
      ],
    });

  const { openComposer } = useComposeEmailForTargetRecord(targetRecord);
  const roboostAccess = useRoboostAccess();
  const canCreate = (objectNameSingular: string) =>
    canRoboostWriteObject(roboostAccess, objectNameSingular, 'create');

  const actions: {
    key: string;
    label: string;
    icon: RoboostIconName;
    onClick: () => void;
    isDisabled?: boolean;
    isAllowed: boolean;
  }[] = [
    {
      key: 'note',
      label: t`Note`,
      icon: 'note',
      isAllowed: canCreate('note'),
      onClick: () => openActivity('note'),
    },
    {
      key: 'email',
      label: t`Email`,
      icon: 'mail',
      isAllowed: canCreate('email'),
      onClick: openComposer,
    },
    {
      key: 'call',
      label: t`Call`,
      icon: 'phone',
      isAllowed: canCreate('call'),
      onClick: () => openActivity('call'),
    },
    {
      key: 'task',
      label: t`Task`,
      icon: 'tasks',
      isAllowed: canCreate('task'),
      onClick: () => openActivity('task'),
    },
  ];

  return (
    <StyledRow>
      {actions.map((action) => (
        <StyledAction
          key={action.key}
          type="button"
          disabled={action.isDisabled}
          data-rb-no-permission={getRoboostNoPermissionAttribute(
            action.isAllowed,
          )}
          aria-disabled={action.isAllowed ? undefined : true}
          onClick={action.onClick}
        >
          <StyledActionIcon>
            <Icon name={action.icon} size={16} />
          </StyledActionIcon>
          <span>{action.label}</span>
        </StyledAction>
      ))}
      <StyledMoreAnchor>
        <Menu
          entries={[
            {
              id: 'schedule-meeting',
              label: t`Schedule meeting`,
              icon: 'calendar',
              isNoPermission: !canCreate('meeting'),
              onSelect: () => openMeeting('SCHEDULE'),
            },
            {
              id: 'log-meeting',
              label: t`Log meeting`,
              icon: 'history',
              isNoPermission: !canCreate('meeting'),
              onSelect: () => openMeeting('LOG'),
            },
          ]}
          trigger={({ toggle, isOpen }) => (
            <StyledAction
              type="button"
              aria-expanded={isOpen}
              aria-haspopup="menu"
              onClick={toggle}
            >
              <StyledActionIcon>
                <Icon name="calendar" size={16} />
              </StyledActionIcon>
              <span>{t`Meeting`}</span>
            </StyledAction>
          )}
        />
      </StyledMoreAnchor>
      <StyledMoreAnchor>
        <Menu
          align="right"
          entries={[
            {
              id: 'whatsapp',
              label: t`Log WhatsApp`,
              icon: 'whatsapp',
              isNoPermission: !canCreate('communication'),
              onSelect: () => openActivity('whatsapp'),
            },
            {
              id: 'linkedin',
              label: t`Log LinkedIn message`,
              icon: 'linkedin',
              isNoPermission: !canCreate('communication'),
              onSelect: () => openActivity('linkedin'),
            },
            {
              id: 'sms',
              label: t`Log SMS`,
              icon: 'sms',
              isNoPermission: !canCreate('communication'),
              onSelect: () => openActivity('sms'),
            },
            ...(moreEntries.length > 0
              ? [{ id: 'more-separator', isSeparator: true as const }]
              : []),
            ...moreEntries,
          ]}
          trigger={({ toggle, isOpen }) => (
            <StyledAction
              type="button"
              aria-expanded={isOpen}
              aria-haspopup="menu"
              onClick={toggle}
            >
              <StyledActionIcon>
                <Icon name="more" size={16} />
              </StyledActionIcon>
              <span>{t`More`}</span>
            </StyledAction>
          )}
        />
      </StyledMoreAnchor>
    </StyledRow>
  );
};
