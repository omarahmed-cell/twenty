import {
  getPropertyHistoryLimit,
  parsePropertyHistoryLimits,
} from 'src/modules/timeline/utils/get-property-history-limit.util';

describe('parsePropertyHistoryLimits', () => {
  it('falls back to 45 for contacts and 20 for other objects', () => {
    expect(parsePropertyHistoryLimits(undefined)).toEqual({
      contacts: 45,
      others: 20,
    });
  });

  it('keeps saved whole numbers and rejects anything else', () => {
    expect(parsePropertyHistoryLimits({ contacts: 10, others: 0 })).toEqual({
      contacts: 10,
      others: 20,
    });
    expect(parsePropertyHistoryLimits({ contacts: 2.5, others: 5000 })).toEqual(
      { contacts: 45, others: 1000 },
    );
  });
});

describe('getPropertyHistoryLimit', () => {
  it('uses the contacts limit only for people', () => {
    const limits = { contacts: 45, others: 20 };

    expect(getPropertyHistoryLimit(limits, 'person')).toBe(45);
    expect(getPropertyHistoryLimit(limits, 'company')).toBe(20);
    expect(getPropertyHistoryLimit(limits, 'meeting')).toBe(20);
  });
});
