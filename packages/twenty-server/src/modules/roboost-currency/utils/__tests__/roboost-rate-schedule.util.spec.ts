import {
  computeNextUpdateDate,
  isUpdateDue,
} from 'src/modules/roboost-currency/utils/roboost-rate-schedule.util';

describe('isUpdateDue', () => {
  const now = new Date('2026-11-26T01:00:00Z');

  it('is due when nothing was fetched yet', () => {
    expect(isUpdateDue('MONTHLY', null, now)).toBe(true);
  });

  it('is due daily once per day', () => {
    expect(isUpdateDue('DAILY', new Date('2026-11-25T01:00:00Z'), now)).toBe(
      true,
    );
    expect(isUpdateDue('DAILY', new Date('2026-11-26T00:30:00Z'), now)).toBe(
      false,
    );
  });

  it('is due monthly, quarterly and yearly once per period', () => {
    expect(isUpdateDue('MONTHLY', new Date('2026-11-01T01:00:00Z'), now)).toBe(
      false,
    );
    expect(isUpdateDue('MONTHLY', new Date('2026-10-31T01:00:00Z'), now)).toBe(
      true,
    );
    expect(
      isUpdateDue('QUARTERLY', new Date('2026-10-01T01:00:00Z'), now),
    ).toBe(false);
    expect(
      isUpdateDue('QUARTERLY', new Date('2026-09-30T01:00:00Z'), now),
    ).toBe(true);
    expect(isUpdateDue('YEARLY', new Date('2026-01-01T01:00:00Z'), now)).toBe(
      false,
    );
  });
});

describe('computeNextUpdateDate', () => {
  it('gives the next run day for each frequency', () => {
    const afterRun = new Date('2026-11-26T09:00:00Z');

    expect(computeNextUpdateDate('DAILY', afterRun)).toBe('2026-11-27');
    expect(
      computeNextUpdateDate('DAILY', new Date('2026-11-26T00:20:00Z')),
    ).toBe('2026-11-26');
    expect(computeNextUpdateDate('MONTHLY', afterRun)).toBe('2026-12-01');
    expect(computeNextUpdateDate('QUARTERLY', afterRun)).toBe('2027-01-01');
    expect(computeNextUpdateDate('YEARLY', afterRun)).toBe('2027-01-01');
  });
});
