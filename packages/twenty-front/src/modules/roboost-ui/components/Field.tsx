import { Icon } from '@/roboost-ui/components/Icon';
import { ROBOOST_UI_THEME } from '@/roboost-ui/constants/RoboostUiTheme';
import { styled } from '@linaria/react';
import { type ReactNode } from 'react';

const StyledField = styled.label`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const StyledLabel = styled.span`
  color: ${ROBOOST_UI_THEME.textSecondary};
  font-size: 13px;
  font-weight: 500;
  line-height: 16px;
`;

const StyledRequired = styled.span`
  color: ${ROBOOST_UI_THEME.dangerText};
  margin-left: 2px;
`;

const StyledHint = styled.span`
  color: ${ROBOOST_UI_THEME.textMuted};
  font-size: 12px;
  line-height: 16px;
`;

const StyledError = styled.span`
  align-items: center;
  color: ${ROBOOST_UI_THEME.dangerText};
  display: flex;
  font-size: 12px;
  gap: 4px;
  line-height: 16px;
`;

export type FieldProps = {
  label?: ReactNode;
  required?: boolean;
  hint?: ReactNode;
  error?: ReactNode;
  children?: ReactNode;
  className?: string;
};

export const Field = ({
  label,
  required,
  hint,
  error,
  children,
  className,
}: FieldProps) => (
  <StyledField className={className}>
    {label !== undefined && (
      <StyledLabel>
        {label}
        {required === true && <StyledRequired>*</StyledRequired>}
      </StyledLabel>
    )}
    {children}
    {error !== undefined ? (
      <StyledError>
        <Icon name="alert-triangle" size={14} />
        {error}
      </StyledError>
    ) : (
      hint !== undefined && <StyledHint>{hint}</StyledHint>
    )}
  </StyledField>
);
