import { assertRoboostUserVar } from 'src/engine/core-modules/user/user-vars/utils/assert-roboost-user-var.util';

describe('assertRoboostUserVar', () => {
  it('accepts member preferences and workspace defaults in their own scope', () => {
    expect(() =>
      assertRoboostUserVar('roboost.mode', 'sira', 'user'),
    ).not.toThrow();
    expect(() =>
      assertRoboostUserVar('roboost.default.forms.company', {}, 'workspace'),
    ).not.toThrow();
  });

  it('rejects keys outside the roboost prefix or in the wrong scope', () => {
    expect(() =>
      assertRoboostUserVar('ONBOARDING_BOOK_CALL_PENDING', true, 'user'),
    ).toThrow();
    expect(() =>
      assertRoboostUserVar('roboost.default.forms.company', {}, 'user'),
    ).toThrow();
    expect(() =>
      assertRoboostUserVar('roboost.mode', 'light', 'workspace'),
    ).toThrow();
  });

  it('rejects oversized values', () => {
    expect(() =>
      assertRoboostUserVar('roboost.layout', 'x'.repeat(60_000), 'user'),
    ).toThrow();
  });
});
