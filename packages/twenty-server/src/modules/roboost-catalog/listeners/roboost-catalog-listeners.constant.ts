import { RoboostLineItemTotalsListener } from 'src/modules/roboost-catalog/listeners/roboost-line-item-totals.listener';
import { RoboostProductMarginListener } from 'src/modules/roboost-catalog/listeners/roboost-product-margin.listener';

export const ROBOOST_CATALOG_LISTENERS = [
  RoboostProductMarginListener,
  RoboostLineItemTotalsListener,
];
