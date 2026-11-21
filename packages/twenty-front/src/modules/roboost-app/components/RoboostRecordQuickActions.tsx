import { useComposeEmailForTargetRecord } from '@/activities/emails/hooks/useComposeEmailForTargetRecord';
import { useOpenRoboostCreatePanel } from '@/roboost-app/hooks/useOpenRoboostCreatePanel';
import { type ActivityTargetableObject } from '@/activities/types/ActivityTargetableEntity';
import { Icon } from '@/roboost-ui/components/Icon';
import { Menu, type MenuEntry } from '@/roboost-ui/components/Menu';
import { ROBOOST_UI_THEME } from '@/roboost-ui/constants/RoboostUiTheme';
import { type RoboostIconName } from '@/roboost-ui/types/RoboostIconName';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { CoreObjectNameSingular } from 'twenty-shared/types';

const StyledRow = styled.div`
  display: flex;
  gap: 6px;
`;

const StyledAction = styled.button`
  align-items: center;
  background: transparent;
  border: 1px solid ${ROBOOST_UI_THEME.border};
  border-radius: ${ROBOOST_UI_THEME.radiusSm};
  color: ${ROBOOST_UI_THEME.textSecondary};
  cursor: pointer;
  display: flex;
  flex: 1;
  flex-direction: column;
  font-family: ${ROBOOST_UI_THEME.fontSans};
  font-size: 11px;
  font-weight: 500;
  gap: 5px;
  line-height: 13px;
  min-width: 0;
  padding: 8px 2px;

  &:hover:not(:disabled) {
    background: ${ROBOOST_UI_THEME.surfaceHover};
    border-color: ${ROBOOST_UI_THEME.borderStrong};
    color: ${ROBOOST_UI_THEME.text};
  }

  &:hover:not(:disabled) > span:first-child {
    background: ${ROBOOST_UI_THEME.accentSoft};
    color: ${ROBOOST_UI_THEME.accentText};
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

const StyledActionIcon = styled.span`
  align-items: center;
  background: ${ROBOOST_UI_THEME.surfaceSunken};
  border-radius: 999px;
  color: ${ROBOOST_UI_THEME.textSecondary};
  display: flex;
  height: 30px;
  justify-content: center;
  width: 30px;
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
  onOpenMeetings: () => void;
  moreEntries: MenuEntry[];
};

export const RoboostRecordQuickActions = ({
  targetRecord,
  onOpenMeetings,
  moreEntries,
}: RoboostRecordQuickActionsProps) => {
  const { t } = useLingui();
  const openCreatePanel = useOpenRoboostCreatePanel();

  const openActivity = (objectNameSingular: string) =>
    openCreatePanel({
      objectNameSingular,
      linkToRecord: {
        objectNameSingular: targetRecord.targetObjectNameSingular,
        recordId: targetRecord.id,
      },
    });

  const { openComposer } = useComposeEmailForTargetRecord(targetRecord);

  const actions: {
    key: string;
    label: string;
    icon: RoboostIconName;
    onClick: () => void;
    isDisabled?: boolean;
  }[] = [
    {
      key: 'note',
      label: t`Note`,
      icon: 'note',
      onClick: () => openActivity(CoreObjectNameSingular.Note),
    },
    { key: 'email', label: t`Email`, icon: 'mail', onClick: openComposer },
    {
      key: 'call',
      label: t`Call`,
      icon: 'phone',
      onClick: () => openActivity(CoreObjectNameSingular.Call),
    },
    {
      key: 'task',
      label: t`Task`,
      icon: 'tasks',
      onClick: () => openActivity(CoreObjectNameSingular.Task),
    },
    {
      key: 'meeting',
      label: t`Meeting`,
      icon: 'calendar',
      onClick: onOpenMeetings,
    },
  ];

  return (
    <StyledRow>
      {actions.map((action) => (
        <StyledAction
          key={action.key}
          type="button"
          disabled={action.isDisabled}
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
          align="right"
          entries={moreEntries}
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
