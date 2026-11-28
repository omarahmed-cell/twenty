import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { isDefined } from 'twenty-shared/utils';
import { useToast } from 'twenty-ui/components/feedback';

import { useObjectMetadataItems } from '@/object-metadata/hooks/useObjectMetadataItems';
import { useCreateOneRecord } from '@/object-record/hooks/useCreateOneRecord';
import { getRoboostFieldInputKey } from '@/roboost-app/fields/getRoboostFieldInputKey';
import { isRoboostFieldValueFilled } from '@/roboost-app/fields/isRoboostFieldValueFilled';
import { RoboostFieldInput } from '@/roboost-app/fields/RoboostFieldInput';
import { useRoboostFormFields } from '@/roboost-app/hooks/useRoboostFormFields';
import { getRoboostFormsSettingsPath } from '@/roboost-app/layout/utils/getRoboostLayoutSettingsPath';
import { Button } from '@/roboost-ui/components/Button';
import { Field } from '@/roboost-ui/components/Field';
import { Modal } from '@/roboost-ui/components/Modal';

type RoboostCustomLineItemModalProps = {
  dealId: string;
  dealCurrency: string;
  onClose: () => void;
  onCreated: () => void;
};

// A line that isn't in the product library; its fields, order and required flags come from Layout > Forms
export const RoboostCustomLineItemModal = ({
  dealId,
  dealCurrency,
  onClose,
  onCreated,
}: RoboostCustomLineItemModalProps) => {
  const { t } = useLingui();
  const { enqueueToast } = useToast();
  const { objectMetadataItems } = useObjectMetadataItems();
  const lineItemObject = objectMetadataItems.find(
    ({ nameSingular }) => nameSingular === 'lineItem',
  );
  const formFields = useRoboostFormFields(lineItemObject);
  const { createOneRecord } = useCreateOneRecord({
    objectNameSingular: 'lineItem',
  });
  const [values, setValues] = useState<Record<string, unknown>>({
    quantity: 1,
    unitPrice: { amountMicros: null, currencyCode: dealCurrency },
    discountType: 'PERCENTAGE',
    unitDiscount: 0,
  });
  const [relatedRecords, setRelatedRecords] = useState<
    Record<string, { id: string; label: string } | null>
  >({});
  const [isSaving, setIsSaving] = useState(false);
  const isValid = formFields.every(
    ({ field, isRequired }) =>
      !isRequired || isRoboostFieldValueFilled(values[field.name]),
  );

  const handleCreate = async () => {
    setIsSaving(true);
    try {
      const input: Record<string, unknown> = { dealId, source: 'DEAL' };

      for (const { field } of formFields) {
        if (isRoboostFieldValueFilled(values[field.name])) {
          input[getRoboostFieldInputKey(field)] = values[field.name];
        }
      }
      await createOneRecord(input);
      onCreated();
    } catch (error) {
      enqueueToast({
        status: 'error',
        children: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      title={t`Create custom line item`}
      onClose={onClose}
      width={480}
      footer={
        <>
          <Link
            className="rb-link rb-li-form-edit"
            to={getRoboostFormsSettingsPath('lineItem')}
            onClick={onClose}
          >
            {t`Edit this form`}
          </Link>
          <Button variant="secondary" onClick={onClose}>
            {t`Cancel`}
          </Button>
          <Button
            variant="primary"
            disabled={!isValid || isSaving}
            onClick={handleCreate}
          >
            {t`Add line item`}
          </Button>
        </>
      }
    >
      <div className="rb-cur-form">
        {formFields.map(({ field, isRequired }) => (
          <Field key={field.id} label={field.label} required={isRequired}>
            <RoboostFieldInput
              field={field}
              value={values[field.name]}
              relatedRecord={
                isDefined(relatedRecords[field.name])
                  ? {
                      id: relatedRecords[field.name]?.id,
                      name: relatedRecords[field.name]?.label,
                    }
                  : null
              }
              onChange={(value, related) => {
                setValues((current) => ({ ...current, [field.name]: value }));
                if (related !== undefined) {
                  setRelatedRecords((current) => ({
                    ...current,
                    [field.name]: related,
                  }));
                }
              }}
            />
          </Field>
        ))}
      </div>
    </Modal>
  );
};
