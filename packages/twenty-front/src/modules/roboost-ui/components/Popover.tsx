import { FloatingPanel } from '@/roboost-ui/components/FloatingPanel';
import { cx } from '@/roboost-ui/utils/cx';
import { getRoboostTriggerElement } from '@/roboost-ui/utils/getRoboostTriggerElement';
import { type ReactNode, useEffect, useRef, useState } from 'react';

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
  const close = () => setIsOpen(false);

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
          (target instanceof Element && target.closest('.rb-floating')))
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
          setIsOpen(true);
        },
      })}
      {isOpen && (
        <FloatingPanel
          anchor={getRoboostTriggerElement(anchorRef.current)}
          panelRef={panelRef}
          align={align === 'right' ? 'end' : 'start'}
          maxHeight={null}
          onAnchorHidden={close}
          className={cx('rb-popover-panel', className)}
          role="dialog"
          aria-label={ariaLabel}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              close();
            }
          }}
        >
          {children({ close })}
        </FloatingPanel>
      )}
    </div>
  );
};
