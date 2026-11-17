import { type PipelineSeed } from '@/constants/PipelineSeed';

const ONBOARDING_STAGES: [string, string, string][] = [
  ['ONBOARDING_KICK_OFF', 'Kick-off', '958556515'],
  ['ONBOARDING_INTEGRATION', 'Integration', '958556516'],
  ['ONBOARDING_INTEGRATION_TESTING', 'Integration testing', '1031855933'],
  ['ONBOARDING_MANAGEMENT_ONBOARDING', 'Management Onboarding', '1031855934'],
  ['ONBOARDING_ON_GROUND_ONBOARDING', 'on-ground Onboarding', '958556517'],
  ['ONBOARDING_LIVE', 'Live', '958556518'],
  ['ONBOARDING_SCALING', 'Scaling', '1031855935'],
  ['ONBOARDING_PERFORMING', 'Performing', '1055141690'],
  ['ONBOARDING_ON_HOLD', 'On Hold', '1176863041'],
  ['ONBOARDING_CHURN', 'Churn', '959922051'],
];

// The HubSpot service pipeline every workspace starts with
export const SERVICE_PIPELINE_SEED: PipelineSeed[] = [
  {
    key: 'ONBOARDING_PIPELINE',
    name: 'Onboarding Pipeline',
    hubspotPipelineId: '651758103',
    stageCalculatedPropertyKinds: ['dateEntered', 'dateExited'],
    stages: ONBOARDING_STAGES.map(([value, label, hubspotStageId]) => ({
      value,
      label,
      probability: null,
      hubspotStageId,
      calcPropsEnabled: true,
    })),
  },
];
