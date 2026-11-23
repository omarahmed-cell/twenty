import { useLingui } from '@lingui/react/macro';
import { useMemo, useState } from 'react';
import {
  findMissingConditionalLogicProperties,
  isDefined,
} from 'twenty-shared/utils';

import {
  type ConditionalLogicFieldsDialogRequest,
  conditionalLogicFieldsDialogRequestState,
  type ConditionalLogicFieldsDialogValues,
} from '@/conditional-logic/states/conditionalLogicFieldsDialogRequestState';
import { buildConditionalLogicFields } from '@/conditional-logic/utils/buildConditionalLogicFields';
import { objectMetadataItemsSelector } from '@/object-metadata/states/objectMetadataItemsSelector';
import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { getRoboostFieldInputKey } from '@/roboost-app/fields/getRoboostFieldInputKey';
import { RoboostFieldInput } from '@/roboost-app/fields/RoboostFieldInput';
import { Button } from '@/roboost-ui/components/Button';
import { Modal } from '@/roboost-ui/components/Modal';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { useSetAtomState } from '@/ui/utilities/state/jotai/hooks/useSetAtomState';

type ConditionalLogicFieldsDialogContentProps = {
  request: ConditionalLogicFieldsDialogRequest;
  objectMetadataItem: EnrichedObjectMetadataItem;
  onSettle: (values: ConditionalLogicFieldsDialogValues | null) => void;
};

const getCurrentValue = (
  record: Record<string, unknown>,
  fieldMetadataItem: FieldMetadataItem,
) => {
  const inputKey = getRoboostFieldInputKey(fieldMetadataItem);

  if (inputKey !== fieldMetadataItem.name) {
    return (
      record[inputKey] ??
      (record[fieldMetadataItem.name] as { id?: string } | null)?.id ??
      null
    );
  }

  return record[fieldMetadataItem.name] ?? null;
};

const ConditionalLogicFieldsDialogContent = ({
  request,
  objectMetadataItem,
  onSettle,
}: ConditionalLogicFieldsDialogContentProps) => {
  const { t } = useLingui();
  const [draftValues, setDraftValues] =
    useState<ConditionalLogicFieldsDialogValues>({});
  const [relatedRecords, setRelatedRecords] = useState<
    Record<string, Record<string, unknown> | null>
  >({});

  const { record } = request;

  const fields = useMemo(
    () => buildConditionalLogicFields(objectMetadataItem.fields),
    [objectMetadataItem.fields],
  );

  const missingRequiredFields = findMissingConditionalLogicProperties({
    rules: request.rules,
    record: { ...record, ...request.recordOverrides, ...draftValues },
    fields,
  });

  const rows = request.properties.flatMap(({ fieldName, isRequired }) => {
    const fieldMetadataItem = objectMetadataItem.fields.find(
      ({ name }) => name === fieldName,
    );

    return isDefined(fieldMetadataItem)
      ? [{ fieldMetadataItem, isRequired }]
      : [];
  });

  return (
    <Modal
      title={request.title}
      subtitle={
        isDefined(request.trigger) ? (
          <span className="rb-reqpop-trigger">{request.trigger}</span>
        ) : undefined
      }
      width={480}
      className="rb-reqpop"
      onClose={() => onSettle(null)}
      footer={
        <>
          <Button variant="secondary" onClick={() => onSettle(null)}>
            {t`Cancel`}
          </Button>
          <Button
            variant="primary"
            disabled={missingRequiredFields.length > 0}
            onClick={() => onSettle(draftValues)}
          >
            {request.confirmLabel}
          </Button>
        </>
      }
    >
      <div
        className="rb-reqpop-fields"
        onKeyDown={(event) => {
          // Escape in a field's dropdown only closes that dropdown
          if (
            event.key === 'Escape' &&
            event.target instanceof Element &&
            event.target.closest('.rb-select, .rb-menu-portal') !== null
          ) {
            event.stopPropagation();
          }
        }}
      >
        {rows.map(({ fieldMetadataItem, isRequired }) => {
          const inputKey = getRoboostFieldInputKey(fieldMetadataItem);
          const value = Object.hasOwn(draftValues, inputKey)
            ? draftValues[inputKey]
            : getCurrentValue(record, fieldMetadataItem);

          return (
            <label key={fieldMetadataItem.id} className="rb-reqpop-field">
              <span className="rb-reqpop-label">
                {fieldMetadataItem.label}
                {isRequired && <span className="rb-req"> *</span>}
              </span>
              <RoboostFieldInput
                field={fieldMetadataItem}
                value={value}
                relatedRecord={
                  Object.hasOwn(relatedRecords, inputKey)
                    ? relatedRecords[inputKey]
                    : (record[fieldMetadataItem.name] as Record<
                        string,
                        unknown
                      > | null)
                }
                onChange={(nextValue, related) => {
                  setDraftValues((previous) => ({
                    ...previous,
                    [inputKey]: nextValue,
                  }));
                  if (related !== undefined) {
                    setRelatedRecords((previous) => ({
                      ...previous,
                      [inputKey]:
                        related === null
                          ? null
                          : { id: related.id, name: related.label },
                    }));
                  }
                }}
              />
            </label>
          );
        })}
        {missingRequiredFields.length > 0 && (
          <div className="rb-reqpop-hint">{request.hint}</div>
        )}
      </div>
    </Modal>
  );
};

// Mounted once; useConditionalLogicFieldsDialog opens it and waits for the user's answer
export const ConditionalLogicFieldsDialog = () => {
  const conditionalLogicFieldsDialogRequest = useAtomStateValue(
    conditionalLogicFieldsDialogRequestState,
  );
  const setConditionalLogicFieldsDialogRequest = useSetAtomState(
    conditionalLogicFieldsDialogRequestState,
  );
  const objectMetadataItems = useAtomStateValue(objectMetadataItemsSelector);

  const objectMetadataItem = objectMetadataItems.find(
    ({ nameSingular }) =>
      nameSingular === conditionalLogicFieldsDialogRequest?.objectNameSingular,
  );

  if (
    !isDefined(conditionalLogicFieldsDialogRequest) ||
    !isDefined(objectMetadataItem)
  ) {
    return null;
  }

  const handleSettle = (values: ConditionalLogicFieldsDialogValues | null) => {
    setConditionalLogicFieldsDialogRequest(null);
    conditionalLogicFieldsDialogRequest.resolve(values);
  };

  return (
    <ConditionalLogicFieldsDialogContent
      key={`${String(conditionalLogicFieldsDialogRequest.record.id)}-${conditionalLogicFieldsDialogRequest.title}`}
      request={conditionalLogicFieldsDialogRequest}
      objectMetadataItem={objectMetadataItem}
      onSettle={handleSettle}
    />
  );
};
