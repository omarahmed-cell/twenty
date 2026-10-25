import {
  computeLineItemDerivedFields,
  computeLineItemTotalPrice,
} from 'src/modules/line-item/utils/compute-line-item-derived-fields.util';

const SIRA_PRODUCT = {
  name: 'SIRA - Presence Package',
  billingFrequency: 'MONTHLY',
  unitPrice: { amountMicros: 250_000_000, currencyCode: 'USD' },
};

describe('computeLineItemTotalPrice', () => {
  it('should multiply unit price by quantity and apply the discount', () => {
    expect(
      computeLineItemTotalPrice({
        unitPrice: { amountMicros: 250_000_000, currencyCode: 'USD' },
        quantity: 4,
        unitDiscount: 0.1,
      }),
    ).toEqual({ amountMicros: 900_000_000, currencyCode: 'USD' });
  });

  it('should accept amounts sent as strings by the API', () => {
    expect(
      computeLineItemTotalPrice({
        unitPrice: { amountMicros: '1500000', currencyCode: 'EUR' },
        quantity: 2,
        unitDiscount: null,
      }),
    ).toEqual({ amountMicros: 3_000_000, currencyCode: 'EUR' });
  });

  it('should leave the amount empty until price and quantity are set', () => {
    expect(
      computeLineItemTotalPrice({
        unitPrice: { amountMicros: 250_000_000, currencyCode: 'USD' },
        quantity: null,
      }),
    ).toEqual({ amountMicros: null, currencyCode: 'USD' });
  });

  it('should keep the discount between 0% and 100%', () => {
    expect(
      computeLineItemTotalPrice({
        unitPrice: { amountMicros: 10_000_000, currencyCode: 'USD' },
        quantity: 1,
        unitDiscount: 1.5,
      }),
    ).toEqual({ amountMicros: 0, currencyCode: 'USD' });
  });

  it('should default the currency to USD', () => {
    expect(
      computeLineItemTotalPrice({
        unitPrice: { amountMicros: 10_000_000, currencyCode: '' },
        quantity: 3,
      }),
    ).toEqual({ amountMicros: 30_000_000, currencyCode: 'USD' });
  });
});

describe('computeLineItemDerivedFields', () => {
  it('should copy name, unit price and billing frequency from a newly selected product', () => {
    expect(
      computeLineItemDerivedFields({
        input: { productId: 'product-1' },
        existingRecord: {
          productId: null,
          quantity: 2,
          unitDiscount: 0,
          unitPrice: { amountMicros: null, currencyCode: 'USD' },
        },
        selectedProduct: SIRA_PRODUCT,
      }),
    ).toEqual({
      name: 'SIRA - Presence Package',
      unitPrice: { amountMicros: 250_000_000, currencyCode: 'USD' },
      billingFrequency: 'MONTHLY',
      totalPrice: { amountMicros: 500_000_000, currencyCode: 'USD' },
    });
  });

  it('should keep values typed in the same input over the product defaults', () => {
    expect(
      computeLineItemDerivedFields({
        input: {
          productId: 'product-1',
          quantity: 1,
          unitPrice: { amountMicros: 200_000_000, currencyCode: 'USD' },
        },
        existingRecord: null,
        selectedProduct: SIRA_PRODUCT,
      }),
    ).toEqual({
      name: 'SIRA - Presence Package',
      billingFrequency: 'MONTHLY',
      totalPrice: { amountMicros: 200_000_000, currencyCode: 'USD' },
    });
  });

  it('should not overwrite edited values when the product is unchanged', () => {
    expect(
      computeLineItemDerivedFields({
        input: { quantity: 3 },
        existingRecord: {
          productId: 'product-1',
          quantity: 1,
          unitDiscount: 0.5,
          unitPrice: { amountMicros: 100_000_000, currencyCode: 'USD' },
        },
        selectedProduct: SIRA_PRODUCT,
      }),
    ).toEqual({
      totalPrice: { amountMicros: 150_000_000, currencyCode: 'USD' },
    });
  });

  it('should leave the total alone when no pricing input changes', () => {
    expect(
      computeLineItemDerivedFields({
        input: { name: 'Renamed line' },
        existingRecord: {
          productId: 'product-1',
          quantity: 1,
          unitPrice: { amountMicros: 100_000_000, currencyCode: 'USD' },
        },
        selectedProduct: null,
      }),
    ).toEqual({});
  });
});
