import { type PageLayoutWidget } from '@/page-layout/types/PageLayoutWidget';
import {
  FieldDisplayMode,
  WidgetConfigurationType,
} from '~/generated-metadata/graphql';

// Relation cards of the pinned tab render in the associations panel
export const isAssociationWidget = (widget: PageLayoutWidget) =>
  widget.configuration.configurationType === WidgetConfigurationType.FIELD &&
  'fieldDisplayMode' in widget.configuration &&
  widget.configuration.fieldDisplayMode === FieldDisplayMode.CARD;
