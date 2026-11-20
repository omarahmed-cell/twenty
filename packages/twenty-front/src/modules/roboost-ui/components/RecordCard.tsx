import { Avatar } from '@/roboost-ui/components/Avatar';
import { Button } from '@/roboost-ui/components/Button';
import { Tag } from '@/roboost-ui/components/Tag';
import { ROBOOST_UI_THEME } from '@/roboost-ui/constants/RoboostUiTheme';
import { type RoboostAvatarTone } from '@/roboost-ui/types/RoboostAvatarTone';
import { type RoboostTone } from '@/roboost-ui/types/RoboostTone';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { Fragment, type ReactNode } from 'react';

const StyledCard = styled.div`
  background: ${ROBOOST_UI_THEME.surface};
  border: 1px solid ${ROBOOST_UI_THEME.border};
  border-radius: ${ROBOOST_UI_THEME.radiusMd};
  box-shadow: ${ROBOOST_UI_THEME.shadowSm};
  overflow: hidden;
  width: 320px;
`;

const StyledHead = styled.div`
  align-items: flex-start;
  display: flex;
  gap: 12px;
  padding: 16px;
`;

const StyledTitle = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
`;

const StyledName = styled.span`
  color: ${ROBOOST_UI_THEME.text};
  font-family: ${ROBOOST_UI_THEME.fontDisplay};
  font-size: 16px;
  font-weight: 600;
  line-height: 20px;
`;

const StyledSubtitle = styled.span`
  color: ${ROBOOST_UI_THEME.textMuted};
  font-size: 13px;
`;

const StyledStatus = styled.span`
  margin-top: 6px;
`;

const StyledFields = styled.dl`
  display: grid;
  gap: 8px 12px;
  grid-template-columns: 96px 1fr;
  margin: 0;
  padding: 4px 16px 12px;

  dt {
    color: ${ROBOOST_UI_THEME.textMuted};
    font-size: 12px;
    padding-top: 1px;
  }

  dd {
    color: ${ROBOOST_UI_THEME.text};
    font-size: 13px;
    margin: 0;
  }
`;

const StyledFoot = styled.div`
  background: ${ROBOOST_UI_THEME.surfaceSunken};
  border-top: 1px solid ${ROBOOST_UI_THEME.borderSubtle};
  display: flex;
  gap: 8px;
  padding: 12px 16px;
`;

export type RecordField = { label: ReactNode; value: ReactNode };

export type RecordCardProps = {
  name: string;
  subtitle?: ReactNode;
  avatar?: string;
  avatarTone?: RoboostAvatarTone;
  status?: { tone: RoboostTone; label: ReactNode };
  fields?: RecordField[];
  actions?: ReactNode;
  onMore?: () => void;
  className?: string;
};

export const RecordCard = ({
  name,
  subtitle,
  avatar,
  avatarTone,
  status,
  fields = [],
  actions,
  onMore,
  className,
}: RecordCardProps) => {
  const { t } = useLingui();

  return (
    <StyledCard className={className}>
      <StyledHead>
        <Avatar name={name} src={avatar} size="lg" tone={avatarTone} />
        <StyledTitle>
          <StyledName>{name}</StyledName>
          {subtitle !== undefined && (
            <StyledSubtitle>{subtitle}</StyledSubtitle>
          )}
          {status !== undefined && (
            <StyledStatus>
              <Tag tone={status.tone} dot>
                {status.label}
              </Tag>
            </StyledStatus>
          )}
        </StyledTitle>
        {onMore !== undefined && (
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            icon="more"
            aria-label={t`More`}
            onClick={onMore}
          />
        )}
      </StyledHead>
      {fields.length > 0 && (
        <StyledFields>
          {fields.map((field, index) => (
            <Fragment key={index}>
              <dt>{field.label}</dt>
              <dd>{field.value}</dd>
            </Fragment>
          ))}
        </StyledFields>
      )}
      {actions !== undefined && <StyledFoot>{actions}</StyledFoot>}
    </StyledCard>
  );
};
