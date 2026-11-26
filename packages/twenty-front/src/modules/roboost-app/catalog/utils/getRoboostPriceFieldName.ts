// "SAR" -> "priceSar": the product price field the currency list keeps for each currency
export const getRoboostPriceFieldName = (code: string) =>
  `price${code.charAt(0)}${code.slice(1).toLowerCase()}`;
