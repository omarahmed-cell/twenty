import { computeSelectOptionConversions } from 'src/database/commands/upgrade-version-command/2-49/utils/compute-select-option-conversions.util';

describe('computeSelectOptionConversions', () => {
  it('converts each legacy location type to the HubSpot value with the same option id', () => {
    expect(
      computeSelectOptionConversions({
        fromOptions: [
          { id: 'phone', value: 'PHONE_CALL' },
          { id: 'person', value: 'IN_PERSON' },
          { id: 'meet', value: 'GOOGLE_MEET' },
        ],
        toOptions: [
          { id: 'phone', value: 'PHONE' },
          { id: 'person', value: 'ADDRESS' },
          { id: 'custom', value: 'CUSTOM' },
          { id: 'meet', value: 'VIDEO_CONFERENCE' },
        ],
        countByValue: { GOOGLE_MEET: 2, PHONE_CALL: 1 },
      }),
    ).toEqual({
      'PHONE_CALL -> PHONE': 1,
      'IN_PERSON -> ADDRESS': 0,
      'GOOGLE_MEET -> VIDEO_CONFERENCE': 2,
    });
  });

  it('reports nothing once the options already match', () => {
    expect(
      computeSelectOptionConversions({
        fromOptions: [{ id: 'phone', value: 'PHONE' }],
        toOptions: [{ id: 'phone', value: 'PHONE' }],
        countByValue: { PHONE: 3 },
      }),
    ).toEqual({});
  });
});
