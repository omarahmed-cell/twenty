import { type StageCalculatedPropertyKind } from '@/utils/pipeline/stage-calculated-properties';

export type PipelineSeedStage = {
  value: string;
  label: string;
  probability: number | null;
  hubspotStageId: string;
  calcPropsEnabled?: boolean;
};

export type PipelineSeed = {
  key: string;
  name: string;
  hubspotPipelineId: string;
  stageCalculatedPropertyKinds?: StageCalculatedPropertyKind[];
  stages: PipelineSeedStage[];
};

// The HubSpot deal pipelines every workspace starts with; values are stable keys, labels can be renamed in Settings
export const PIPELINE_SEED: PipelineSeed[] = [
  {
    key: 'SALES_PIPELINE',
    name: 'Sales Pipeline',
    hubspotPipelineId: 'default',
    stages: [
      {
        value: 'SALES_DISCOVERY_STAGE',
        label: '1. Discovery Stage',
        probability: 10,
        hubspotStageId: '1159464522',
      },
      {
        value: 'SALES_QUALIFIED_TO_BUY',
        label: '2. Qualified to buy',
        probability: 20,
        hubspotStageId: 'appointmentscheduled',
      },
      {
        value: 'SALES_COMMERCIAL_AGREEMENT',
        label: '3. Commercial Agreement',
        probability: 40,
        hubspotStageId: 'qualifiedtobuy',
      },
      {
        value: 'SALES_LEGAL_AGREEMENT',
        label: '4. Legal Agreement',
        probability: 60,
        hubspotStageId: 'presentationscheduled',
      },
      {
        value: 'SALES_CLOSING',
        label: '5. Closing',
        probability: 80,
        hubspotStageId: 'decisionmakerboughtin',
      },
      {
        value: 'SALES_SIGNED',
        label: '6. Signed',
        probability: 90,
        hubspotStageId: '958566283',
      },
      {
        value: 'SALES_CLOSED_WON_PAID',
        label: '7. Closed Won - Paid',
        probability: 100,
        hubspotStageId: 'closedwon',
      },
      {
        value: 'SALES_CLOSED_LOST',
        label: '8. Closed Lost',
        probability: 0,
        hubspotStageId: 'closedlost',
      },
      {
        value: 'SALES_ON_HOLD',
        label: '9. On hold',
        probability: 0,
        hubspotStageId: '169974021',
      },
      {
        value: 'SALES_NO_SHOW',
        label: 'No Show',
        probability: 0,
        hubspotStageId: '1192968029',
      },
      {
        value: 'SALES_DISCOVERY_LOST',
        label: 'Discovery Lost',
        probability: 0,
        hubspotStageId: '1229484917',
      },
    ],
  },
  {
    key: 'INTERNATIONAL_PIPELINE',
    name: 'International Pipeline',
    hubspotPipelineId: '80806743',
    stages: [
      {
        value: 'INTERNATIONAL_QUALIFIED_TO_BUY',
        label: '1. Qualified to buy',
        probability: null,
        hubspotStageId: '152931713',
      },
      {
        value: 'INTERNATIONAL_COMMERCIAL_AGREEMENT',
        label: '2. Commercial Agreement',
        probability: null,
        hubspotStageId: '152931714',
      },
      {
        value: 'INTERNATIONAL_LEGAL_AGREEMENT',
        label: '3. Legal Agreement',
        probability: null,
        hubspotStageId: '152931715',
      },
      {
        value: 'INTERNATIONAL_CLOSING',
        label: '4. Closing',
        probability: null,
        hubspotStageId: '152931716',
      },
      {
        value: 'INTERNATIONAL_SIGNED',
        label: '5. Signed',
        probability: null,
        hubspotStageId: '958309258',
      },
      {
        value: 'INTERNATIONAL_CLOSED_WON_PAID',
        label: '6. Closed won - Paid',
        probability: null,
        hubspotStageId: '152931718',
      },
      {
        value: 'INTERNATIONAL_CLOSED_LOST',
        label: '7. Closed lost',
        probability: 0,
        hubspotStageId: '152931719',
      },
      {
        value: 'INTERNATIONAL_ON_HOLD',
        label: '8. On Hold',
        probability: null,
        hubspotStageId: '231876658',
      },
    ],
  },
  {
    key: 'PARTNERSHIPS_PIPELINE',
    name: 'Partnerships',
    hubspotPipelineId: '763600053',
    stages: [
      {
        value: 'PARTNERSHIPS_QUALIFIED_PARTNER',
        label: 'Qualified Partner',
        probability: 20,
        hubspotStageId: '1114047022',
      },
      {
        value: 'PARTNERSHIPS_COMMERCIAL_DISCUSSION',
        label: 'Commercial Discussion',
        probability: 30,
        hubspotStageId: '1114047023',
      },
      {
        value: 'PARTNERSHIPS_COMMERCIAL_PROPOSAL',
        label: 'Commercial Proposal',
        probability: 40,
        hubspotStageId: '1114047024',
      },
      {
        value: 'PARTNERSHIPS_NDA_SIGNED',
        label: 'NDA Signed',
        probability: null,
        hubspotStageId: '1114047025',
      },
      {
        value: 'PARTNERSHIPS_TECHNICAL_CALL',
        label: 'Technical Call',
        probability: null,
        hubspotStageId: '1114790433',
      },
      {
        value: 'PARTNERSHIPS_AGREEMENT_SIGNED',
        label: 'Agreement Signed',
        probability: 70,
        hubspotStageId: '1114790434',
      },
      {
        value: 'PARTNERSHIPS_SANDBOX_INTEGRATION',
        label: 'Sandbox Integration',
        probability: 80,
        hubspotStageId: '1114790435',
      },
      {
        value: 'PARTNERSHIPS_PRODUCTION',
        label: 'Production',
        probability: 90,
        hubspotStageId: '1114790436',
      },
      {
        value: 'PARTNERSHIPS_TESTING',
        label: 'Testing',
        probability: 90,
        hubspotStageId: '1114790437',
      },
      {
        value: 'PARTNERSHIPS_LIVE',
        label: 'Live',
        probability: 100,
        hubspotStageId: '1114047027',
      },
      {
        value: 'PARTNERSHIPS_CLOSED_LOST',
        label: 'Closed Lost',
        probability: 0,
        hubspotStageId: '1114047028',
      },
      {
        value: 'PARTNERSHIPS_ON_HOLD',
        label: 'On Hold',
        probability: null,
        hubspotStageId: '1114226873',
      },
    ],
  },
  {
    key: 'PILOT_PIPELINE',
    name: 'Pilot',
    hubspotPipelineId: '941857842',
    stages: [
      {
        value: 'PILOT_DISCOVERY',
        label: 'Discovery',
        probability: 20,
        hubspotStageId: '1452882255',
      },
      {
        value: 'PILOT_QUALIFIED_TO_BUY',
        label: 'Qualified To Buy',
        probability: 40,
        hubspotStageId: '1452882256',
      },
      {
        value: 'PILOT_COMMERCIAL_AGREEMENT',
        label: 'Commercial Agreement',
        probability: 60,
        hubspotStageId: '1452882257',
      },
      {
        value: 'PILOT_SIGNED',
        label: 'Signed',
        probability: 90,
        hubspotStageId: '1467472019',
      },
      {
        value: 'PILOT_CLOSED_WON',
        label: 'Closed Won',
        probability: 100,
        hubspotStageId: '1452882260',
      },
      {
        value: 'PILOT_CLOSED_LOST',
        label: 'Closed Lost',
        probability: 0,
        hubspotStageId: '1452882261',
      },
      {
        value: 'PILOT_ON_HOLD',
        label: 'On Hold',
        probability: 0,
        hubspotStageId: '1457283426',
      },
      {
        value: 'PILOT_DISCOVERY_LOST',
        label: 'Discovery Lost',
        probability: 0,
        hubspotStageId: '1457392677',
      },
      {
        value: 'PILOT_NO_SHOW',
        label: 'No Show',
        probability: 0,
        hubspotStageId: '1476960654',
      },
    ],
  },
];
