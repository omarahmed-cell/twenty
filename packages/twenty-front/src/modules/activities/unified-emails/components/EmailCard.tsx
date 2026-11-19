import { styled } from '@linaria/react';
import { t } from '@lingui/core/macro';
import { isNonEmptyString } from '@sniptt/guards';
import { Suspense, useState } from 'react';
import { CoreObjectNameSingular } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';
import { IconChevronDown, IconChevronUp } from 'twenty-ui/icon';
import { Tag } from 'twenty-ui/primitives/data-display';
import { themeCssVariables } from 'twenty-ui/theme';

import { MarkdownRenderer } from '@/ai/components/MarkdownRenderer';
import { type LinkedEmail } from '@/activities/unified-emails/types/LinkedEmail';
import { getEmailHeadline } from '@/activities/unified-emails/utils/getEmailHeadline';
import { useFindOneRecord } from '@/object-record/hooks/useFindOneRecord';
import { useOpenRecordInSidePanel } from '@/side-panel/hooks/useOpenRecordInSidePanel';
import { formatToHumanReadableDate } from '~/utils/date-utils';

const StyledCard = styled.div`
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.md};
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
  padding: ${themeCssVariables.spacing[3]};
  width: 100%;
`;

const StyledHeader = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
  min-width: 0;
`;

const StyledHeadline = styled.button`
  background: none;
  border: none;
  color: ${themeCssVariables.font.color.primary};
  cursor: pointer;
  flex: 1;
  font-family: inherit;
  font-size: ${themeCssVariables.font.size.md};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  min-width: 0;
  overflow: hidden;
  padding: 0;
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StyledMeta = styled.div`
  align-items: center;
  color: ${themeCssVariables.font.color.tertiary};
  display: flex;
  flex-shrink: 0;
  font-size: ${themeCssVariables.font.size.sm};
  gap: ${themeCssVariables.spacing[1]};
  white-space: nowrap;
`;

const StyledBodyRow = styled.div`
  align-items: flex-start;
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledPreview = styled.div`
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  color: ${themeCssVariables.font.color.secondary};
  display: -webkit-box;
  flex: 1;
  font-size: ${themeCssVariables.font.size.md};
  overflow: hidden;
`;

const StyledFullBody = styled.div`
  color: ${themeCssVariables.font.color.primary};
  flex: 1;
  font-size: ${themeCssVariables.font.size.md};
  min-width: 0;
  overflow-wrap: anywhere;
`;

const StyledToggle = styled.button`
  align-items: center;
  background: none;
  border: none;
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${themeCssVariables.font.color.tertiary};
  cursor: pointer;
  display: flex;
  flex-shrink: 0;
  padding: ${themeCssVariables.spacing[1]};

  &:hover {
    background: ${themeCssVariables.background.transparent.light};
  }
`;

type EmailCardProps = {
  email: LinkedEmail;
};

export const EmailCard = ({ email }: EmailCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { openRecordInSidePanel } = useOpenRecordInSidePanel();

  const { record: emailWithBody } = useFindOneRecord<{
    __typename: string;
    id: string;
    bodyV2?: { markdown?: string | null } | null;
  }>({
    objectNameSingular: CoreObjectNameSingular.Email,
    objectRecordId: email.id,
    recordGqlFields: { id: true, bodyV2: true },
    skip: !isExpanded,
  });

  const headline = getEmailHeadline(email);
  const openCount = email.openCount ?? 0;
  const clickCount = email.clickCount ?? 0;
  const replyCount = email.replyCount ?? 0;
  const fullBody = emailWithBody?.bodyV2?.markdown;

  const handleOpen = () =>
    openRecordInSidePanel({
      recordId: email.id,
      objectNameSingular: CoreObjectNameSingular.Email,
    });

  return (
    <StyledCard>
      <StyledHeader>
        <StyledHeadline type="button" title={headline} onClick={handleOpen}>
          {headline}
        </StyledHeadline>
        <StyledMeta>
          {email.status === 'FAILED' && <Tag color="red">{t`Failed`}</Tag>}
          {openCount > 0 && <Tag color="green">{t`Opened ${openCount}`}</Tag>}
          {clickCount > 0 && (
            <Tag color="purple">{t`Clicked ${clickCount}`}</Tag>
          )}
          {replyCount > 0 && <Tag color="blue">{t`Replied ${replyCount}`}</Tag>}
          {isDefined(email.sentAt) && formatToHumanReadableDate(email.sentAt)}
        </StyledMeta>
      </StyledHeader>
      <StyledBodyRow>
        {isExpanded ? (
          <StyledFullBody>
            {isNonEmptyString(fullBody) ? (
              <Suspense fallback={email.bodyPreview}>
                <MarkdownRenderer>{fullBody}</MarkdownRenderer>
              </Suspense>
            ) : (
              email.bodyPreview
            )}
          </StyledFullBody>
        ) : (
          <StyledPreview>{email.bodyPreview}</StyledPreview>
        )}
        <StyledToggle
          type="button"
          aria-label={isExpanded ? t`Hide full email` : t`Show full email`}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? (
            <IconChevronUp size={16} />
          ) : (
            <IconChevronDown size={16} />
          )}
        </StyledToggle>
      </StyledBodyRow>
    </StyledCard>
  );
};
