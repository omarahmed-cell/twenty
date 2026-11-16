import { FieldMetadataType } from 'twenty-shared/types';
import {
  buildStageCalculatedPropertyFieldName,
  buildStageCalculatedPropertyLabel,
  STAGE_CALCULATED_PROPERTY_KINDS,
  type StageCalculatedPropertyKind,
} from 'twenty-shared/utils';
import { v5 } from 'uuid';

export type StageCalculatedPropertyFieldSpec = {
  name: string;
  label: string;
  type: FieldMetadataType.DATE_TIME | FieldMetadataType.NUMBER;
  kind: StageCalculatedPropertyKind;
  stageValue: string;
  universalIdentifier: string;
};

export type ExistingStageCalculatedPropertyField = {
  id: string;
  name: string;
  label: string;
  isActive: boolean;
};

export type DealStageCalculatedPropertyFieldsPlan = {
  toCreate: StageCalculatedPropertyFieldSpec[];
  toUpdate: { id: string; label?: string; isActive?: boolean }[];
  toDelete: ExistingStageCalculatedPropertyField[];
  stageValuesToBackfill: string[];
};

// Fixed namespace so the same stage gets the same field identity in every workspace and after a toggle
const STAGE_CALCULATED_PROPERTY_NAMESPACE =
  '6f1c9a3e-2d4b-4f6a-9c8e-1b2a3c4d5e6f';

const KIND_PATTERN = new RegExp(
  `^(${STAGE_CALCULATED_PROPERTY_KINDS.join('|')})[A-Z0-9]`,
);

export const isStageCalculatedPropertyFieldName = (
  name: string,
  reservedNames: ReadonlySet<string>,
) => KIND_PATTERN.test(name) && !reservedNames.has(name);

export const buildStageCalculatedPropertyFieldSpecs = ({
  stageValue,
  stageLabel,
  pipelineName,
}: {
  stageValue: string;
  stageLabel: string;
  pipelineName: string;
}): StageCalculatedPropertyFieldSpec[] =>
  STAGE_CALCULATED_PROPERTY_KINDS.map((kind) => ({
    name: buildStageCalculatedPropertyFieldName(kind, stageValue),
    label: buildStageCalculatedPropertyLabel({
      kind,
      stageLabel,
      pipelineName,
    }),
    type:
      kind === 'dateEntered' || kind === 'dateExited'
        ? FieldMetadataType.DATE_TIME
        : FieldMetadataType.NUMBER,
    kind,
    stageValue,
    universalIdentifier: v5(
      `${stageValue}:${kind}`,
      STAGE_CALCULATED_PROPERTY_NAMESPACE,
    ),
  }));

// Toggle ON creates or reactivates, OFF deactivates and keeps data, a removed stage loses its fields
export const planDealStageCalculatedPropertyFields = ({
  stages,
  existingFields,
}: {
  stages: {
    value: string;
    label: string;
    pipelineName: string;
    calcPropsEnabled: boolean;
  }[];
  existingFields: ExistingStageCalculatedPropertyField[];
}): DealStageCalculatedPropertyFieldsPlan => {
  const existingByName = new Map(
    existingFields.map((field) => [field.name, field]),
  );
  const plan: DealStageCalculatedPropertyFieldsPlan = {
    toCreate: [],
    toUpdate: [],
    toDelete: [],
    stageValuesToBackfill: [],
  };
  const keptNames = new Set<string>();

  for (const stage of stages) {
    let isBackfillNeeded = false;

    for (const spec of buildStageCalculatedPropertyFieldSpecs({
      stageValue: stage.value,
      stageLabel: stage.label,
      pipelineName: stage.pipelineName,
    })) {
      const existing = existingByName.get(spec.name);

      if (existing) {
        keptNames.add(spec.name);
      }

      if (!existing) {
        if (stage.calcPropsEnabled) {
          plan.toCreate.push(spec);
          isBackfillNeeded = true;
        }
        continue;
      }

      const update: { id: string; label?: string; isActive?: boolean } = {
        id: existing.id,
      };

      if (existing.label !== spec.label) {
        update.label = spec.label;
      }

      if (existing.isActive !== stage.calcPropsEnabled) {
        update.isActive = stage.calcPropsEnabled;
        isBackfillNeeded ||= stage.calcPropsEnabled;
      }

      if (Object.keys(update).length > 1) {
        plan.toUpdate.push(update);
      }
    }

    if (isBackfillNeeded) {
      plan.stageValuesToBackfill.push(stage.value);
    }
  }

  plan.toDelete = existingFields.filter(({ name }) => !keptNames.has(name));

  return plan;
};
