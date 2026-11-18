import { styled } from '@linaria/react';

import { ActivityRow } from '@/activities/components/ActivityRow';
import { type LinkedEmail } from '@/activities/unified-emails/types/LinkedEmail';
import { useOpenRecordInSidePanel } from '@/side-panel/hooks/useOpenRecordInSidePanel';
import { t } from '@lingui/core/macro';
import { isNonEmptyString } from '@sniptt/guards';
import { CoreObjectNameSingular } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';
import { IconInbox, IconSend } from 'twenty-ui/icon';
import { Tag } from 'twenty-ui/primitives/data-display';
import { themeCssVariables } from 'twenty-ui/theme';
import { formatToHumanReadableDate } from '~/utils/date-utils';

const StyledCorrespondent = styled.span`
  align-items: center;
  color: ${themeCssVariables.font.color.secondary};
  display: flex;
  flex-shrink: 0;
  gap: ${themeCssVariables.spacing[1]};
  max-width: 25%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StyledSubjectAndBody = styled.div`
  align-items: center;
  display: flex;
  flex: 1;
  gap: ${themeCssVariables.spacing[2]};
  overflow: hidden;
`;

const StyledSubject = styled.span`
  color: ${themeCssVariables.font.color.primary};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StyledBody = styled.span`
  color: ${themeCssVariables.font.color.tertiary};
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StyledSentAt = styled.div`
  font-size: ${themeCssVariables.font.size.sm};
  padding: ${themeCssVariables.spacing[0]} ${themeCssVariables.spacing[1]};
  white-space: nowrap;
`;

type LinkedEmailRowProps = {
  email: LinkedEmail;
  divider?: boolean;
};

export const LinkedEmailRow = ({
  email,
  divider = false,
}: LinkedEmailRowProps) => {
  const { openRecordInSidePanel } = useOpenRecordInSidePanel();

  const isInbound = email.direction === 'INCOMING';
  const correspondent = (isInbound ? email.from : email.to) ?? '';
  const subject = isNonEmptyString(email.subject)
    ? email.subject
    : t`(no subject)`;
  const openCount = email.openCount ?? 0;
  const replyCount = email.replyCount ?? 0;

  const handleClick = () =>
    openRecordInSidePanel({
      recordId: email.id,
      objectNameSingular: CoreObjectNameSingular.Email,
    });

  return (
    <ActivityRow onClick={handleClick} divider={divider} label={subject}>
      <StyledCorrespondent>
        {isInbound ? <IconInbox size={14} /> : <IconSend size={14} />}
        {correspondent}
      </StyledCorrespondent>
      <StyledSubjectAndBody>
        {email.status === 'FAILED' && <Tag color="red">{t`Failed`}</Tag>}
        <StyledSubject>{subject}</StyledSubject>
        <StyledBody>{email.bodyPreview}</StyledBody>
        {openCount > 0 && <Tag color="green">{t`Opened ${openCount}`}</Tag>}
        {replyCount > 0 && <Tag color="blue">{t`Replied`}</Tag>}
      </StyledSubjectAndBody>
      <StyledSentAt>
        {isDefined(email.sentAt) ? formatToHumanReadableDate(email.sentAt) : ''}
      </StyledSentAt>
    </ActivityRow>
  );
};
