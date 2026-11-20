import { currentWorkspaceMemberState } from '@/auth/states/currentWorkspaceMemberState';
import { RoboostNewRecordMenu } from '@/roboost-app/components/RoboostNewRecordMenu';
import { roboostTopBarTitleState } from '@/roboost-app/states/roboostTopBarTitleState';
import { Avatar } from '@/roboost-ui/components/Avatar';
import { Icon } from '@/roboost-ui/components/Icon';
import { ROBOOST_UI_THEME } from '@/roboost-ui/constants/RoboostUiTheme';
import { useOpenRecordsSearchPageInSidePanel } from '@/side-panel/hooks/useOpenRecordsSearchPageInSidePanel';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { Link } from 'react-router-dom';
import { isNonEmptyString } from '@sniptt/guards';

const StyledTitle = styled.span`
  color: ${ROBOOST_UI_THEME.text};
  font-family: ${ROBOOST_UI_THEME.fontDisplay};
  font-size: 15px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StyledSpacer = styled.span`
  flex: 1;
`;

// Looks like the design's search input but opens the existing search panel
const StyledSearch = styled.button<{ isWide: boolean }>`
  align-items: center;
  background: ${ROBOOST_UI_THEME.surface};
  border: 1px solid ${ROBOOST_UI_THEME.borderStrong};
  border-radius: ${ROBOOST_UI_THEME.radiusSm};
  color: ${ROBOOST_UI_THEME.textMuted};
  cursor: text;
  display: flex;
  flex: none;
  font-family: ${ROBOOST_UI_THEME.fontSans};
  font-size: 13px;
  gap: 8px;
  height: 28px;
  max-width: ${({ isWide }) => (isWide ? '42vw' : '34vw')};
  padding: 0 12px;
  width: ${({ isWide }) => (isWide ? '360px' : '300px')};

  &:hover {
    border-color: ${ROBOOST_UI_THEME.controlHoverBorder};
  }

  &:focus-visible {
    border-color: ${ROBOOST_UI_THEME.accent};
    box-shadow: ${ROBOOST_UI_THEME.shadowFocus};
    outline: none;
  }
`;

const StyledAvatarLink = styled(Link)`
  border-radius: 999px;
  display: inline-flex;
  text-decoration: none;

  &:focus-visible {
    box-shadow: ${ROBOOST_UI_THEME.shadowFocus};
    outline: none;
  }
`;

export const RoboostTopBar = () => {
  const { t } = useLingui();
  const currentWorkspaceMember = useAtomStateValue(currentWorkspaceMemberState);
  const roboostTopBarTitle = useAtomStateValue(roboostTopBarTitleState);
  const { openRecordsSearchPage } = useOpenRecordsSearchPageInSidePanel();

  const memberName = [
    currentWorkspaceMember?.name?.firstName,
    currentWorkspaceMember?.name?.lastName,
  ]
    .filter(isNonEmptyString)
    .join(' ');

  const hasTitle = isNonEmptyString(roboostTopBarTitle);

  const search = (
    <StyledSearch
      type="button"
      isWide={!hasTitle}
      aria-label={t`Search Roboost CRM`}
      onClick={openRecordsSearchPage}
    >
      <Icon name="search" />
      {t`Search Roboost CRM`}
    </StyledSearch>
  );

  return (
    <>
      {hasTitle && <StyledTitle>{roboostTopBarTitle}</StyledTitle>}
      {!hasTitle && search}
      <StyledSpacer />
      {hasTitle && search}
      <RoboostNewRecordMenu />
      <StyledAvatarLink to="/settings/profile" aria-label={t`Your profile`}>
        <Avatar
          name={memberName}
          src={currentWorkspaceMember?.avatarUrl}
          size="sm"
          tone="accent"
        />
      </StyledAvatarLink>
    </>
  );
};
