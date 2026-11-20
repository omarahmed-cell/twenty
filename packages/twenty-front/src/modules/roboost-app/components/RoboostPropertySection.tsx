import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { formatRoboostFieldValue } from '@/roboost-app/utils/formatRoboostFieldValue';
import { Icon } from '@/roboost-ui/components/Icon';
import { ROBOOST_UI_THEME } from '@/roboost-ui/constants/RoboostUiTheme';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { Link } from 'react-router-dom';

const StyledSection = styled.div`
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
  flex: 1;
  font-size: 13px;
  font-weight: 600;
  line-height: 18px;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StyledActionLink = styled(Link)`
  align-items: center;
  border-radius: ${ROBOOST_UI_THEME.radiusSm};
  color: ${ROBOOST_UI_THEME.textSecondary};
  display: inline-flex;
  font-size: 12px;
  font-weight: 500;
  height: 26px;
  padding: 0 8px;
  text-decoration: none;

  &:hover {
    background: ${ROBOOST_UI_THEME.surfaceHover};
    color: ${ROBOOST_UI_THEME.text};
  }
`;

const StyledIconLink = styled(Link)`
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
  display: grid;
  gap: 12px 14px;
  grid-template-columns: 1fr 1fr;
  padding: 10px 0 2px;
`;

const StyledProperty = styled.div`
  min-width: 0;
`;

const StyledLabel = styled.div`
  color: ${ROBOOST_UI_THEME.textMuted};
  font-size: 12px;
  line-height: 15px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StyledValue = styled.div`
  color: ${ROBOOST_UI_THEME.text};
  font-size: 13px;
  line-height: 18px;
  margin-top: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

type RoboostPropertySectionProps = {
  title: string;
  fields: FieldMetadataItem[];
  record: ObjectRecord;
  defaultOpen: boolean;
  editPath: string;
  settingsPath: string;
};

export const RoboostPropertySection = ({
  title,
  fields,
  record,
  defaultOpen,
  editPath,
  settingsPath,
}: RoboostPropertySectionProps) => {
  const { t } = useLingui();
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <StyledSection>
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
        <StyledTitle title={title}>{title}</StyledTitle>
        <StyledActionLink to={editPath}>{t`Actions`}</StyledActionLink>
        <StyledIconLink to={settingsPath} aria-label={t`Section settings`}>
          <Icon name="settings" size={16} />
        </StyledIconLink>
      </StyledHead>
      {isOpen && (
        <StyledBody>
          {fields.map((field) => {
            const value = formatRoboostFieldValue(field, record[field.name]);

            return (
              <StyledProperty key={field.id}>
                <StyledLabel title={field.label}>{field.label}</StyledLabel>
                <StyledValue title={value}>{value}</StyledValue>
              </StyledProperty>
            );
          })}
        </StyledBody>
      )}
    </StyledSection>
  );
};
