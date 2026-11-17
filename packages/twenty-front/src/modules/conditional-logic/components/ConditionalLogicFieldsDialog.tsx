import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { useMemo, useState } from 'react';
import {
  findMissingConditionalLogicProperties,
  isDefined,
} from 'twenty-shared/utils';
import { type JsonValue } from 'type-fest';
import { Button, Field } from 'twenty-ui/primitives/input';
import { Dialog } from 'twenty-ui/primitives/surfaces';
import { themeCssVariables } from 'twenty-ui/theme';

import { CONDITIONAL_LOGIC_FIELDS_DIALOG_ID } from '@/conditional-logic/constants/ConditionalLogicFieldsDialogId';
import {
  type ConditionalLogicFieldsDialogRequest,
  conditionalLogicFieldsDialogRequestState,
  type ConditionalLogicFieldsDialogValues,
} from '@/conditional-logic/states/conditionalLogicFieldsDialogRequestState';
import { buildConditionalLogicFields } from '@/conditional-logic/utils/buildConditionalLogicFields';
import { objectMetadataItemsSelector } from '@/object-metadata/states/objectMetadataItemsSelector';
import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { formatFieldMetadataItemAsFieldDefinition } from '@/object-metadata/utils/formatFieldMetadataItemAsFieldDefinition';
import { getFieldMetadataItemGqlFieldName } from '@/object-metadata/utils/getFieldMetadataItemGqlFieldName';
import { RecordFormFieldInput } from '@/object-record/record-form/components/RecordFormFieldInput';
import { getRecordFormFieldPlaceholders } from '@/object-record/record-form/utils/getRecordFormFieldPlaceholders';
import { DialogInstance } from '@/ui/layout/dialog/components/DialogInstance';
import { useDialog } from '@/ui/layout/dialog/hooks/useDialog';
import { DropdownInModalContext } from '@/ui/layout/dropdown/contexts/DropdownInModalContext';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { useSetAtomState } from '@/ui/utilities/state/jotai/hooks/useSetAtomState';

const StyledFieldList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
`;

const StyledHint = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
`;

const StyledFooter = styled.div`
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
  justify-content: flex-end;
  width: 100%;
`;

type ConditionalLogicFieldsDialogContentProps = {
  request: ConditionalLogicFieldsDialogRequest;
  objectMetadataItem: EnrichedObjectMetadataItem;
  onSettle: (values: ConditionalLogicFieldsDialogValues | null) => void;
};

const ConditionalLogicFieldsDialogContent = ({
  request,
  objectMetadataItem,
  onSettle,
}: ConditionalLogicFieldsDialogContentProps) => {
  const { t } = useLingui();
  const [draftValues, setDraftValues] =
    useState<ConditionalLogicFieldsDialogValues>({});

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

  const setDraftValue = (gqlFieldName: string, value: unknown) =>
    setDraftValues((previousDraftValues) => ({
      ...previousDraftValues,
      [gqlFieldName]: value,
    }));

  return (
    <DialogInstance
      dialogId={CONDITIONAL_LOGIC_FIELDS_DIALOG_ID}
      // Field pickers open dropdowns outside the popup, so only the buttons close it
      dismissible={false}
      onClose={() => onSettle(null)}
      renderInDocumentBody
    >
      {({ onKeyDown }) => (
        <Dialog.Popup onKeyDown={onKeyDown} size="md">
          <Dialog.Header>
            <Dialog.Title>{request.title}</Dialog.Title>
          </Dialog.Header>
          <Dialog.Body>
            <DropdownInModalContext.Provider value={true}>
              <StyledFieldList>
                {rows.map(({ fieldMetadataItem, isRequired }) => {
                  const gqlFieldName =
                    getFieldMetadataItemGqlFieldName(fieldMetadataItem);
                  const fieldLabel = fieldMetadataItem.label;
                  const { placeholder, subFieldPlaceholders } =
                    getRecordFormFieldPlaceholders(fieldMetadataItem.type);
                  const fieldDefinition =
                    formatFieldMetadataItemAsFieldDefinition({
                      field: fieldMetadataItem,
                      objectMetadataItem,
                      showLabel: true,
                    });

                  return (
                    <Field.Root key={fieldMetadataItem.id}>
                      <RecordFormFieldInput
                        field={{
                          ...fieldDefinition,
                          label: isRequired
                            ? t`${fieldLabel} (required)`
                            : fieldLabel,
                        }}
                        defaultValue={
                          (Object.hasOwn(draftValues, gqlFieldName)
                            ? draftValues[gqlFieldName]
                            : (record[gqlFieldName] ?? null)) as JsonValue
                        }
                        onChange={(value) => setDraftValue(gqlFieldName, value)}
                        onClear={() => setDraftValue(gqlFieldName, null)}
                        placeholder={placeholder}
                        subFieldPlaceholders={subFieldPlaceholders}
                      />
                    </Field.Root>
                  );
                })}
                {missingRequiredFields.length > 0 && (
                  <StyledHint>{request.hint}</StyledHint>
                )}
              </StyledFieldList>
            </DropdownInModalContext.Provider>
          </Dialog.Body>
          <Dialog.Footer>
            <StyledFooter>
              <Button variant="outline" onClick={() => onSettle(null)}>
                {t`Cancel`}
              </Button>
              <Button
                variant="solid"
                color="accent"
                disabled={missingRequiredFields.length > 0}
                onClick={() => onSettle(draftValues)}
              >
                {request.confirmLabel}
              </Button>
            </StyledFooter>
          </Dialog.Footer>
        </Dialog.Popup>
      )}
    </DialogInstance>
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
  const { closeDialog } = useDialog();

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
    closeDialog(CONDITIONAL_LOGIC_FIELDS_DIALOG_ID);
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
