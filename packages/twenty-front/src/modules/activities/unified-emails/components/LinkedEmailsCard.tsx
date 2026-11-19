import { styled } from '@linaria/react';

import { SkeletonLoader } from '@/activities/components/SkeletonLoader';
import { EmptyInboxPlaceholder } from '@/activities/emails/components/EmptyInboxPlaceholder';
import { EmailCard } from '@/activities/unified-emails/components/EmailCard';
import { useLinkedEmails } from '@/activities/unified-emails/hooks/useLinkedEmails';
import { WidgetHeaderCountEffect } from '@/page-layout/widgets/components/WidgetHeaderCountEffect';
import { StyledWidgetContentContainer } from '@/ui/layout/components/WidgetContentContainer';
import { useTargetRecord } from '@/ui/layout/contexts/useTargetRecord';
import { themeCssVariables } from 'twenty-ui/theme';

const StyledContainer = styled(StyledWidgetContentContainer)`
  overflow: hidden;
`;

const StyledList = styled.div`
  box-sizing: border-box;
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
  min-height: 0;
  overflow-y: auto;
  padding: ${themeCssVariables.spacing[1]};
`;

export const LinkedEmailsCard = () => {
  const targetRecord = useTargetRecord();
  const { emails, loading } = useLinkedEmails(targetRecord);

  if (loading && emails.length === 0) {
    return <SkeletonLoader />;
  }

  return (
    <>
      <WidgetHeaderCountEffect count={emails.length} />
      <StyledContainer>
        {emails.length === 0 ? (
          <EmptyInboxPlaceholder />
        ) : (
          <StyledList>
            {emails.map((email) => (
              <EmailCard key={email.id} email={email} />
            ))}
          </StyledList>
        )}
      </StyledContainer>
    </>
  );
};
