import { type ConditionalLogicConditionGroup } from 'twenty-shared/utils';

export type RoboostCardLogic = {
  action: 'show' | 'hide';
  conditionGroups: ConditionalLogicConditionGroup[];
};

export type RoboostLayoutPropertyCard = {
  id: string;
  title: string;
  fieldNames: string[];
  logic?: RoboostCardLogic;
};

export type RoboostLayoutAssociationCard = {
  id: string;
  isHidden: boolean;
  fieldNames: string[];
  logic?: RoboostCardLogic;
};

export type RoboostOverviewSectionId =
  | 'openTasks'
  | 'pinnedActivities'
  | 'latestActivity';

export type RoboostLayoutOverviewSection = {
  id: RoboostOverviewSectionId;
  title: string;
  isHidden: boolean;
};

export type RoboostLayoutHeader = {
  // "Label: value" lines under the record name in the first left card
  fieldNames: string[];
};

export type RoboostRecordLayoutConfig = {
  version: 1;
  header: RoboostLayoutHeader;
  left: RoboostLayoutPropertyCard[];
  right: RoboostLayoutAssociationCard[];
  // Associations taken off the panel; anything neither listed nor removed (a new relation) shows
  removedRightIds: string[];
  overview: RoboostLayoutOverviewSection[];
};
