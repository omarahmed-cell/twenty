import { isNonEmptyString } from '@sniptt/guards';
import {
  type ConditionalLogicField,
  isDefined,
  isPlainObject,
} from 'twenty-shared/utils';
import { type JsonValue } from 'type-fest';

const getRelatedRecordId = (value: JsonValue | undefined): string | null => {
  if (isNonEmptyString(value)) {
    return value;
  }

  return isPlainObject(value) && isNonEmptyString(value.id) ? value.id : null;
};

// Relation inputs hand back an id or a record; the evaluator reads relations through the foreign key
export const buildConditionalLogicPreviewRecord = ({
  valuesByFieldName,
  fields,
}: {
  valuesByFieldName: Record<string, JsonValue>;
  fields: ConditionalLogicField[];
}): Record<string, unknown> =>
  Object.fromEntries(
    fields.map((field): [string, unknown] =>
      isDefined(field.joinColumnName)
        ? [
            field.joinColumnName,
            getRelatedRecordId(valuesByFieldName[field.name]),
          ]
        : [field.name, valuesByFieldName[field.name] ?? null],
    ),
  );
