import { useLingui } from '@lingui/react/macro';
import {
  describePropertyLogicTrigger,
  findPropertyLogicRuleViolations,
  getPropertyLogicConditionFieldNames,
  isDefined,
} from 'twenty-shared/utils';

import { useConditionalLogicFieldsDialog } from '@/conditional-logic/hooks/useConditionalLogicFieldsDialog';
import { type ConditionalLogicFieldsDialogValues } from '@/conditional-logic/states/conditionalLogicFieldsDialogRequestState';
import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { useLazyFindOneRecord } from '@/object-record/hooks/useLazyFindOneRecord';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { usePropertyLogicRules } from '@/properties/hooks/usePropertyLogicRules';

export type PropertyLogicChangeDecision =
  | { status: 'proceed' }
  | { status: 'cancelled' }
  | { status: 'confirmed'; values: ConditionalLogicFieldsDialogValues };

// Mirrors the server: required dependents only bind when a change makes their rule true
export const usePropertyLogicFieldChange = (
  objectMetadataItem: Pick<
    EnrichedObjectMetadataItem,
    'id' | 'isSystem' | 'fields' | 'nameSingular'
  >,
) => {
  const { t } = useLingui();
  const { rules, fields } = usePropertyLogicRules(objectMetadataItem);
  const { askForConditionalLogicValues } = useConditionalLogicFieldsDialog();

  // Views only load their visible columns, so the fields a rule reads are fetched fresh
  const { findOneRecord } = useLazyFindOneRecord({
    objectNameSingular: objectMetadataItem.nameSingular,
    fetchPolicy: 'network-only',
  });

  const touchesConditionField = (changes: Record<string, unknown>) =>
    rules.some((rule) =>
      [...getPropertyLogicConditionFieldNames(rule)].some(
        (fieldName) => fieldName in changes,
      ),
    );

  const loadRecord = async (
    recordId: string,
    fallbackRecord: Record<string, unknown>,
  ): Promise<Record<string, unknown>> => {
    let loadedRecord: ObjectRecord | undefined;

    try {
      await findOneRecord({
        objectRecordId: recordId,
        onCompleted: (record) => {
          loadedRecord = record;
        },
      });
    } catch {
      return fallbackRecord;
    }

    return { ...fallbackRecord, ...loadedRecord };
  };

  const resolvePropertyLogicChange = async ({
    recordId,
    fallbackRecord,
    changes,
  }: {
    recordId: string;
    fallbackRecord: Record<string, unknown>;
    changes: Record<string, unknown>;
  }): Promise<PropertyLogicChangeDecision> => {
    if (rules.length === 0 || !touchesConditionField(changes)) {
      return { status: 'proceed' };
    }

    const record = await loadRecord(recordId, fallbackRecord);
    const nextRecord = { ...record, ...changes };
    const violations = findPropertyLogicRuleViolations({
      expandedRules: rules,
      previousRecord: record,
      nextRecord,
      fields,
    });

    if (violations.length === 0) {
      return { status: 'proceed' };
    }

    const triggers = [
      ...new Set(
        violations.map(({ rule }) =>
          describePropertyLogicTrigger({ rule, record: nextRecord, fields }),
        ),
      ),
    ].join(', ');
    // Every dependent of the rules shows in the box, required ones starred
    const dependentProperties = violations
      .flatMap(({ rule }) => rule.properties)
      .reduce<{ fieldName: string; isRequired: boolean }[]>(
        (properties, property) => {
          const existing = properties.find(
            ({ fieldName }) => fieldName === property.fieldName,
          );

          if (isDefined(existing)) {
            existing.isRequired = existing.isRequired || property.isRequired;
            return properties;
          }

          return [...properties, { ...property }];
        },
        [],
      );

    const values = await askForConditionalLogicValues({
      objectNameSingular: objectMetadataItem.nameSingular,
      title: t`Fill in required fields`,
      trigger: triggers.replaceAll(' -> ', ' → '),
      confirmLabel: t`Save`,
      hint: t`Fill the required fields to save this change.`,
      properties: dependentProperties,
      isDependentProperties: true,
      rules: violations.map(({ rule }) => rule),
      record,
      recordOverrides: changes,
    });

    return isDefined(values)
      ? { status: 'confirmed', values }
      : { status: 'cancelled' };
  };

  return { resolvePropertyLogicChange };
};
