import { getLinkedActivityEventLabel } from '@/activities/timeline-activities/rows/generic/utils/getLinkedActivityEventLabel';

describe('getLinkedActivityEventLabel', () => {
  it('should describe a note added to the record', () => {
    expect(
      getLinkedActivityEventLabel({
        action: 'linked',
        objectNameSingular: 'note',
        objectLabel: 'note',
        eventTypeLabel: 'was linked by',
      }),
    ).toBe('added a note');
  });

  it('should describe a task added to the record', () => {
    expect(
      getLinkedActivityEventLabel({
        action: 'linked',
        objectNameSingular: 'task',
        objectLabel: 'task',
      }),
    ).toBe('added a task');
  });

  it('should append the call outcome', () => {
    expect(
      getLinkedActivityEventLabel({
        action: 'linked',
        objectNameSingular: 'call',
        objectLabel: 'call',
        detailLabel: 'Connected',
      }),
    ).toBe('logged a call — Connected');
  });

  it('should say a rep sent an outgoing email, with its subject', () => {
    expect(
      getLinkedActivityEventLabel({
        action: 'linked',
        objectNameSingular: 'email',
        objectLabel: 'email',
        detailLabel: 'Pricing follow-up',
        emailDirection: 'OUTGOING',
      }),
    ).toBe('sent an email · Pricing follow-up');
  });

  it('should say an email was logged when it is not outgoing', () => {
    expect(
      getLinkedActivityEventLabel({
        action: 'linked',
        objectNameSingular: 'email',
        objectLabel: 'email',
        emailDirection: 'INCOMING',
      }),
    ).toBe('logged an email');
  });

  it('should name the channel when a communication is logged', () => {
    expect(
      getLinkedActivityEventLabel({
        action: 'linked',
        objectNameSingular: 'communication',
        objectLabel: 'communication',
        detailLabel: 'WhatsApp',
      }),
    ).toBe('logged a WhatsApp message');
  });

  it('should keep the channel as a detail when a communication is updated', () => {
    expect(
      getLinkedActivityEventLabel({
        action: 'updated',
        objectNameSingular: 'communication',
        objectLabel: 'communication',
        detailLabel: 'SMS',
      }),
    ).toBe('updated a message — SMS');
  });

  it('should describe a removed note', () => {
    expect(
      getLinkedActivityEventLabel({
        action: 'unlinked',
        objectNameSingular: 'note',
        objectLabel: 'note',
      }),
    ).toBe('removed a note');
  });

  it('should name the object of any other linked record', () => {
    expect(
      getLinkedActivityEventLabel({
        action: 'linked',
        objectNameSingular: 'branch',
        objectLabel: 'branch',
      }),
    ).toBe('linked a branch');
  });

  it('should fall back to the event type label without a known action', () => {
    expect(
      getLinkedActivityEventLabel({
        action: null,
        objectNameSingular: 'note',
        objectLabel: 'note',
        eventTypeLabel: 'archived a note',
      }),
    ).toBe('archived a note');
  });
});
