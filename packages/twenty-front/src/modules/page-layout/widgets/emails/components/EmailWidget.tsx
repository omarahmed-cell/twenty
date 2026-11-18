import { EmailsCard } from '@/activities/emails/components/EmailsCard';
import { LinkedEmailsCard } from '@/activities/unified-emails/components/LinkedEmailsCard';
import { type PageLayoutWidget } from '@/page-layout/types/PageLayoutWidget';
import { WidgetContentShell } from '@/page-layout/widgets/components/WidgetContentShell';
import { useIsFeatureEnabled } from '@/workspace/hooks/useIsFeatureEnabled';
import { FeatureFlagKey } from '~/generated-metadata/graphql';

type EmailWidgetProps = {
  widget: PageLayoutWidget;
};

export const EmailWidget = ({ widget: _widget }: EmailWidgetProps) => {
  const isUnifiedEmailEnabled = useIsFeatureEnabled(
    FeatureFlagKey.IS_UNIFIED_EMAIL_ENABLED,
  );

  return (
    <WidgetContentShell>
      {isUnifiedEmailEnabled ? <LinkedEmailsCard /> : <EmailsCard />}
    </WidgetContentShell>
  );
};
