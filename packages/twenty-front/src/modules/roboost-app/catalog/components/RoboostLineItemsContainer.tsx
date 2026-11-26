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
import { useRoboostCurrencies } from '@/roboost-app/currencies/hooks/useRoboostCurrencies';
import { RoboostRecordContainer } from '@/roboost-app/record/components/RoboostRecordContainer';
import { useRoboostAccess } from '@/roboost-app/users-and-teams/hooks/useRoboostAccess';
import { canRoboostWriteObject } from '@/roboost-app/users-and-teams/utils/canRoboostWriteObject';
import { Icon } from '@/roboost-ui/components/Icon';
import { Menu, type MenuEntry } from '@/roboost-ui/components/Menu';

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
  product?: { id: string; name?: string | null } | null;
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

type EditingCell = { id: string; field: 'quantity' | 'price' | 'discount' };

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
  const { companyCurrency, byCode } = useRoboostCurrencies();
  const { record: deal } = useFindOneRecord<
    ObjectRecord & { currency?: string | null; dealAmount?: number | null }
  >({
    objectNameSingular: 'opportunity',
    objectRecordId: dealId,
    recordGqlFields: { id: true, currency: true, dealAmount: true },
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
      product: { id: true, name: true },
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
  const dealCurrency = deal?.currency ?? companyCurrency?.code ?? 'USD';
  const total = records.reduce(
    (sum, lineItem) => sum + (computeRoboostLineItemTotal(lineItem) ?? 0),
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
      if (records.length > 0) {
        setConvertFrom(seenCurrency);
      }
      setSeenCurrency(deal.currency);
    }
  }, [deal?.currency, seenCurrency, records.length]);

  const showError = (error: unknown) =>
    enqueueToast({
      status: 'error',
      children: error instanceof Error ? error.message : String(error),
    });

  const addFromProduct = async (product: RoboostLibraryProduct) => {
    setModal(null);
    const ownPrice = product[getRoboostPriceFieldName(dealCurrency)];
    const companyCode = companyCurrency?.code ?? 'USD';
    const companyPrice = product[getRoboostPriceFieldName(companyCode)];
    const rate = byCode.get(dealCurrency)?.rate;
    let price: number | null = null;
    let isPriceConverted = false;

    if (typeof ownPrice === 'number') {
      price = ownPrice;
    } else if (
      typeof companyPrice === 'number' &&
      isDefined(rate) &&
      rate > 0
    ) {
      price = companyPrice / rate;
      isPriceConverted = true;
    }
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
          currencyCode: dealCurrency,
        },
        discountType: 'PERCENTAGE',
        unitDiscount: 0,
        source: 'DEAL',
        isPriceConverted,
      });
      if (isPriceConverted) {
        enqueueToast({
          status: 'warning',
          children: t`${product.name ?? ''} has no ${dealCurrency} price: its ${companyCode} price was converted at today's rate`,
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
                currencyCode: dealCurrency,
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
                      formatRoboostCurrencyValue(unitPrice, dealCurrency),
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
                        ? formatRoboostCurrencyValue(discount, dealCurrency)
                        : `${discount}%`,
                    )}
                  </span>
                </div>
                <div className="rb-li-side">
                  <strong>
                    {formatRoboostCurrencyValue(lineTotal, dealCurrency)}
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
          lineItems={records}
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
