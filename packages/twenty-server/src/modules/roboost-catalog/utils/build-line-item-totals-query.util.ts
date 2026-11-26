// Total = quantity x unit price, less the discount (a percentage, or an amount off the line), in the line's currency:
// the deal's currency when the line belongs to a deal. The company total uses the deal's exchange rate, else the
// latest rate of the line's currency. $1 holds the line item ids or deal ids, as the scope says.
export const buildLineItemTotalsQuery = (
  schemaName: string,
  scope: 'lineItems' | 'deals' | 'all',
) => {
  const schema = `"${schemaName}"`;
  const where =
    scope === 'lineItems'
      ? `AND li.id = ANY($1::uuid[])`
      : scope === 'deals'
        ? `AND li."dealId" = ANY($1::uuid[])`
        : '';

  return `
    WITH company AS (
      SELECT coalesce((SELECT code FROM ${schema}."roboostCurrency" WHERE "isCompanyCurrency" LIMIT 1), 'USD') AS code
    ),
    base AS (
      SELECT li.id,
        coalesce(o."currency"::text, nullif(li."unitPriceCurrencyCode", ''), company.code) AS currency,
        o."exchangeRate" AS "dealRate",
        company.code AS "companyCurrency",
        CASE WHEN li."unitPriceAmountMicros" IS NULL THEN NULL
          WHEN li."discountType"::text = 'AMOUNT'
            THEN coalesce(li.quantity, 1) * li."unitPriceAmountMicros" - coalesce(li."unitDiscount", 0) * 1000000
          ELSE coalesce(li.quantity, 1) * li."unitPriceAmountMicros" * (1 - coalesce(li."unitDiscount", 0) / 100.0)
        END AS total
      FROM ${schema}."lineItem" li
      CROSS JOIN company
      LEFT JOIN ${schema}."opportunity" o ON o.id = li."dealId" AND o."deletedAt" IS NULL
      WHERE li."deletedAt" IS NULL ${where}
    ),
    rated AS (
      SELECT base.*,
        CASE WHEN base.currency = base."companyCurrency" THEN 1
          WHEN base."dealRate" IS NOT NULL THEN base."dealRate"
          ELSE (SELECT r.rate FROM ${schema}."roboostExchangeRate" r
            WHERE r."currencyCode" = base.currency AND r."effectiveDate" <= current_date
            ORDER BY r."effectiveDate" DESC, (r.source = 'MANUAL') DESC, r."createdAt" DESC LIMIT 1)
        END AS rate
      FROM base
    )
    UPDATE ${schema}."lineItem" li SET
      "unitPriceCurrencyCode" = rated.currency,
      "totalPriceAmountMicros" = round(rated.total),
      "totalPriceCurrencyCode" = CASE WHEN rated.total IS NULL THEN NULL ELSE rated.currency END,
      "totalInCompanyCurrencyAmountMicros" = round(rated.total * rated.rate),
      "totalInCompanyCurrencyCurrencyCode" = CASE WHEN rated.total IS NULL OR rated.rate IS NULL THEN NULL ELSE rated."companyCurrency" END
    FROM rated
    WHERE li.id = rated.id
      AND (li."totalPriceAmountMicros" IS DISTINCT FROM round(rated.total)
        OR li."unitPriceCurrencyCode" IS DISTINCT FROM rated.currency
        OR li."totalInCompanyCurrencyAmountMicros" IS DISTINCT FROM round(rated.total * rated.rate))`;
};
