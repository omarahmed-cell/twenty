import { getRoboostOptionTone } from '@/roboost-app/utils/getRoboostOptionTone';

describe('getRoboostOptionTone', () => {
  it('uses the option colour when one is set', () => {
    expect(getRoboostOptionTone({ value: 'ANY', color: 'green' })).toEqual({
      tone: 'success',
      dot: true,
    });
  });

  it('falls back to the meaning of grey options', () => {
    expect(getRoboostOptionTone({ value: 'CUSTOMER', color: 'gray' })).toEqual({
      tone: 'success',
      dot: true,
    });
    expect(getRoboostOptionTone({ value: 'NEW', color: 'gray' })).toEqual({
      tone: 'info',
      dot: true,
    });
    expect(
      getRoboostOptionTone({ value: 'UNQUALIFIED', color: 'gray' }),
    ).toEqual({ tone: 'neutral', dot: false });
  });
});
