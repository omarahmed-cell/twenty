import { type IconComponent } from 'twenty-ui/icon';

export type DatePickerFooterAction = {
  label: string;
  Icon: IconComponent;
  onClick: () => void;
};
