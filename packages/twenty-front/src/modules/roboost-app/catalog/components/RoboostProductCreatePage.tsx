import { useLingui } from '@lingui/react/macro';
import { isNonEmptyString } from '@sniptt/guards';
import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { AppPath, SettingsPath } from 'twenty-shared/types';
import {
  formatRoboostCurrencyName,
  formatRoboostCurrencyValue,
  getSettingsPath,
  isDefined,
} from 'twenty-shared/utils';
import { useToast } from 'twenty-ui/components/feedback';

import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { useCreateOneRecord } from '@/object-record/hooks/useCreateOneRecord';
import { useUploadFilesFieldFile } from '@/object-record/record-field/ui/meta-types/hooks/useUploadFilesFieldFile';
import { getRoboostPriceFieldName } from '@/roboost-app/catalog/utils/getRoboostPriceFieldName';
import { useRoboostCurrencies } from '@/roboost-app/currencies/hooks/useRoboostCurrencies';
import { getRoboostFieldInputKey } from '@/roboost-app/fields/getRoboostFieldInputKey';
import { isRoboostFieldValueFilled } from '@/roboost-app/fields/isRoboostFieldValueFilled';
import { RoboostFieldInput } from '@/roboost-app/fields/RoboostFieldInput';
import { useRoboostFormFields } from '@/roboost-app/hooks/useRoboostFormFields';
import { getRoboostFormsSettingsPath } from '@/roboost-app/layout/utils/getRoboostLayoutSettingsPath';
import { Button } from '@/roboost-ui/components/Button';
import { Field } from '@/roboost-ui/components/Field';
import { Input } from '@/roboost-ui/components/Input';
import { Toggle } from '@/roboost-ui/components/Toggle';
import { useNavigateApp } from '~/hooks/useNavigateApp';

type RoboostProductCreatePageProps = {
  objectMetadataItem: EnrichedObjectMetadataItem;
  onClose: () => void;
};

type ImageValue = { fileId: string; label: string };

// Full-page product form like HubSpot's: information, billing, then one price per active currency
const PAGE_MANAGED_FIELD_NAMES = new Set([
  'billingFrequency',
  'term',
  'unitCost',
  'image',
  'isActive',
  'margin',
]);

export const RoboostProductCreatePage = ({
  objectMetadataItem,
  onClose,
}: RoboostProductCreatePageProps) => {
  const { t } = useLingui();
  const { enqueueToast } = useToast();
  const navigateApp = useNavigateApp();
  const { activeCurrencies, companyCurrency } = useRoboostCurrencies();
  const { createOneRecord } = useCreateOneRecord({
    objectNameSingular: objectMetadataItem.nameSingular,
  });
  const { uploadFile } = useUploadFilesFieldFile();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [values, setValues] = useState<Record<string, unknown>>({
    isActive: true,
    billingFrequency: 'ONE_TIME',
  });
  const [description, setDescription] = useState('');
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [unitCost, setUnitCost] = useState('');
  const [image, setImage] = useState<ImageValue | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const companyCode = companyCurrency?.code ?? 'USD';
  const field = (name: string) =>
    objectMetadataItem.fields.find(
      (candidate) => candidate.name === name && candidate.isActive,
    );
  const imageField = field('image');
  const formFields = useRoboostFormFields(objectMetadataItem);
  const formField = (name: string) =>
    formFields.find((candidate) => candidate.field.name === name);
  // Prices, unit cost, image and Active have their own controls on this page
  const informationFields = formFields.filter(
    ({ field: candidate }) =>
      !PAGE_MANAGED_FIELD_NAMES.has(candidate.name) &&
      !candidate.name.startsWith('price'),
  );
  const companyPrice = Number(prices[companyCode]);
  const cost = Number(unitCost);
  const margin =
    prices[companyCode] !== undefined && prices[companyCode] !== ''
      ? companyPrice - (Number.isFinite(cost) ? cost : 0)
      : null;
  const isRecurring =
    isNonEmptyString(values.billingFrequency) &&
    values.billingFrequency !== 'ONE_TIME';
  const isValid =
    isNonEmptyString(values.name) &&
    (values.name as string).trim() !== '' &&
    formFields.every(({ field: candidate, isRequired }) =>
      !isRequired
        ? true
        : candidate.name === 'productDescription'
          ? description.trim() !== ''
          : PAGE_MANAGED_FIELD_NAMES.has(candidate.name) ||
            isRoboostFieldValueFilled(values[candidate.name]),
    ) &&
    Number.isFinite(companyPrice) &&
    prices[companyCode] !== undefined &&
    prices[companyCode] !== '';

  const setValue = (name: string, value: unknown) =>
    setValues((current) => ({ ...current, [name]: value }));

  const handleImage = async (file: File | undefined) => {
    if (!isDefined(file) || !isDefined(imageField)) {
      return;
    }
    const uploaded = await uploadFile(file, imageField.id);

    setImage({ fileId: uploaded.fileId, label: uploaded.label });
  };

  const reset = () => {
    setValues({ isActive: true, billingFrequency: 'ONE_TIME' });
    setDescription('');
    setPrices({});
    setUnitCost('');
    setImage(null);
  };

  const handleCreate = async (addAnother: boolean) => {
    setIsSaving(true);
    try {
      const input: Record<string, unknown> = {
        name: (values.name as string).trim(),
        isActive: values.isActive !== false,
        billingFrequency: values.billingFrequency,
      };

      for (const { field: candidate } of formFields) {
        if (
          !PAGE_MANAGED_FIELD_NAMES.has(candidate.name) &&
          candidate.name !== 'productDescription' &&
          candidate.name !== 'name' &&
          isRoboostFieldValueFilled(values[candidate.name])
        ) {
          input[getRoboostFieldInputKey(candidate)] = values[candidate.name];
        }
      }
      if (!isRecurring) {
        delete input.term;
      }
      if (description.trim() !== '') {
        input.productDescription = { markdown: description, blocknote: null };
      }
      for (const currency of activeCurrencies) {
        const raw = prices[currency.code];

        if (raw !== undefined && raw !== '' && Number.isFinite(Number(raw))) {
          input[getRoboostPriceFieldName(currency.code)] = Number(raw);
        }
      }
      if (unitCost !== '' && Number.isFinite(cost)) {
        input.unitCost = {
          amountMicros: Math.round(cost * 1_000_000),
          currencyCode: companyCode,
        };
      }
      if (isDefined(image)) {
        input.image = [image];
      }
      const record = await createOneRecord(input);

      if (addAnother) {
        enqueueToast({
          status: 'success',
          children: t`${String(input.name)} created`,
        });
        reset();
      } else {
        onClose();
        navigateApp(AppPath.RecordShowPage, {
          objectNameSingular: objectMetadataItem.nameSingular,
          objectRecordId: record.id,
        });
      }
    } catch (error) {
      enqueueToast({
        status: 'error',
        children: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setIsSaving(false);
    }
  };

  const renderInput = (name: string) => {
    const metadata = field(name);
    const configured = formField(name);

    return isDefined(metadata) && isDefined(configured) ? (
      <Field
        label={metadata.label}
        required={name === 'name' || configured.isRequired}
      >
        <RoboostFieldInput
          field={metadata}
          value={values[name]}
          onChange={(value) => setValue(name, value)}
        />
      </Field>
    ) : null;
  };

  return createPortal(
    <div className="rb-ui rb-pcreate">
      <div className="rb-pcreate-bar">
        <Button variant="secondary" onClick={onClose}>
          {t`Exit`}
        </Button>
        <h1 className="rb-pcreate-title">{t`Create product`}</h1>
        <div className="rb-pcreate-actions">
          <Button
            variant="secondary"
            disabled={!isValid || isSaving}
            onClick={() => handleCreate(true)}
          >
            {t`Create and add another`}
          </Button>
          <Button
            variant="primary"
            disabled={!isValid || isSaving}
            onClick={() => handleCreate(false)}
          >
            {t`Create`}
          </Button>
        </div>
      </div>
      <div className="rb-pcreate-sub">
        <Link
          className="rb-pcreate-link"
          to={getRoboostFormsSettingsPath(objectMetadataItem.nameSingular)}
          onClick={onClose}
        >
          {t`Edit this form`}
        </Link>
        <label className="rb-pcreate-active">
          <span>{t`Active`}</span>
          <Toggle
            checked={values.isActive !== false}
            onChange={(checked) => setValue('isActive', checked)}
          />
        </label>
      </div>
      <div className="rb-pcreate-body">
        <section className="rb-pcreate-card">
          <h2 className="rb-pcreate-heading">{t`Product information`}</h2>
          <div className="rb-pcreate-info">
            <div className="rb-pcreate-grid">
              {informationFields.map(({ field: candidate, isRequired }) =>
                candidate.name === 'productDescription' ? (
                  <Field
                    key={candidate.id}
                    label={candidate.label}
                    required={isRequired}
                    className="rb-pcreate-wide"
                  >
                    <textarea
                      className="rb-input rb-pcreate-textarea"
                      value={description}
                      onChange={(event) => setDescription(event.target.value)}
                    />
                  </Field>
                ) : (
                  <div key={candidate.id}>{renderInput(candidate.name)}</div>
                ),
              )}
            </div>
            <div className="rb-pcreate-image">
              {isDefined(image) ? (
                <>
                  <span className="rb-pcreate-image-name">{image.label}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setImage(null)}
                  >
                    {t`Remove`}
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon="upload"
                    disabled={!isDefined(imageField)}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {t`Upload`}
                  </Button>
                  <button
                    type="button"
                    className="rb-pcreate-link"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {t`Browse images`}
                  </button>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(event) => handleImage(event.target.files?.[0])}
              />
            </div>
          </div>
        </section>

        <section className="rb-pcreate-card">
          <h2 className="rb-pcreate-heading">{t`Billing details`}</h2>
          <div className="rb-pcreate-grid">
            {renderInput('billingFrequency')}
            {isRecurring && renderInput('term')}
          </div>
        </section>

        <section className="rb-pcreate-card">
          <div className="rb-pcreate-head">
            <h2 className="rb-pcreate-heading">{t`Pricing configuration`}</h2>
            <Link
              className="rb-pcreate-link"
              to={getSettingsPath(SettingsPath.Currencies)}
              target="_blank"
            >
              {t`Manage currencies ↗`}
            </Link>
          </div>
          <p className="rb-pcreate-muted">
            {t`Default currency: ${formatRoboostCurrencyName(companyCode)}`}
          </p>
          <div className="rb-pcreate-prices">
            {activeCurrencies.map((currency) => (
              <Field
                key={currency.code}
                label={`${t`Price`} ${currency.code}`}
                required={currency.isCompanyCurrency}
              >
                <Input
                  type="number"
                  value={prices[currency.code] ?? ''}
                  onChange={(event) =>
                    setPrices((current) => ({
                      ...current,
                      [currency.code]: event.target.value,
                    }))
                  }
                />
              </Field>
            ))}
          </div>
          <div className="rb-pcreate-grid">
            <Field
              label={t`Unit cost`}
              hint={t`In ${companyCode}: what one unit costs you`}
            >
              <Input
                type="number"
                value={unitCost}
                onChange={(event) => setUnitCost(event.target.value)}
              />
            </Field>
            <Field
              label={t`Margin`}
              hint={t`Price ${companyCode} minus unit cost`}
            >
              <Input
                value={
                  margin === null
                    ? ''
                    : formatRoboostCurrencyValue(margin, companyCode)
                }
                disabled
              />
            </Field>
          </div>
        </section>
      </div>
    </div>,
    document.body,
  );
};
