import {
  evaluateDealStageMove,
  isDealCreationStageAllowed,
  isDealStageLocked,
} from '@/utils/pipeline/pipeline-rules';

const STAGES = [
  {
    value: 'DISCOVERY',
    label: '1. Discovery Stage',
    position: 0,
    probability: 10,
  },
  {
    value: 'QUALIFIED',
    label: '2. Qualified to buy',
    position: 1,
    probability: 20,
  },
  {
    value: 'COMMERCIAL',
    label: '3. Commercial Agreement',
    position: 2,
    probability: 40,
  },
  {
    value: 'WON',
    label: '7. Closed Won - Paid',
    position: 3,
    probability: 100,
  },
  { value: 'LOST', label: '8. Closed Lost', position: 4, probability: 0 },
  {
    value: 'DISCOVERY_LOST',
    label: 'Discovery Lost',
    position: 5,
    probability: 0,
  },
];

const RULES_ON = {
  limitCreationToStages: { enabled: true, stageValues: ['DISCOVERY'] },
  restrictSkipping: true,
  restrictBackward: true,
  lockEditingInStages: { enabled: true, stageValues: ['WON'] },
};

const RULES_OFF = {
  limitCreationToStages: { enabled: false, stageValues: ['DISCOVERY'] },
  restrictSkipping: false,
  restrictBackward: false,
  lockEditingInStages: { enabled: false, stageValues: ['WON'] },
};

const move = (rules: unknown, fromStageValue: string, toStageValue: string) =>
  evaluateDealStageMove({
    stages: STAGES,
    rules,
    fromStageValue,
    toStageValue,
  });

describe('evaluateDealStageMove', () => {
  it('allows only the next stage from an open stage when skipping is restricted', () => {
    expect(move(RULES_ON, 'DISCOVERY', 'QUALIFIED')).toBeNull();
    expect(move(RULES_ON, 'DISCOVERY', 'COMMERCIAL')).toEqual({
      reason: 'SKIP',
      fromLabel: '1. Discovery Stage',
      toLabel: '3. Commercial Agreement',
      nextAllowedLabel: '2. Qualified to buy',
    });
    expect(move(RULES_ON, 'DISCOVERY', 'WON')).toMatchObject({
      reason: 'SKIP',
    });
  });

  it('lets an open deal jump to any lost stage', () => {
    expect(move(RULES_ON, 'DISCOVERY', 'LOST')).toBeNull();
    expect(move(RULES_ON, 'QUALIFIED', 'DISCOVERY_LOST')).toBeNull();
  });

  it('refuses moving backward when backward moves are restricted', () => {
    expect(move(RULES_ON, 'COMMERCIAL', 'DISCOVERY')).toEqual({
      reason: 'BACKWARD',
      fromLabel: '3. Commercial Agreement',
      toLabel: '1. Discovery Stage',
    });
  });

  it('refuses moving out of a lost or won stage when backward moves are restricted', () => {
    expect(move(RULES_ON, 'DISCOVERY_LOST', 'QUALIFIED')).toMatchObject({
      reason: 'OUT_OF_CLOSED_STAGE',
    });
    expect(move(RULES_ON, 'WON', 'LOST')).toMatchObject({
      reason: 'OUT_OF_CLOSED_STAGE',
    });
  });

  it('lets every move through when the rules are off', () => {
    expect(move(RULES_OFF, 'DISCOVERY', 'COMMERCIAL')).toBeNull();
    expect(move(RULES_OFF, 'COMMERCIAL', 'DISCOVERY')).toBeNull();
    expect(move(RULES_OFF, 'DISCOVERY_LOST', 'QUALIFIED')).toBeNull();
  });

  it('treats each rule on its own', () => {
    const skippingOnly = { ...RULES_OFF, restrictSkipping: true };

    expect(move(skippingOnly, 'COMMERCIAL', 'DISCOVERY')).toBeNull();
    expect(move(skippingOnly, 'DISCOVERY', 'COMMERCIAL')).toMatchObject({
      reason: 'SKIP',
    });

    const backwardOnly = { ...RULES_OFF, restrictBackward: true };

    expect(move(backwardOnly, 'DISCOVERY', 'COMMERCIAL')).toBeNull();
    expect(move(backwardOnly, 'COMMERCIAL', 'QUALIFIED')).toMatchObject({
      reason: 'BACKWARD',
    });
  });

  it('accepts staying in the same stage', () => {
    expect(move(RULES_ON, 'WON', 'WON')).toBeNull();
  });
});

describe('isDealCreationStageAllowed', () => {
  it('limits creation to the chosen stages only while the rule is on', () => {
    expect(
      isDealCreationStageAllowed({ rules: RULES_ON, stageValue: 'DISCOVERY' }),
    ).toBe(true);
    expect(
      isDealCreationStageAllowed({ rules: RULES_ON, stageValue: 'QUALIFIED' }),
    ).toBe(false);
    expect(
      isDealCreationStageAllowed({ rules: RULES_OFF, stageValue: 'QUALIFIED' }),
    ).toBe(true);
  });
});

describe('isDealStageLocked', () => {
  it('locks the chosen stages only while the rule is on', () => {
    expect(isDealStageLocked({ rules: RULES_ON, stageValue: 'WON' })).toBe(
      true,
    );
    expect(
      isDealStageLocked({ rules: RULES_ON, stageValue: 'COMMERCIAL' }),
    ).toBe(false);
    expect(isDealStageLocked({ rules: RULES_OFF, stageValue: 'WON' })).toBe(
      false,
    );
  });
});
