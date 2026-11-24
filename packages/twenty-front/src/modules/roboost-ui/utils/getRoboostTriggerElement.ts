import { isDefined } from 'twenty-shared/utils';

// Menus and popovers wrap their trigger in a block-level anchor div; panels attach to the trigger itself
export const getRoboostTriggerElement = (wrapper: HTMLElement | null) => {
  const trigger = wrapper?.firstElementChild;

  return isDefined(trigger) && trigger instanceof HTMLElement
    ? trigger
    : wrapper;
};
