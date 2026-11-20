import { type PageLayoutWidget } from '@/page-layout/types/PageLayoutWidget';
import { type PageLayoutWidgetPlacement } from '@/page-layout/types/PageLayoutWidgetPlacement';
import { isAssociationWidget } from '@/page-layout/utils/isAssociationWidget';

export const filterWidgetsByPlacement = (
  widgets: PageLayoutWidget[],
  placement: PageLayoutWidgetPlacement,
) => {
  switch (placement) {
    case 'record-panel':
      return widgets.filter((widget) => !isAssociationWidget(widget));
    case 'associations-panel':
      return widgets.filter(isAssociationWidget);
    default:
      return widgets;
  }
};
