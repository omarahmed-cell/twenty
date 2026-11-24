import { isNonEmptyString } from '@sniptt/guards';
import { type RoboostScoreCriteria } from 'twenty-shared/utils';

// Relation diffs are keyed by the join column, composite ones by the field itself
export const collectRoboostScoreFieldNames = (
  criteria: RoboostScoreCriteria,
): Set<string> => {
  const names = new Set<string>();

  for (const group of criteria.groups) {
    for (const ruleSet of group.ruleSets) {
      for (const { fieldName } of ruleSet.conditions) {
        if (isNonEmptyString(fieldName)) {
          names.add(fieldName);
          names.add(`${fieldName}Id`);
        }
      }
    }
  }

  return names;
};
