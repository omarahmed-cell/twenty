// The stage values deals had before pipelines existed, and where the upgrade moves them
export const LEGACY_DEAL_STAGE_TO_PIPELINE_STAGE_VALUE: Record<string, string> =
  {
    NEW: 'SALES_DISCOVERY_STAGE',
    SCREENING: 'SALES_QUALIFIED_TO_BUY',
    MEETING: 'SALES_COMMERCIAL_AGREEMENT',
    PROPOSAL: 'SALES_LEGAL_AGREEMENT',
    CUSTOMER: 'SALES_CLOSED_WON_PAID',
    CLOSED_LOST: 'SALES_CLOSED_LOST',
  };
