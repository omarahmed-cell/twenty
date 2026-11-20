import { Avatar } from '@/roboost-ui/components/Avatar';
import { Button } from '@/roboost-ui/components/Button';
import { Icon } from '@/roboost-ui/components/Icon';
import { Tag } from '@/roboost-ui/components/Tag';
import { ROBOOST_UI_THEME } from '@/roboost-ui/constants/RoboostUiTheme';
import { type RoboostTone } from '@/roboost-ui/types/RoboostTone';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { Link } from 'react-router-dom';

const COLLAPSED_CARD_COUNT = 3;

const StyledGroup = styled.div`
  display: flex;
  flex-direction: column;
`;

const StyledHead = styled.div`
  align-items: center;
  display: flex;
  gap: 8px;
`;

const StyledChevron = styled.button<{ isOpen: boolean }>`
  background: none;
  border: none;
  border-radius: ${ROBOOST_UI_THEME.radiusXs};
  color: ${ROBOOST_UI_THEME.textMuted};
  cursor: pointer;
  display: inline-flex;
  padding: 2px;
  transform: ${({ isOpen }) => (isOpen ? 'none' : 'rotate(-90deg)')};

  &:hover {
    background: ${ROBOOST_UI_THEME.surfaceHover};
    color: ${ROBOOST_UI_THEME.text};
  }
`;

const StyledTitle = styled.span`
  color: ${ROBOOST_UI_THEME.text};
  font-size: 13px;
  font-weight: 600;
  line-height: 18px;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StyledCount = styled.span`
  align-items: center;
  background: ${ROBOOST_UI_THEME.surfaceSunken};
  border-radius: 999px;
  color: ${ROBOOST_UI_THEME.textMuted};
  display: inline-flex;
  font-size: 11px;
  font-weight: 600;
  height: 18px;
  justify-content: center;
  line-height: 18px;
  min-width: 18px;
  padding: 0 5px;
`;

const StyledSpacer = styled.span`
  flex: 1;
`;

const StyledSettingsLink = styled(Link)`
  align-items: center;
  border-radius: ${ROBOOST_UI_THEME.radiusSm};
  color: ${ROBOOST_UI_THEME.textSecondary};
  display: inline-flex;
  height: 26px;
  justify-content: center;
  width: 26px;

  &:hover {
    background: ${ROBOOST_UI_THEME.surfaceHover};
    color: ${ROBOOST_UI_THEME.text};
  }
`;

const StyledBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px 0 2px;
`;

const StyledCard = styled(Link)`
  background: ${ROBOOST_UI_THEME.surfaceSunken};
  border: 1px solid ${ROBOOST_UI_THEME.borderSubtle};
  border-radius: ${ROBOOST_UI_THEME.radiusSm};
  color: inherit;
  display: block;
  min-width: 0;
  padding: 8px 10px;
  text-decoration: none;

  &:hover {
    border-color: ${ROBOOST_UI_THEME.border};
  }
`;

const StyledCardTop = styled.div`
  align-items: center;
  display: flex;
  gap: 8px;
`;

const StyledCardName = styled.span`
  color: ${ROBOOST_UI_THEME.text};
  flex: 1;
  font-size: 13px;
  font-weight: 500;
  line-height: 16px;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StyledLines = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-top: 6px;
`;

const StyledLine = styled.div`
  color: ${ROBOOST_UI_THEME.textSecondary};
  font-size: 12px;
  line-height: 16px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StyledLineKey = styled.span`
  color: ${ROBOOST_UI_THEME.textMuted};
`;

const StyledViewAll = styled.button`
  align-self: flex-start;
  background: none;
  border: none;
  color: ${ROBOOST_UI_THEME.accentText};
  cursor: pointer;
  font-family: ${ROBOOST_UI_THEME.fontSans};
  font-size: 13px;
  font-weight: 500;
  line-height: 16px;
  margin-top: 2px;
  padding: 0;
`;

const StyledEmpty = styled.div`
  align-items: flex-start;
  background: ${ROBOOST_UI_THEME.surfaceSunken};
  border: 1px dashed ${ROBOOST_UI_THEME.borderStrong};
  border-radius: ${ROBOOST_UI_THEME.radiusSm};
  color: ${ROBOOST_UI_THEME.textMuted};
  display: flex;
  flex-direction: column;
  font-size: 13px;
  gap: 8px;
  line-height: 18px;
  padding: 12px;
`;

export type RoboostAssociationCard = {
  id: string;
  name: string;
  avatarUrl?: string | null;
  href: string;
  tag?: { tone: RoboostTone; label: string };
  lines: { label: string; value: string }[];
};

type RoboostAssociationGroupProps = {
  title: string;
  count: number;
  cards: RoboostAssociationCard[];
  addLabel: string;
  onAdd?: () => void;
  settingsPath: string;
  defaultOpen: boolean;
  emptyLabel: string;
};

export const RoboostAssociationGroup = ({
  title,
  count,
  cards,
  addLabel,
  onAdd,
  settingsPath,
  defaultOpen,
  emptyLabel,
}: RoboostAssociationGroupProps) => {
  const { t } = useLingui();
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [isShowingAll, setIsShowingAll] = useState(false);
  const shownCards = isShowingAll
    ? cards
    : cards.slice(0, COLLAPSED_CARD_COUNT);

  return (
    <StyledGroup>
      <StyledHead>
        <StyledChevron
          type="button"
          isOpen={isOpen}
          aria-label={t`Toggle ${title}`}
          aria-expanded={isOpen}
          onClick={() => setIsOpen(!isOpen)}
        >
          <Icon name="caret" size={14} />
        </StyledChevron>
        <StyledTitle>{title}</StyledTitle>
        <StyledCount>{count}</StyledCount>
        <StyledSpacer />
        {onAdd !== undefined && (
          <Button variant="ghost" size="sm" icon="plus" onClick={onAdd}>
            {t`Add`}
          </Button>
        )}
        <StyledSettingsLink to={settingsPath} aria-label={t`${title} settings`}>
          <Icon name="settings" size={16} />
        </StyledSettingsLink>
      </StyledHead>
      {isOpen && (
        <StyledBody>
          {cards.length === 0 ? (
            <StyledEmpty>
              <span>{emptyLabel}</span>
              {onAdd !== undefined && (
                <Button
                  variant="secondary"
                  size="sm"
                  icon="plus"
                  onClick={onAdd}
                >
                  {addLabel}
                </Button>
              )}
            </StyledEmpty>
          ) : (
            <>
              {shownCards.map((card) => (
                <StyledCard key={card.id} to={card.href}>
                  <StyledCardTop>
                    <Avatar name={card.name} src={card.avatarUrl} size="sm" />
                    <StyledCardName title={card.name}>
                      {card.name}
                    </StyledCardName>
                    {card.tag !== undefined && (
                      <Tag tone={card.tag.tone}>{card.tag.label}</Tag>
                    )}
                  </StyledCardTop>
                  {card.lines.length > 0 && (
                    <StyledLines>
                      {card.lines.map((line) => (
                        <StyledLine key={line.label} title={line.value}>
                          <StyledLineKey>{line.label} · </StyledLineKey>
                          {line.value}
                        </StyledLine>
                      ))}
                    </StyledLines>
                  )}
                </StyledCard>
              ))}
              {cards.length > COLLAPSED_CARD_COUNT && (
                <StyledViewAll
                  type="button"
                  onClick={() => setIsShowingAll(!isShowingAll)}
                >
                  {isShowingAll
                    ? t`Show fewer`
                    : t`View all ${count} ${title.toLowerCase()}`}
                </StyledViewAll>
              )}
            </>
          )}
        </StyledBody>
      )}
    </StyledGroup>
  );
};
