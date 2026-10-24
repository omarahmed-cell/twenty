import { getLinkedActivityEventLabel } from '@/activities/timeline-activities/rows/generic/utils/getLinkedActivityEventLabel';

describe('getLinkedActivityEventLabel', () => {
  it('should append the call outcome to the event label', () => {
    expect(
      getLinkedActivityEventLabel({
        objectNameSingular: 'call',
        detailLabel: 'Connected',
        eventTypeLabel: 'logged a call',
        isLinkedEvent: true,
      }),
    ).toBe('logged a call — Connected');
  });

  it('should name the channel when a communication is logged', () => {
    expect(
      getLinkedActivityEventLabel({
        objectNameSingular: 'communication',
        detailLabel: 'WhatsApp',
        eventTypeLabel: 'logged a message',
        isLinkedEvent: true,
      }),
    ).toBe('logged a WhatsApp message');
  });

  it('should keep the update wording for an updated communication', () => {
    expect(
      getLinkedActivityEventLabel({
        objectNameSingular: 'communication',
        detailLabel: 'SMS',
        eventTypeLabel: 'updated a related communication',
        isLinkedEvent: false,
      }),
    ).toBe('updated a related communication — SMS');
  });
});
