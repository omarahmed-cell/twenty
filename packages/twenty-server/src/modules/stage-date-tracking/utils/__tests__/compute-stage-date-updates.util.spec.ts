import { COMPANY_LIFECYCLE_STAGE_DATE_TRACKING_CONFIG } from 'src/modules/stage-date-tracking/constants/company-lifecycle-stage-date-tracking-config.constant';
import { computeStageDateUpdates } from 'src/modules/stage-date-tracking/utils/compute-stage-date-updates.util';

const CHANGED_AT = '2026-11-14T10:00:00.000Z';

describe('computeStageDateUpdates', () => {
  it('stamps the first stage as entered and current on creation', () => {
    expect(
      computeStageDateUpdates({
        config: COMPANY_LIFECYCLE_STAGE_DATE_TRACKING_CONFIG,
        previousStage: null,
        nextStage: 'LEAD',
        changedAt: CHANGED_AT,
      }),
    ).toEqual({
      dateEnteredLeadLifecycleStage: CHANGED_AT,
      dateEnteredCurrentStage: CHANGED_AT,
    });
  });

  it('exits the old stage and enters the new one on a change', () => {
    expect(
      computeStageDateUpdates({
        config: COMPANY_LIFECYCLE_STAGE_DATE_TRACKING_CONFIG,
        previousStage: 'LEAD',
        nextStage: 'MARKETING_QUALIFIED_LEAD',
        changedAt: CHANGED_AT,
      }),
    ).toEqual({
      dateExitedLeadLifecycleStage: CHANGED_AT,
      dateEnteredMarketingQualifiedLeadLifecycleStage: CHANGED_AT,
      dateEnteredCurrentStage: CHANGED_AT,
    });
  });

  it('overwrites the entered date when a stage is re-entered', () => {
    expect(
      computeStageDateUpdates({
        config: COMPANY_LIFECYCLE_STAGE_DATE_TRACKING_CONFIG,
        previousStage: 'ON_HOLD',
        nextStage: 'LEAD',
        changedAt: CHANGED_AT,
      }),
    ).toMatchObject({ dateEnteredLeadLifecycleStage: CHANGED_AT });
  });

  it('only exits the old stage when the stage is cleared', () => {
    expect(
      computeStageDateUpdates({
        config: COMPANY_LIFECYCLE_STAGE_DATE_TRACKING_CONFIG,
        previousStage: 'CUSTOMER',
        nextStage: null,
        changedAt: CHANGED_AT,
      }),
    ).toEqual({ dateExitedCustomerLifecycleStage: CHANGED_AT });
  });

  it('changes nothing when the stage is unchanged', () => {
    expect(
      computeStageDateUpdates({
        config: COMPANY_LIFECYCLE_STAGE_DATE_TRACKING_CONFIG,
        previousStage: 'BIN',
        nextStage: 'BIN',
        changedAt: CHANGED_AT,
      }),
    ).toEqual({});
  });
});
