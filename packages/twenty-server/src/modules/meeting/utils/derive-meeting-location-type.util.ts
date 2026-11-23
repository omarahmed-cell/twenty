import { isNonEmptyString } from '@sniptt/guards';

// A synced meeting with a video link is a video conference; one with only a place is at an address
export const deriveMeetingLocationType = ({
  conferenceLinkUrl,
  location,
}: {
  conferenceLinkUrl: string | null | undefined;
  location: string | null | undefined;
}): 'VIDEO_CONFERENCE' | 'ADDRESS' | null => {
  if (isNonEmptyString(conferenceLinkUrl?.trim())) {
    return 'VIDEO_CONFERENCE';
  }

  return isNonEmptyString(location?.trim()) ? 'ADDRESS' : null;
};
