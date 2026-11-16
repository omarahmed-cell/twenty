import { type PipelineConfig } from '@/pipeline/types/PipelineConfig';
import {
  getDealStageDisabledReason,
  isDealLockedForViewer,
} from '@/pipeline/rules/utils/getDealStageDisabledReason';

const SALES: PipelineConfig = {
  id: 'sales',
  key: 'SALES_PIPELINE',
  name: 'Sales Pipeline',
  description: null,
  position: 0,
  objectNameSingular: 'opportunity',
  rules: {
    limitCreationToStages: { enabled: true, stageValues: ['A'] },
    restrictSkipping: true,
    restrictBackward: true,
    lockEditingInStages: { enabled: true, stageValues: ['WON'] },
  },
  stages: [
    { value: 'A', label: '1. Discovery Stage', probability: 10 },
    { value: 'B', label: '2. Qualified to buy', probability: 20 },
    { value: 'C', label: '3. Commercial Agreement', probability: 40 },
    { value: 'WON', label: '7. Closed Won - Paid', probability: 100 },
    { value: 'LOST', label: 'Discovery Lost', probability: 0 },
  ].map((stage, position) => ({
    ...stage,
    id: stage.value,
    pipelineId: 'sales',
    position,
    color: null,
    hubspotStageId: null,
    calcPropsEnabled: false,
  })),
};

const reason = (
  currentStageValue: string,
  targetStageValue: string,
  overrides: { isAdmin?: boolean; isCreate?: boolean } = {},
) =>
  getDealStageDisabledReason({
    pipeline: SALES,
    isAdmin: overrides.isAdmin ?? false,
    isCreate: overrides.isCreate ?? false,
    currentStageValue,
    targetStageValue,
  });

describe('getDealStageDisabledReason', () => {
  it('greys out a skip but not the next stage or a lost stage', () => {
    expect(reason('A', 'C')).toContain("Can't skip from 1. Discovery Stage");
    expect(reason('A', 'B')).toBeNull();
    expect(reason('A', 'LOST')).toBeNull();
  });

  it('greys out moving back or out of a closed stage', () => {
    expect(reason('C', 'A')).toContain("Can't move backward");
    expect(reason('LOST', 'B')).toContain("can't change stage");
  });

  it('offers only the creation stages on a new deal', () => {
    expect(reason('A', 'A', { isCreate: true })).toBeNull();
    expect(reason('A', 'B', { isCreate: true })).not.toBeNull();
  });

  it('never limits an Admin', () => {
    expect(reason('C', 'A', { isAdmin: true })).toBeNull();
    expect(
      isDealLockedForViewer({
        pipeline: SALES,
        isAdmin: true,
        stageValue: 'WON',
      }),
    ).toBe(false);
  });

  it('locks every stage change on a deal in a locked stage', () => {
    expect(reason('WON', 'LOST')).toContain(
      'can only be edited by Super Admins',
    );
    expect(
      isDealLockedForViewer({
        pipeline: SALES,
        isAdmin: false,
        stageValue: 'WON',
      }),
    ).toBe(true);
  });
});
