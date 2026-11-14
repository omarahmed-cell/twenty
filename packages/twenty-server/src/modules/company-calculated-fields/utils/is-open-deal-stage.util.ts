import {
  HUBSPOT_DEAL_STAGES,
  TWENTY_DEAL_STAGE_TO_HUBSPOT_STAGE_ID,
} from 'twenty-shared/constants';
import { isDefined } from 'twenty-shared/utils';

// A stage missing from the config counts as open, so a new stage never silently drops deals from the count
export const isOpenDealStage = (stage: string | null | undefined): boolean => {
  if (!isDefined(stage)) {
    return true;
  }

  const hubspotStageId = TWENTY_DEAL_STAGE_TO_HUBSPOT_STAGE_ID[stage] ?? stage;

  const hubspotDealStage = HUBSPOT_DEAL_STAGES.find(
    (dealStage) => dealStage.hubspotStageId === hubspotStageId,
  );

  return !(hubspotDealStage?.isClosed ?? false);
};

export const getClosedTwentyDealStageValues = (): string[] =>
  Object.keys(TWENTY_DEAL_STAGE_TO_HUBSPOT_STAGE_ID).filter(
    (stage) => !isOpenDealStage(stage),
  );
