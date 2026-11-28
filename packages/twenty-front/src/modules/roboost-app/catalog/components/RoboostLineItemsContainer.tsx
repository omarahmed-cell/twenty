import { useLingui } from '@lingui/react/macro';
import { useEffect, useState } from 'react';
import { formatRoboostCurrencyValue, isDefined } from 'twenty-shared/utils';
import { useToast } from 'twenty-ui/components/feedback';

import { useCreateOneRecord } from '@/object-record/hooks/useCreateOneRecord';
import { useDeleteOneRecord } from '@/object-record/hooks/useDeleteOneRecord';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { useFindOneRecord } from '@/object-record/hooks/useFindOneRecord';
import { useUpdateOneRecord } from '@/object-record/hooks/useUpdateOneRecord';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { RoboostConvertLineItemsModal } from '@/roboost-app/catalog/components/RoboostConvertLineItemsModal';
import { RoboostCustomLineItemModal } from '@/roboost-app/catalog/components/RoboostCustomLineItemModal';
import {
  type RoboostLibraryProduct,
  RoboostProductLibraryModal,
} from '@/roboost-app/catalog/components/RoboostProductLibraryModal';
import { computeRoboostLineItemTotal } from '@/roboost-app/catalog/utils/computeRoboostLineItemTotal';
import { getRoboostPriceFieldName } from '@/roboost-app/catalog/utils/getRoboostPriceFieldName';
import {
  convertRoboostAmount,
  getRoboostProductPrice,
} from '@/roboost-app/catalog/utils/getRoboostProductPrice';
import { useRoboostCurrencies } from '@/roboost-app/currencies/hooks/useRoboostCurrencies';
import { RoboostRecordContainer } from '@/roboost-app/record/components/RoboostRecordContainer';
import { useRoboostAccess } from '@/roboost-app/users-and-teams/hooks/useRoboostAccess';
import { canRoboostWriteObject } from '@/roboost-app/users-and-teams/utils/canRoboostWriteObject';
import { Icon } from '@/roboost-ui/components/Icon';
import { Menu, type MenuEntry } from '@/roboost-ui/components/Menu';
import { Select } from '@/roboost-ui/components/Select';

export type RoboostLineItem = ObjectRecord & {
  name?: string | null;
  quantity?: number | null;
  unitPrice?: {
    amountMicros?: number | null;
    currencyCode?: string | null;
  } | null;
  unitDiscount?: number | null;
  discountType?: string | null;
  isPriceConverted?: boolean | null;
  totalInCompanyCurrency?: { amountMicros?: number | null } | null;
  product?:
    | ({ id: string; name?: string | null } & Record<string, unknown>)
    | null;
};

type RoboostLineItemsContainerProps = {
  id: string;
  title: string;
  dealId: string;
  settingsEntries: MenuEntry[];
  isDropTarget: boolean;
  onDragStart: (id: string) => void;
  onDragOver: (id: string) => void;
  onDrop: (id: string) => void;
  onDragEnd: () => void;
};

type EditingCell = {
  id: string;
  field: 'quantity' | 'price' | 'discount' | 'currency';
};

// What was sold on the deal; the total stays on this card and never overwrites the deal Amount
export const RoboostLineItemsContainer = ({
  id,
  title,
  dealId,
  settingsEntries,
  isDropTarget,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: RoboostLineItemsContainerProps) => {
  const { t } = useLingui();
  const { enqueueToast } = useToast();
  const roboostAccess = useRoboostAccess();
  const canEdit = canRoboostWriteObject(roboostAccess, 'opportunity', 'edit');
  const { companyCurrency, byCode, activeCurrencies } = useRoboostCurrencies();
  const companyCode = companyCurrency?.code ?? 'USD';
  const priceFields = Object.fromEntries(
    activeCurrencies.map(({ code }) => [getRoboostPriceFieldName(code), true]),
  );
  const { record: deal } = useFindOneRecord<
    ObjectRecord & {
      currency?: string | null;
      dealAmount?: number | null;
      exchangeRate?: number | null;
    }
  >({
    objectNameSingular: 'opportunity',
    objectRecordId: dealId,
    recordGqlFields: {
      id: true,
      currency: true,
      dealAmount: true,
      exchangeRate: true,
    },
  });
  const { records, refetch } = useFindManyRecords<RoboostLineItem>({
    objectNameSingular: 'lineItem',
    filter: { dealId: { eq: dealId } },
    recordGqlFields: {
      id: true,
      name: true,
      quantity: true,
      unitPrice: true,
      unitDiscount: true,
      discountType: true,
      isPriceConverted: true,
      totalInCompanyCurrency: true,
      product: { id: true, name: true, ...priceFields },
    },
    orderBy: [{ createdAt: 'AscNullsLast' }],
    limit: 200,
  });
  const { createOneRecord } = useCreateOneRecord({
    objectNameSingular: 'lineItem',
  });
  const { updateOneRecord } = useUpdateOneRecord();
  const { deleteOneRecord } = useDeleteOneRecord({
    objectNameSingular: 'lineItem',
  });
  const [modal, setModal] = useState<'library' | 'custom' | null>(null);
  const [editing, setEditing] = useState<EditingCell | null>(null);
  const [draft, setDraft] = useState('');
  const [seenCurrency, setSeenCurrency] = useState<string | null>(null);
  const [convertFrom, setConvertFrom] = useState<string | null>(null);
  const dealCurrency = deal?.currency ?? companyCode;
  const lineCurrency = (lineItem: RoboostLineItem) =>
    lineItem.unitPrice?.currencyCode || dealCurrency;
  // Lines in another currency go through the company currency: the server's company total (the deal's frozen
  // close-date rates on a closed deal, else the latest), then the deal's own rate
  const dealRate =
    dealCurrency === companyCode
      ? 1
      : (deal?.exchangeRate ?? byCode.get(dealCurrency)?.rate);
  const toDealCurrency = (lineItem: RoboostLineItem) => {
    const lineTotal = computeRoboostLineItemTotal(lineItem) ?? 0;

    if (lineCurrency(lineItem) === dealCurrency) {
      return lineTotal;
    }
    const companyMicros = lineItem.totalInCompanyCurrency?.amountMicros;

    if (isDefined(companyMicros) && isDefined(dealRate) && dealRate > 0) {
      return companyMicros / 1_000_000 / dealRate;
    }

    return (
      convertRoboostAmount({
        amount: lineTotal,
        fromCode: lineCurrency(lineItem),
        toCode: dealCurrency,
        companyCode,
        byCode,
      }) ?? 0
    );
  };
  const hasConvertedLines = records.some(
    (lineItem) => lineCurrency(lineItem) !== dealCurrency,
  );
  const total = records.reduce(
    (sum, lineItem) => sum + toDealCurrency(lineItem),
    0,
  );
  const dealAmount = deal?.dealAmount;
  const differs =
    records.length > 0 &&
    isDefined(dealAmount) &&
    Math.abs(total - dealAmount) > 0.005;

  // A new deal currency asks whether the line prices follow
  useEffect(() => {
    if (!isDefined(deal?.currency)) {
      return;
    }
    if (seenCurrency === null) {
      setSeenCurrency(deal.currency);

      return;
    }
    if (seenCurrency !== deal.currency) {
      if (records.some((lineItem) => lineCurrency(lineItem) === seenCurrency)) {
        setConvertFrom(seenCurrency);
      }
      setSeenCurrency(deal.currency);
    }
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [deal?.currency, seenCurrency, records.length]);

  const showError = (error: unknown) =>
    enqueueToast({
      status: 'error',
      children: error instanceof Error ? error.message : String(error),
    });

  const addFromProduct = async (
    product: RoboostLibraryProduct,
    currencyCode: string,
  ) => {
    setModal(null);
    const { price, isConverted: isPriceConverted } = getRoboostProductPrice({
      product,
      currencyCode,
      companyCode,
      byCode,
    });
    try {
      await createOneRecord({
        dealId,
        productId: product.id,
        name: product.name ?? '',
        quantity: 1,
        sku: product.sku ?? null,
        billingFrequency: product.billingFrequency ?? null,
        term: product.term ?? null,
        description: product.productDescription?.markdown ?? null,
        unitCost: isDefined(product.unitCost?.amountMicros)
          ? product.unitCost.amountMicros / 1_000_000
          : null,
        unitPrice: {
          amountMicros: isDefined(price) ? Math.round(price * 1_000_000) : null,
          currencyCode,
        },
        discountType: 'PERCENTAGE',
        unitDiscount: 0,
        source: 'DEAL',
        isPriceConverted,
      });
      if (isPriceConverted) {
        enqueueToast({
          status: 'warning',
          children: t`${product.name ?? ''} has no ${currencyCode} price: its ${companyCode} price was converted at today's rate`,
        });
      }
      await refetch();
    } catch (error) {
      showError(error);
    }
  };

  const startEdit = (
    lineItem: RoboostLineItem,
    field: EditingCell['field'],
  ) => {
    if (!canEdit) {
      return;
    }
    setEditing({ id: lineItem.id, field });
    setDraft(
      String(
        field === 'quantity'
          ? (lineItem.quantity ?? 1)
          : field === 'price'
            ? (lineItem.unitPrice?.amountMicros ?? 0) / 1_000_000
            : (lineItem.unitDiscount ?? 0),
      ),
    );
  };

  const saveEdit = async () => {
    if (editing === null) {
      return;
    }
    const value = Number(draft);
    const lineItem = records.find(({ id: lineId }) => lineId === editing.id);

    setEditing(null);
    if (!Number.isFinite(value) || !isDefined(lineItem)) {
      return;
    }
    const input =
      editing.field === 'quantity'
        ? { quantity: value }
        : editing.field === 'price'
          ? {
              unitPrice: {
                amountMicros: Math.round(value * 1_000_000),
                currencyCode: lineCurrency(lineItem),
              },
              isPriceConverted: false,
            }
          : { unitDiscount: value };

    try {
      await updateOneRecord({
        objectNameSingular: 'lineItem',
        idToUpdate: lineItem.id,
        updateOneRecordInput: input,
      });
      await refetch();
    } catch (error) {
      showError(error);
    }
  };

  // A product line takes the product's price in the new currency; any other price converts at today's rate
  const changeCurrency = async (
    lineItem: RoboostLineItem,
    currencyCode: string,
  ) => {
    setEditing(null);
    const fromCode = lineCurrency(lineItem);

    if (currencyCode === fromCode) {
      return;
    }
    const current = (lineItem.unitPrice?.amountMicros ?? 0) / 1_000_000;
    const productPrice = isDefined(lineItem.product)
      ? getRoboostProductPrice({
          product: lineItem.product,
          currencyCode,
          companyCode,
          byCode,
        })
      : null;
    const converted = convertRoboostAmount({
      amount: current,
      fromCode,
      toCode: currencyCode,
      companyCode,
      byCode,
    });
    const price = isDefined(productPrice?.price)
      ? productPrice.price
      : converted;
    const discount = lineItem.unitDiscount ?? 0;

    try {
      await updateOneRecord({
        objectNameSingular: 'lineItem',
        idToUpdate: lineItem.id,
        updateOneRecordInput: {
          unitPrice: {
            amountMicros: isDefined(price)
              ? Math.round(price * 1_000_000)
              : null,
            currencyCode,
          },
          isPriceConverted: isDefined(productPrice?.price)
            ? productPrice.isConverted
            : true,
          ...(lineItem.discountType === 'AMOUNT'
            ? {
                unitDiscount:
                  convertRoboostAmount({
                    amount: discount,
                    fromCode,
                    toCode: currencyCode,
                    companyCode,
                    byCode,
                  }) ?? discount,
              }
            : {}),
        },
      });
      await refetch();
    } catch (error) {
      showError(error);
    }
  };

  const remove = async (lineItem: RoboostLineItem) => {
    try {
      await deleteOneRecord(lineItem.id);
      await refetch();
    } catch (error) {
      showError(error);
    }
  };

  const renderCell = (
    lineItem: RoboostLineItem,
    field: EditingCell['field'],
    text: string,
  ) =>
    editing?.id === lineItem.id && editing.field === field ? (
      <input
        className="rb-input rb-li-input"
        type="number"
        autoFocus
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={saveEdit}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            saveEdit();
          }
          if (event.key === 'Escape') {
            setEditing(null);
          }
        }}
      />
    ) : (
      <button
        type="button"
        className="rb-li-cell"
        disabled={!canEdit}
        onClick={() => startEdit(lineItem, field)}
      >
        {text}
      </button>
    );

  const addEntries: MenuEntry[] = [
    {
      id: 'library',
      label: t`Add from product library`,
      icon: 'search',
      isNoPermission: !canEdit,
      onSelect: () => setModal('library'),
    },
    {
      id: 'custom',
      label: t`Create custom line item`,
      icon: 'plus',
      isNoPermission: !canEdit,
      onSelect: () => setModal('custom'),
    },
  ];

  return (
    <RoboostRecordContainer
      id={id}
      title={title}
      count={records.length}
      defaultOpen
      settingsEntries={settingsEntries}
      isDropTarget={isDropTarget}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      actions={
        <Menu
          align="right"
          minWidth={240}
          entries={addEntries}
          trigger={({ toggle, isOpen }) => (
            <button
              type="button"
              className="rb-rc-actbtn"
              aria-expanded={isOpen}
              onClick={toggle}
            >
              <Icon name="plus" size={12} strokeWidth={2} />
              {t`Add`}
            </button>
          )}
        />
      }
    >
      {records.length === 0 ? (
        <div className="rb-rc-empty">{t`No line items yet.`}</div>
      ) : (
        <div className="rb-li-list">
          {records.map((lineItem) => {
            const lineTotal = computeRoboostLineItemTotal(lineItem);
            const unitPrice =
              (lineItem.unitPrice?.amountMicros ?? 0) / 1_000_000;
            const discount = lineItem.unitDiscount ?? 0;
            const currency = lineCurrency(lineItem);

            return (
              <div key={lineItem.id} className="rb-li-row">
                <div className="rb-li-main">
                  <span className="rb-li-name">
                    {lineItem.product?.name ?? lineItem.name ?? t`Custom item`}
                  </span>
                  <span className="rb-li-math">
                    {renderCell(
                      lineItem,
                      'quantity',
                      String(lineItem.quantity ?? 1),
                    )}
                    <span>×</span>
                    {renderCell(
                      lineItem,
                      'price',
                      formatRoboostCurrencyValue(unitPrice, currency),
                    )}
                    {editing?.id === lineItem.id &&
                    editing.field === 'currency' ? (
                      <Select
                        aria-label={t`Currency`}
                        className="rb-li-currency-select"
                        value={currency}
                        autoOpen
                        options={activeCurrencies.map(({ code }) => ({
                          value: code,
                          label: code,
                        }))}
                        onChange={(code) => changeCurrency(lineItem, code)}
                      />
                    ) : (
                      <button
                        type="button"
                        className="rb-li-currency"
                        disabled={!canEdit}
                        aria-label={t`Line currency ${currency}`}
                        onClick={() =>
                          setEditing({ id: lineItem.id, field: 'currency' })
                        }
                      >
                        {currency}
                      </button>
                    )}
                    {lineItem.isPriceConverted === true && (
                      <span
                        className="rb-li-flag"
                        data-tooltip={t`Converted from the company currency price at today's rate`}
                      >
                        <Icon name="alert-triangle" size={12} />
                      </span>
                    )}
                  </span>
                  <span className="rb-li-discount">
                    {t`Discount`}{' '}
                    {renderCell(
                      lineItem,
                      'discount',
                      lineItem.discountType === 'AMOUNT'
                        ? formatRoboostCurrencyValue(discount, currency)
                        : `${discount}%`,
                    )}
                  </span>
                </div>
                <div className="rb-li-side">
                  <strong>
                    {formatRoboostCurrencyValue(lineTotal, currency)}
                  </strong>
                  {canEdit && (
                    <button
                      type="button"
                      className="rb-li-remove"
                      data-tooltip={t`Remove`}
                      aria-label={t`Remove`}
                      onClick={() => remove(lineItem)}
                    >
                      <Icon name="trash" size={12} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          <div className="rb-li-foot">
            <span>{t`Total:`}</span>
            <strong>{formatRoboostCurrencyValue(total, dealCurrency)}</strong>
            {hasConvertedLines && (
              <span
                className="rb-li-converted"
                data-tooltip={t`Lines in another currency are converted with the deal's exchange rate`}
              >
                {t`converted`}
              </span>
            )}
          </div>
          {differs && (
            <div className="rb-li-hint">
              {t`Line items total differs from Amount`}
            </div>
          )}
        </div>
      )}
      {modal === 'library' && (
        <RoboostProductLibraryModal
          dealCurrency={dealCurrency}
          onPick={addFromProduct}
          onClose={() => setModal(null)}
        />
      )}
      {modal === 'custom' && (
        <RoboostCustomLineItemModal
          dealId={dealId}
          dealCurrency={dealCurrency}
          onClose={() => setModal(null)}
          onCreated={async () => {
            setModal(null);
            await refetch();
          }}
        />
      )}
      {convertFrom !== null && (
        <RoboostConvertLineItemsModal
          fromCurrency={convertFrom}
          toCurrency={dealCurrency}
          lineItems={records.filter(
            (lineItem) => lineCurrency(lineItem) === convertFrom,
          )}
          onClose={() => setConvertFrom(null)}
          onDone={async () => {
            setConvertFrom(null);
            await refetch();
          }}
        />
      )}
    </RoboostRecordContainer>
  );
};
