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
      dealProbability: null,
      weightedAmount: null,
      isClosed: false,
      isClosedWon: false,
      isClosedLost: false,
      isOpen: true,
      actualDuration: null,
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

  describe('stage probability fields', () => {
    it('weights the amount by the stage probability, in the same currency', () => {
      expect(
        compute({
          stageProbability: 40,
          amountMicros: '10000000000',
          amountCurrencyCode: 'USD',
        }),
      ).toMatchObject({
        dealProbability: 0.4,
        weightedAmount: { amountMicros: 4000000000, currencyCode: 'USD' },
        isOpen: true,
        isClosed: false,
      });
    });

    it('leaves the weighted amount empty without an amount or a probability', () => {
      expect(compute({ stageProbability: 40 }).weightedAmount).toBeNull();
      expect(
        compute({ amountMicros: 5000000, amountCurrencyCode: 'EUR' })
          .weightedAmount,
      ).toBeNull();
    });

    it('reads won, lost and open from the probability alone', () => {
      expect(compute({ stageProbability: 100 })).toMatchObject({
        isClosed: true,
        isClosedWon: true,
        isClosedLost: false,
        isOpen: false,
      });
      expect(compute({ stageProbability: 0 })).toMatchObject({
        isClosed: true,
        isClosedWon: false,
        isClosedLost: true,
        isOpen: false,
        dealProbability: 0,
      });
      expect(compute({ stageProbability: null })).toMatchObject({
        isOpen: true,
        dealProbability: null,
      });
    });
  });

  describe('actualDuration', () => {
    it('counts whole days from creation to Close Date once the deal is closed', () => {
      expect(
        compute({
          stageProbability: 100,
          createdAt: '2026-11-01T10:00:00.000Z',
          closeDate: '2026-11-15T09:00:00.000Z',
        }).actualDuration,
      ).toBe(13);
    });

    it('is empty while the deal is open, even with a Close Date', () => {
      expect(
        compute({
          stageProbability: 80,
          createdAt: '2026-11-01T10:00:00.000Z',
          closeDate: '2026-11-15T09:00:00.000Z',
        }).actualDuration,
      ).toBeNull();
    });

    it('is empty for a closed deal without a Close Date', () => {
      expect(
        compute({ stageProbability: 0, createdAt: '2026-11-01T10:00:00.000Z' })
          .actualDuration,
      ).toBeNull();
    });
  });
});
