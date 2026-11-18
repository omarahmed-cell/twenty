import { styled } from '@linaria/react';

import { ActivityList } from '@/activities/components/ActivityList';
import { SkeletonLoader } from '@/activities/components/SkeletonLoader';
import { EmptyInboxPlaceholder } from '@/activities/emails/components/EmptyInboxPlaceholder';
import { LinkedEmailRow } from '@/activities/unified-emails/components/LinkedEmailRow';
import { useLinkedEmails } from '@/activities/unified-emails/hooks/useLinkedEmails';
import { WidgetHeaderCountEffect } from '@/page-layout/widgets/components/WidgetHeaderCountEffect';
import { StyledWidgetContentContainer } from '@/ui/layout/components/WidgetContentContainer';
import { useTargetRecord } from '@/ui/layout/contexts/useTargetRecord';
import { themeCssVariables } from 'twenty-ui/theme';

const StyledContainer = styled(StyledWidgetContentContainer)`
  gap: ${themeCssVariables.spacing[6]};
  overflow: hidden;
`;

const StyledSection = styled.div`
  display: flex;
  flex: 1;
  min-height: 0;
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
          <StyledSection>
            <ActivityList isScrollable>
              {emails.map((email) => (
                <LinkedEmailRow key={email.id} email={email} divider />
              ))}
            </ActivityList>
          </StyledSection>
        )}
      </StyledContainer>
    </>
  );
};
