import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { type RoboostScoreTestResult } from '@/roboost-app/scoring/types/RoboostScore';
import { type SelectOption } from '@/roboost-ui/components/Select';
import { createContext, useContext } from 'react';
import {
  type RoboostScoreCriteria,
  type RoboostScoreValidation,
} from 'twenty-shared/utils';

export type RoboostScoreDragItem =
  | { type: 'group'; groupId: string }
  | { type: 'ruleSet'; groupId: string; ruleSetId: string };

export type RoboostScoreEditorContextValue = {
  objectMetadataItem: EnrichedObjectMetadataItem;
  fieldOptions: SelectOption[];
  fieldsByName: Map<string, FieldMetadataItem>;
  canEdit: boolean;
  validation: RoboostScoreValidation;
  updateDraft: (
    update: (criteria: RoboostScoreCriteria) => RoboostScoreCriteria,
  ) => void;
  testResult: RoboostScoreTestResult | null;
  memberLabels: Record<string, string>;
  dragItem: RoboostScoreDragItem | null;
  setDragItem: (item: RoboostScoreDragItem | null) => void;
};

export const RoboostScoreEditorContext =
  createContext<RoboostScoreEditorContextValue | null>(null);

export const useRoboostScoreEditor = () => {
  const context = useContext(RoboostScoreEditorContext);

  if (context === null) {
    throw new Error(
      'useRoboostScoreEditor must be used inside the score editor',
    );
  }

  return context;
};
