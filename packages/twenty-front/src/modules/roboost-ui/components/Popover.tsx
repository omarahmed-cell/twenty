import { useRoboostCloseOnOutsideScroll } from '@/roboost-ui/hooks/useRoboostCloseOnOutsideScroll';
import { useRoboostPopoverPosition } from '@/roboost-ui/hooks/useRoboostPopoverPosition';
import { cx } from '@/roboost-ui/utils/cx';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export type PopoverProps = {
  trigger: (props: { isOpen: boolean; toggle: () => void }) => ReactNode;
  children: (props: { close: () => void }) => ReactNode;
  align?: 'left' | 'right';
  className?: string;
  ariaLabel?: string;
};

// A body-portalled panel anchored under its control; closes on outside click, Escape or outside scroll
export const Popover = ({
  trigger,
  children,
  align = 'left',
  className,
  ariaLabel,
}: PopoverProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const { position, updatePosition } = useRoboostPopoverPosition({
    anchorRef,
    align,
  });
  const close = () => setIsOpen(false);

  useRoboostCloseOnOutsideScroll({
    isOpen,
    popoverRef: panelRef,
    onReposition: updatePosition,
    onClose: close,
  });

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const closeOnOutsidePointer = (event: PointerEvent) => {
      const target = event.target;

      if (
        target instanceof Node &&
        (panelRef.current?.contains(target) === true ||
          anchorRef.current?.contains(target) === true ||
          (target instanceof Element && target.closest('.rb-menu-portal')))
      ) {
        return;
      }
      setIsOpen(false);
    };

    document.addEventListener('pointerdown', closeOnOutsidePointer);

    return () =>
      document.removeEventListener('pointerdown', closeOnOutsidePointer);
  }, [isOpen]);

  return (
    <div
      ref={anchorRef}
      className="rb-menu-anchor"
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          close();
        }
      }}
    >
      {trigger({
        isOpen,
        toggle: () => {
          if (isOpen) {
            close();
            return;
          }
          updatePosition();
          setIsOpen(true);
        },
      })}
      {isOpen &&
        createPortal(
          <div
            ref={panelRef}
            className={cx('rb-ui rb-popover-panel', className)}
            style={{ ...position, maxHeight: undefined }}
            role="dialog"
            aria-label={ariaLabel}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                close();
              }
            }}
          >
            {children({ close })}
          </div>,
          document.body,
        )}
    </div>
  );
};
