import {
  computeOpportunityCalculatedFieldValues,
  type OpportunityCalculationInput,
} from 'src/modules/opportunity-calculated-fields/utils/compute-opportunity-calculated-field-values.util';

const NOW = new Date('2026-11-15T12:00:00.000Z');
const PERSON_A = '11111111-1111-4111-8111-111111111111';
const PERSON_B = '22222222-2222-4222-8222-222222222222';

const EMPTY_INPUT: OpportunityCalculationInput = {
  pointOfContactId: null,
  contactPersonIds: null,
  lineItemCount: 0,
  activityDates: null,
  nextActivityCandidates: null,
};

const compute = (input: Partial<OpportunityCalculationInput>) =>
  computeOpportunityCalculatedFieldValues({
    input: { ...EMPTY_INPUT, ...input },
    now: NOW,
  });

describe('computeOpportunityCalculatedFieldValues', () => {
  it('leaves the dates empty and the counts at 0 for a bare deal', () => {
    expect(compute({})).toEqual({
      lastActivityDate: null,
      nextActivityDate: null,
      numberOfAssociatedContacts: 0,
      numberOfAssociatedLineItems: 0,
    });
  });

  describe('numberOfAssociatedContacts', () => {
    it('counts a contact who is also the point of contact once', () => {
      expect(
        compute({
          contactPersonIds: [PERSON_A, PERSON_B],
          pointOfContactId: PERSON_A,
        }).numberOfAssociatedContacts,
      ).toBe(2);
    });

    it('counts the point of contact when nobody else is on the deal', () => {
      expect(
        compute({ pointOfContactId: PERSON_B }).numberOfAssociatedContacts,
      ).toBe(1);
    });

    it('counts a person linked twice once', () => {
      expect(
        compute({ contactPersonIds: [PERSON_A, PERSON_A, null] })
          .numberOfAssociatedContacts,
      ).toBe(1);
    });
  });

  it('passes the line item count through', () => {
    expect(compute({ lineItemCount: 3 }).numberOfAssociatedLineItems).toBe(3);
  });

  it('picks the latest past activity and the earliest upcoming one', () => {
    expect(
      compute({
        activityDates: [
          { activityType: 'note', date: '2026-11-10T09:00:00.000Z' },
          { activityType: 'calendarEvent', date: '2026-11-20T09:00:00.000Z' },
        ],
        nextActivityCandidates: [
          { activityType: 'calendarEvent', date: '2026-11-22T09:00:00.000Z' },
          {
            activityType: 'task',
            date: '2026-11-16T09:00:00.000Z',
            status: 'TODO',
          },
        ],
      }),
    ).toMatchObject({
      lastActivityDate: '2026-11-10T09:00:00.000Z',
      nextActivityDate: '2026-11-16T09:00:00.000Z',
    });
  });
});
