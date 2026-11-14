import { type StageDateTrackingConfig } from 'src/modules/stage-date-tracking/types/stage-date-tracking-config.type';

export const COMPANY_LIFECYCLE_STAGE_DATE_TRACKING_CONFIG: StageDateTrackingConfig =
  {
    objectNameSingular: 'company',
    stageFieldName: 'lifecycleStage',
    currentStageEnteredFieldName: 'dateEnteredCurrentStage',
    fieldNamesByStage: {
      NEW: {
        enteredFieldName: 'dateEnteredNewLifecycleStage',
        exitedFieldName: 'dateExitedNewLifecycleStage',
      },
      LEAD: {
        enteredFieldName: 'dateEnteredLeadLifecycleStage',
        exitedFieldName: 'dateExitedLeadLifecycleStage',
      },
      MARKETING_QUALIFIED_LEAD: {
        enteredFieldName: 'dateEnteredMarketingQualifiedLeadLifecycleStage',
        exitedFieldName: 'dateExitedMarketingQualifiedLeadLifecycleStage',
      },
      SALES_QUALIFIED_LEAD: {
        enteredFieldName: 'dateEnteredSalesQualifiedLeadLifecycleStage',
        exitedFieldName: 'dateExitedSalesQualifiedLeadLifecycleStage',
      },
      OPPORTUNITY: {
        enteredFieldName: 'dateEnteredOpportunityLifecycleStage',
        exitedFieldName: 'dateExitedOpportunityLifecycleStage',
      },
      CUSTOMER: {
        enteredFieldName: 'dateEnteredCustomerLifecycleStage',
        exitedFieldName: 'dateExitedCustomerLifecycleStage',
      },
      PROMOTER: {
        enteredFieldName: 'dateEnteredPromoterLifecycleStage',
        exitedFieldName: 'dateExitedPromoterLifecycleStage',
      },
      OTHER: {
        enteredFieldName: 'dateEnteredOtherLifecycleStage',
        exitedFieldName: 'dateExitedOtherLifecycleStage',
      },
      CLOSING: {
        enteredFieldName: 'dateEnteredClosingLifecycleStage',
        exitedFieldName: 'dateExitedClosingLifecycleStage',
      },
      ON_HOLD: {
        enteredFieldName: 'dateEnteredOnHoldLifecycleStage',
        exitedFieldName: 'dateExitedOnHoldLifecycleStage',
      },
      BIN: {
        enteredFieldName: 'dateEnteredBinLifecycleStage',
        exitedFieldName: 'dateExitedBinLifecycleStage',
      },
    },
  };
