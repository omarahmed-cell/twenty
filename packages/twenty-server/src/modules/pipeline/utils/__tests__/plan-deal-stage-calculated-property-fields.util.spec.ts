import { type StageCalculatedPropertyKind } from 'twenty-shared/utils';

import {
  buildStageCalculatedPropertyFieldSpecs,
  isStageCalculatedPropertyFieldName,
  planDealStageCalculatedPropertyFields,
} from 'src/modules/pipeline/utils/plan-deal-stage-calculated-property-fields.util';

const discovery = (
  overrides: { label?: string; calcPropsEnabled?: boolean } = {},
) => ({
  value: 'SALES_DISCOVERY_STAGE',
  label: overrides.label ?? '1. Discovery Stage',
  pipelineName: 'Sales Pipeline',
  calcPropsEnabled: overrides.calcPropsEnabled ?? true,
});

const existing = (isActive = true, label?: string) =>
  buildStageCalculatedPropertyFieldSpecs({
    stageValue: 'SALES_DISCOVERY_STAGE',
    stageLabel: '1. Discovery Stage',
    pipelineName: 'Sales Pipeline',
  }).map((spec, index) => ({
    id: `field-${index}`,
    name: spec.name,
    label: label ?? spec.label,
    isActive,
  }));

describe('planDealStageCalculatedPropertyFields', () => {
  it('creates the 4 fields of a stage switched on and backfills them', () => {
    const plan = planDealStageCalculatedPropertyFields({
      stages: [discovery()],
      existingFields: [],
    });

    expect(plan.toCreate.map(({ name, label }) => [name, label])).toEqual([
      [
        'dateEnteredSalesDiscoveryStage',
        'Date entered "1. Discovery Stage (Sales Pipeline)"',
      ],
      [
        'dateExitedSalesDiscoveryStage',
        'Date exited "1. Discovery Stage (Sales Pipeline)"',
      ],
      [
        'cumulativeTimeInSalesDiscoveryStage',
        'Cumulative time in "1. Discovery Stage (Sales Pipeline)"',
      ],
      [
        'latestTimeInSalesDiscoveryStage',
        'Latest time in "1. Discovery Stage (Sales Pipeline)"',
      ],
    ]);
    expect(plan.stageValuesToBackfill).toEqual(['SALES_DISCOVERY_STAGE']);
  });

  it('deactivates on OFF and keeps the fields, so their data stays', () => {
    const plan = planDealStageCalculatedPropertyFields({
      stages: [discovery({ calcPropsEnabled: false })],
      existingFields: existing(),
    });

    expect(plan.toUpdate).toHaveLength(4);
    expect(plan.toUpdate.every(({ isActive }) => isActive === false)).toBe(
      true,
    );
    expect(plan.toDelete).toEqual([]);
    expect(plan.toCreate).toEqual([]);
  });

  it('reactivates on ON and fills them from history', () => {
    const plan = planDealStageCalculatedPropertyFields({
      stages: [discovery()],
      existingFields: existing(false),
    });

    expect(plan.toUpdate.every(({ isActive }) => isActive === true)).toBe(true);
    expect(plan.stageValuesToBackfill).toEqual(['SALES_DISCOVERY_STAGE']);
  });

  it('relabels on a stage or pipeline rename and keeps the field names', () => {
    const plan = planDealStageCalculatedPropertyFields({
      stages: [discovery({ label: '1. Discovery' })],
      existingFields: existing(),
    });

    expect(plan.toCreate).toEqual([]);
    expect(plan.toUpdate[0]).toEqual({
      id: 'field-0',
      label: 'Date entered "1. Discovery (Sales Pipeline)"',
    });
  });

  it('deletes the fields of a deleted stage', () => {
    const plan = planDealStageCalculatedPropertyFields({
      stages: [],
      existingFields: existing(),
    });

    expect(plan.toDelete.map(({ id }) => id)).toEqual([
      'field-0',
      'field-1',
      'field-2',
      'field-3',
    ]);
  });

  it('keeps identities stable and leaves fixed deal fields alone', () => {
    const [first] = buildStageCalculatedPropertyFieldSpecs({
      stageValue: 'SALES_DISCOVERY_STAGE',
      stageLabel: 'Renamed',
      pipelineName: 'Renamed',
    });

    expect(first.universalIdentifier).toBe(
      buildStageCalculatedPropertyFieldSpecs({
        stageValue: 'SALES_DISCOVERY_STAGE',
        stageLabel: '1. Discovery Stage',
        pipelineName: 'Sales Pipeline',
      })[0].universalIdentifier,
    );
    expect(
      isStageCalculatedPropertyFieldName(
        'dateEnteredCurrentStage',
        new Set(['dateEnteredCurrentStage']),
      ),
    ).toBe(false);
    expect(
      isStageCalculatedPropertyFieldName('dateEnteredSalesClosing', new Set()),
    ).toBe(true);
  });
});

describe('planDealStageCalculatedPropertyFields per pipeline kinds', () => {
  const kickOff = (kinds?: StageCalculatedPropertyKind[]) => ({
    value: 'ONBOARDING_KICK_OFF',
    label: 'Kick-off',
    pipelineName: 'Onboarding Pipeline',
    calcPropsEnabled: true,
    kinds,
  });

  it('generates only the kinds checked on the pipeline', () => {
    const plan = planDealStageCalculatedPropertyFields({
      stages: [kickOff(['dateEntered', 'dateExited'])],
      existingFields: [],
    });

    expect(plan.toCreate.map(({ name }) => name)).toEqual([
      'dateEnteredOnboardingKickOff',
      'dateExitedOnboardingKickOff',
    ]);
  });

  it('removes the fields of a kind unchecked on the pipeline', () => {
    const existingFields = buildStageCalculatedPropertyFieldSpecs({
      stageValue: 'ONBOARDING_KICK_OFF',
      stageLabel: 'Kick-off',
      pipelineName: 'Onboarding Pipeline',
      kinds: ['dateEntered', 'dateExited'],
    }).map((spec, index) => ({
      id: `field-${index}`,
      name: spec.name,
      label: spec.label,
      isActive: true,
    }));

    const plan = planDealStageCalculatedPropertyFields({
      stages: [kickOff(['dateEntered'])],
      existingFields,
    });

    expect(plan.toCreate).toEqual([]);
    expect(plan.toDelete.map(({ name }) => name)).toEqual([
      'dateExitedOnboardingKickOff',
    ]);
  });

  it('keeps generating all four kinds for a pipeline without the setting, like deals', () => {
    const plan = planDealStageCalculatedPropertyFields({
      stages: [discovery()],
      existingFields: [],
    });

    expect(plan.toCreate.map(({ kind }) => kind)).toEqual([
      'dateEntered',
      'dateExited',
      'cumulativeTimeIn',
      'latestTimeIn',
    ]);
  });
});
