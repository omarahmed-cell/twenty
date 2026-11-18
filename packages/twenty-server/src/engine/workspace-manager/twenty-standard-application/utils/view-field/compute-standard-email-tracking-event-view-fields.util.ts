import { type FlatViewField } from 'src/engine/metadata-modules/flat-view-field/types/flat-view-field.type';
import {
  createStandardViewFieldFlatMetadata,
  type CreateStandardViewFieldArgs,
} from 'src/engine/workspace-manager/twenty-standard-application/utils/view-field/create-standard-view-field-flat-metadata.util';

export const computeStandardEmailTrackingEventViewFields = (
  args: Omit<CreateStandardViewFieldArgs<'emailTrackingEvent'>, 'context'>,
): Record<string, FlatViewField> => {
  return {
    allEmailTrackingEventsOccurredAt: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'emailTrackingEvent',
      context: {
        viewName: 'allEmailTrackingEvents',
        viewFieldName: 'occurredAt',
        fieldName: 'occurredAt',
        position: 0,
        isVisible: true,
        size: 150,
      },
    }),
    allEmailTrackingEventsEmail: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'emailTrackingEvent',
      context: {
        viewName: 'allEmailTrackingEvents',
        viewFieldName: 'email',
        fieldName: 'email',
        position: 1,
        isVisible: true,
        size: 150,
      },
    }),
    allEmailTrackingEventsType: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'emailTrackingEvent',
      context: {
        viewName: 'allEmailTrackingEvents',
        viewFieldName: 'type',
        fieldName: 'type',
        position: 2,
        isVisible: true,
        size: 150,
      },
    }),
    allEmailTrackingEventsUrl: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'emailTrackingEvent',
      context: {
        viewName: 'allEmailTrackingEvents',
        viewFieldName: 'url',
        fieldName: 'url',
        position: 3,
        isVisible: true,
        size: 150,
      },
    }),
    allEmailTrackingEventsIsCounted: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'emailTrackingEvent',
      context: {
        viewName: 'allEmailTrackingEvents',
        viewFieldName: 'isCounted',
        fieldName: 'isCounted',
        position: 4,
        isVisible: true,
        size: 150,
      },
    }),
  };
};
