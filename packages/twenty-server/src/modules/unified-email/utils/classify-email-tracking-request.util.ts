import { isNonEmptyString } from '@sniptt/guards';

import { classifyEngagementUserAgent } from 'src/modules/emailing/utils/classify-engagement-user-agent.util';

export const OPEN_GRACE_PERIOD_MS = 10_000;

const MAIL_IMAGE_PROXY_PATTERN = /GoogleImageProxy|ggpht\.com|YahooMailProxy/i;

export type EmailTrackingRequestClassification = {
  isProxy: boolean;
  isSender: boolean;
  isCounted: boolean;
};

// Gmail fetches every image through its proxy, so a proxied open is a real open; Apple's privacy proxy
// prefetches on delivery and scanners click every link, so those are recorded but not counted
export const classifyEmailTrackingRequest = ({
  type,
  userAgent,
  hasSenderSession,
  occurredAt,
  sentAt,
}: {
  type: 'OPEN' | 'CLICK';
  userAgent: string | null;
  hasSenderSession: boolean;
  occurredAt: Date;
  sentAt: Date | null;
}): EmailTrackingRequestClassification => {
  const userAgentClass = classifyEngagementUserAgent(userAgent);
  const isMailImageProxy =
    isNonEmptyString(userAgent) && MAIL_IMAGE_PROXY_PATTERN.test(userAgent);
  const isPrivacyProxy = userAgentClass === 'PRIVACY_PROXY';
  const isAutomation = userAgentClass === 'SUSPECTED_AUTOMATION';

  const isWithinGracePeriod =
    type === 'OPEN' &&
    sentAt !== null &&
    occurredAt.getTime() - sentAt.getTime() < OPEN_GRACE_PERIOD_MS;

  return {
    isProxy: isMailImageProxy || isPrivacyProxy,
    isSender: hasSenderSession,
    isCounted:
      !hasSenderSession &&
      !isPrivacyProxy &&
      !isWithinGracePeriod &&
      !(isAutomation && !isMailImageProxy),
  };
};
