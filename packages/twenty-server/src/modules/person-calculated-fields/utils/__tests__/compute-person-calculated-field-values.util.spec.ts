import {
  computePersonCalculatedFieldValues,
  type PersonCalculationInput,
} from 'src/modules/person-calculated-fields/utils/compute-person-calculated-field-values.util';

const NOW = new Date('2026-11-15T12:00:00.000Z');

const EMPTY_INPUT: PersonCalculationInput = {
  lifecycleStage: null,
  dateEnteredCurrentStage: null,
  dealCreatedDates: null,
  activityDates: null,
};

const compute = (input: Partial<PersonCalculationInput>) =>
  computePersonCalculatedFieldValues({
    input: { ...EMPTY_INPUT, ...input },
    now: NOW,
  });

describe('computePersonCalculatedFieldValues', () => {
  it('leaves every field empty for a person with nothing linked', () => {
    expect(compute({})).toEqual({
      lastActivityDate: null,
      firstDealCreatedDate: null,
      timeInCurrentStage: null,
      nextActivityDate: null,
    });
  });

  describe('lastActivityDate', () => {
    it('picks the latest activity linked to the person', () => {
      expect(
        compute({
          activityDates: [
            { activityType: 'call', date: '2026-11-01T09:00:00.000Z' },
            { activityType: 'note', date: '2026-11-10T09:00:00+00:00' },
            { activityType: 'email', date: '2026-10-01T09:00:00.000Z' },
            { activityType: 'task', date: null },
          ],
        }).lastActivityDate,
      ).toBe('2026-11-10T09:00:00.000Z');
    });

    it('ignores a meeting that has not started yet', () => {
      expect(
        compute({
          activityDates: [
            { activityType: 'calendarEvent', date: '2026-11-20T09:00:00.000Z' },
            { activityType: 'communication', date: '2026-11-02T09:00:00.000Z' },
          ],
        }).lastActivityDate,
      ).toBe('2026-11-02T09:00:00.000Z');
    });
  });

  describe('firstDealCreatedDate', () => {
    it('is the earliest creation date of the deals the person is on', () => {
      expect(
        compute({
          dealCreatedDates: [
            '2026-06-01T08:00:00.000Z',
            '2026-03-15T08:00:00+00:00',
            null,
          ],
        }).firstDealCreatedDate,
      ).toBe('2026-03-15T08:00:00.000Z');
    });

    it('is empty without deals', () => {
      expect(compute({ dealCreatedDates: [] }).firstDealCreatedDate).toBeNull();
    });
  });

  describe('nextActivityDate', () => {
    it('is the earliest upcoming meeting or open task on the contact', () => {
      expect(
        compute({
          nextActivityCandidates: [
            { activityType: 'calendarEvent', date: '2026-11-22T09:00:00.000Z' },
            {
              activityType: 'task',
              date: '2026-11-16T09:00:00.000Z',
              status: 'DONE',
            },
            {
              activityType: 'task',
              date: '2026-11-18T09:00:00.000Z',
              status: 'TODO',
            },
          ],
        }).nextActivityDate,
      ).toBe('2026-11-18T09:00:00.000Z');
    });
  });

  describe('timeInCurrentStage', () => {
    it('counts whole days since the person entered the current stage', () => {
      expect(
        compute({
          lifecycleStage: 'LEAD',
          dateEnteredCurrentStage: '2026-11-12T13:00:00.000Z',
        }).timeInCurrentStage,
      ).toBe(2);
    });

    it('is 0 on the day the stage was entered', () => {
      expect(
        compute({
          lifecycleStage: 'CUSTOMER',
          dateEnteredCurrentStage: '2026-11-15T11:59:00.000Z',
        }).timeInCurrentStage,
      ).toBe(0);
    });

    it('is empty without a stage', () => {
      expect(
        compute({
          lifecycleStage: null,
          dateEnteredCurrentStage: '2026-11-01T00:00:00.000Z',
        }).timeInCurrentStage,
      ).toBeNull();
    });
  });
});
