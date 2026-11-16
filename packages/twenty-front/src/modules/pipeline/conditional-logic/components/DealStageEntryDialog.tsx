import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { useMemo, useState } from 'react';
import { CoreObjectNameSingular } from 'twenty-shared/types';
import {
  findMissingConditionalLogicProperties,
  isDefined,
} from 'twenty-shared/utils';
import { type JsonValue } from 'type-fest';
import { Button, Field } from 'twenty-ui/primitives/input';
import { Dialog } from 'twenty-ui/primitives/surfaces';
import { themeCssVariables } from 'twenty-ui/theme';

import { objectMetadataItemsSelector } from '@/object-metadata/states/objectMetadataItemsSelector';
import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { formatFieldMetadataItemAsFieldDefinition } from '@/object-metadata/utils/formatFieldMetadataItemAsFieldDefinition';
import { getFieldMetadataItemGqlFieldName } from '@/object-metadata/utils/getFieldMetadataItemGqlFieldName';
import { RecordFormFieldInput } from '@/object-record/record-form/components/RecordFormFieldInput';
import { getRecordFormFieldPlaceholders } from '@/object-record/record-form/utils/getRecordFormFieldPlaceholders';
import { DEAL_STAGE_ENTRY_DIALOG_ID } from '@/pipeline/conditional-logic/constants/DealStageEntryDialogId';
import {
  type DealStageEntryDialogRequest,
  dealStageEntryDialogRequestState,
  type DealStageEntryValues,
} from '@/pipeline/conditional-logic/states/dealStageEntryDialogRequestState';
import { buildConditionalLogicFields } from '@/pipeline/conditional-logic/utils/buildConditionalLogicFields';
import {
  DEAL_PIPELINE_FIELD_NAME,
  DEAL_STAGE_FIELD_NAME,
} from '@/pipeline/stage-picker/utils/dealStageFields';
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

type DealStageEntryDialogContentProps = {
  request: DealStageEntryDialogRequest;
  objectMetadataItem: EnrichedObjectMetadataItem;
  onSettle: (values: DealStageEntryValues | null) => void;
};

const DealStageEntryDialogContent = ({
  request,
  objectMetadataItem,
  onSettle,
}: DealStageEntryDialogContentProps) => {
  const { t } = useLingui();
  const [draftValues, setDraftValues] = useState<DealStageEntryValues>({});

  const { requirement, record } = request;
  const stageLabel = requirement.stage.label;

  const fields = useMemo(
    () => buildConditionalLogicFields(objectMetadataItem.fields),
    [objectMetadataItem.fields],
  );

  const missingRequiredFields = findMissingConditionalLogicProperties({
    rules: requirement.stage.conditionalRules,
    record: {
      ...record,
      [DEAL_STAGE_FIELD_NAME]: requirement.stage.value,
      [DEAL_PIPELINE_FIELD_NAME]: requirement.pipeline.key,
      ...draftValues,
    },
    fields,
  });

  const rows = requirement.properties.flatMap(({ fieldName, isRequired }) => {
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
      dialogId={DEAL_STAGE_ENTRY_DIALOG_ID}
      // Field pickers open dropdowns outside the popup, so only the buttons close it
      dismissible={false}
      onClose={() => onSettle(null)}
      renderInDocumentBody
    >
      {({ onKeyDown }) => (
        <Dialog.Popup onKeyDown={onKeyDown} size="md">
          <Dialog.Header>
            <Dialog.Title>{t`Move to ${stageLabel}`}</Dialog.Title>
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
                  <StyledHint>{t`Fill the required fields to move this deal.`}</StyledHint>
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
                {t`Move`}
              </Button>
            </StyledFooter>
          </Dialog.Footer>
        </Dialog.Popup>
      )}
    </DialogInstance>
  );
};

// Mounted once; useDealStageEntry opens it and waits for the user's answer
export const DealStageEntryDialog = () => {
  const dealStageEntryDialogRequest = useAtomStateValue(
    dealStageEntryDialogRequestState,
  );
  const setDealStageEntryDialogRequest = useSetAtomState(
    dealStageEntryDialogRequestState,
  );
  const objectMetadataItems = useAtomStateValue(objectMetadataItemsSelector);
  const { closeDialog } = useDialog();

  const objectMetadataItem = objectMetadataItems.find(
    ({ nameSingular }) => nameSingular === CoreObjectNameSingular.Opportunity,
  );

  if (
    !isDefined(dealStageEntryDialogRequest) ||
    !isDefined(objectMetadataItem)
  ) {
    return null;
  }

  const handleSettle = (values: DealStageEntryValues | null) => {
    setDealStageEntryDialogRequest(null);
    closeDialog(DEAL_STAGE_ENTRY_DIALOG_ID);
    dealStageEntryDialogRequest.resolve(values);
  };

  return (
    <DealStageEntryDialogContent
      key={`${String(dealStageEntryDialogRequest.record.id)}-${dealStageEntryDialogRequest.requirement.stage.value}`}
      request={dealStageEntryDialogRequest}
      objectMetadataItem={objectMetadataItem}
      onSettle={handleSettle}
    />
  );
};
