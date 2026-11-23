import { type RefObject, useEffect } from 'react';

const DROPDOWN_SELECTOR = '.rb-menu-portal, .rb-popover-panel';

// A fixed popover follows its control when the page scrolls; scrolling inside any open dropdown is ignored
export const useRoboostCloseOnOutsideScroll = ({
  isOpen,
  popoverRef,
  onClose,
  onReposition,
}: {
  isOpen: boolean;
  popoverRef: RefObject<HTMLElement | null>;
  onClose: () => void;
  onReposition?: () => void;
}) => {
  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const handleScroll = (event: Event) => {
      const target = event.target;

      if (
        target instanceof Node &&
        popoverRef.current?.contains(target) === true
      ) {
        return;
      }
      if (target instanceof Element && target.closest(DROPDOWN_SELECTOR)) {
        return;
      }
      if (onReposition !== undefined) {
        onReposition();
        return;
      }
      onClose();
    };
    const handleResize = () =>
      onReposition !== undefined ? onReposition() : onClose();

    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
    };
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);
};
