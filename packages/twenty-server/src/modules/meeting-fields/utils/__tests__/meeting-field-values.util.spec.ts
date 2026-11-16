import { deriveCalendarEventLocationType } from 'src/modules/meeting-fields/utils/derive-calendar-event-location-type.util';
import {
  computeHasMeetingTranscript,
  resolveMeetingSource,
} from 'src/modules/meeting-fields/utils/meeting-field-values.util';

describe('computeHasMeetingTranscript', () => {
  it('is Yes with a transcript link and No once it is cleared', () => {
    expect(
      computeHasMeetingTranscript({
        transcriptUrl: 'https://docs.example.com/t',
        hubspotHasTranscript: null,
      }),
    ).toBe(true);
    expect(
      computeHasMeetingTranscript({
        transcriptUrl: '',
        hubspotHasTranscript: null,
      }),
    ).toBe(false);
  });

  it('is Yes without a link when HubSpot had a transcript', () => {
    expect(
      computeHasMeetingTranscript({
        transcriptUrl: null,
        hubspotHasTranscript: true,
      }),
    ).toBe(true);
  });
});

describe('resolveMeetingSource', () => {
  const resolve = (
    createdBySource: string | null,
    flags: { isWorkflowWrite?: boolean; isCalendarSynced?: boolean } = {},
  ) =>
    resolveMeetingSource({
      createdBySource,
      isWorkflowWrite: flags.isWorkflowWrite ?? false,
      isCalendarSynced: flags.isCalendarSynced ?? false,
    });

  it('maps each creation path', () => {
    expect(resolve('MANUAL')).toBe('LOGGED_IN_TWENTY');
    expect(resolve('API')).toBe('API');
    expect(resolve('WORKFLOW')).toBe('WORKFLOW');
    expect(resolve('IMPORT')).toBe('IMPORT');
    expect(resolve('CALENDAR')).toBe('CALENDAR_SYNC');
  });

  it('prefers the calendar sync and workflow paths over the write actor', () => {
    expect(resolve('MANUAL', { isCalendarSynced: true })).toBe('CALENDAR_SYNC');
    expect(resolve('MANUAL', { isWorkflowWrite: true })).toBe('WORKFLOW');
  });

  it('leaves unknown creators empty', () => {
    expect(resolve('AGENT')).toBeNull();
    expect(resolve(null)).toBeNull();
  });
});

describe('deriveCalendarEventLocationType', () => {
  it('sets a video conference for a video link, an address for a place', () => {
    expect(
      deriveCalendarEventLocationType({
        conferenceLinkUrl: 'https://meet.google.com/abc',
        location: 'HQ',
      }),
    ).toBe('VIDEO_CONFERENCE');
    expect(
      deriveCalendarEventLocationType({
        conferenceLinkUrl: '',
        location: '12 Nile St, Cairo',
      }),
    ).toBe('ADDRESS');
    expect(
      deriveCalendarEventLocationType({
        conferenceLinkUrl: null,
        location: ' ',
      }),
    ).toBeNull();
  });
});
