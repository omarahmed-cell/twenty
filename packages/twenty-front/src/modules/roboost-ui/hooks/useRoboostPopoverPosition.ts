import { type CSSProperties, type RefObject, useState } from 'react';
import { isDefined } from 'twenty-shared/utils';

const GAP = 4;
const VIEWPORT_MARGIN = 8;
const MAX_HEIGHT = 360;
const MIN_COMFORTABLE_HEIGHT = 220;

type PopoverPlacement = 'below' | 'above';

// Opens under its control, or above when there is more room there, and never covers the control
export const useRoboostPopoverPosition = ({
  anchorRef,
  align = 'left',
  placement = 'below',
  matchAnchorWidth = false,
}: {
  anchorRef: RefObject<HTMLElement | null>;
  align?: 'left' | 'right';
  placement?: PopoverPlacement;
  matchAnchorWidth?: boolean;
}) => {
  const [position, setPosition] = useState<CSSProperties>({});

  const updatePosition = () => {
    const rect = anchorRef.current?.getBoundingClientRect();

    if (!isDefined(rect)) {
      return;
    }

    const spaceBelow = window.innerHeight - rect.bottom - GAP - VIEWPORT_MARGIN;
    const spaceAbove = rect.top - GAP - VIEWPORT_MARGIN;
    const opensAbove =
      placement === 'above'
        ? spaceAbove >= MIN_COMFORTABLE_HEIGHT || spaceAbove > spaceBelow
        : spaceBelow < MIN_COMFORTABLE_HEIGHT && spaceAbove > spaceBelow;

    setPosition({
      ...(opensAbove
        ? { bottom: window.innerHeight - rect.top + GAP }
        : { top: rect.bottom + GAP }),
      ...(align === 'right'
        ? { right: Math.max(VIEWPORT_MARGIN, window.innerWidth - rect.right) }
        : {
            left: Math.max(
              VIEWPORT_MARGIN,
              Math.min(rect.left, window.innerWidth - 240 - VIEWPORT_MARGIN),
            ),
          }),
      maxHeight: Math.min(MAX_HEIGHT, opensAbove ? spaceAbove : spaceBelow),
      ...(matchAnchorWidth ? { minWidth: rect.width } : {}),
    });
  };

  return { position, updatePosition };
};
