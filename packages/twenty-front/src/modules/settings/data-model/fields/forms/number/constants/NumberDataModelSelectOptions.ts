import { type FieldNumberVariant } from '@/object-record/record-field/ui/types/FieldMetadata';
import { type MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import {
  IconClock,
  IconNumbers,
  IconLetterK,
  IconNumber9,
  IconPercentage,
  type IconComponent,
} from 'twenty-ui/icon';

type NumberDataModelSelectOptions = {
  Icon: IconComponent;
  label: MessageDescriptor;
  value: FieldNumberVariant;
};
export const NUMBER_DATA_MODEL_SELECT_OPTIONS = [
  {
    Icon: IconNumber9,
    label: msg`Number`,
    value: 'number',
  },
  {
    Icon: IconLetterK,
    label: msg`Short`,
    value: 'shortNumber',
  },
  {
    Icon: IconPercentage,
    label: msg`Percentage`,
    value: 'percentage',
  },
  {
    Icon: IconNumbers,
    label: msg`Unformatted`,
    value: 'unformatted',
  },
  {
    Icon: IconClock,
    label: msg`Duration`,
    value: 'duration',
  },
] as const satisfies Array<NumberDataModelSelectOptions>;
