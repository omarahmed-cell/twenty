import {
  getClosedTwentyDealStageValues,
  isOpenDealStage,
} from 'src/modules/company-calculated-fields/utils/is-open-deal-stage.util';

describe('isOpenDealStage', () => {
  it.each(['NEW', 'SCREENING', 'MEETING', 'PROPOSAL'])(
    'treats the placeholder stage %s as open',
    (stage) => {
      expect(isOpenDealStage(stage)).toBe(true);
    },
  );

  it.each(['CUSTOMER', 'CLOSED_LOST'])(
    'treats the placeholder stage %s as closed',
    (stage) => {
      expect(isOpenDealStage(stage)).toBe(false);
    },
  );

  it('reads HubSpot stage ids directly from the config', () => {
    expect(isOpenDealStage('decisionmakerboughtin')).toBe(true);
    expect(isOpenDealStage('169974021')).toBe(false);
    expect(isOpenDealStage('1114047027')).toBe(false);
  });

  it('counts an unknown or empty stage as open', () => {
    expect(isOpenDealStage('SOMETHING_NEW')).toBe(true);
    expect(isOpenDealStage(null)).toBe(true);
  });

  it('lists the closed Twenty stage values', () => {
    expect(getClosedTwentyDealStageValues().sort()).toEqual([
      'CLOSED_LOST',
      'CUSTOMER',
    ]);
  });
});
