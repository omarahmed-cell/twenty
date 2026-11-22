import { type RefObject, useEffect } from 'react';

// A fixed popover would drift away from its control, so it closes when anything outside it scrolls
export const useRoboostCloseOnOutsideScroll = ({
  isOpen,
  popoverRef,
  onClose,
}: {
  isOpen: boolean;
  popoverRef: RefObject<HTMLElement | null>;
  onClose: () => void;
}) => {
  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const close = (event: Event) => {
      if (
        event.target instanceof Node &&
        popoverRef.current?.contains(event.target) === true
      ) {
        return;
      }
      onClose();
    };

    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);

    return () => {
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);
};
