import { type CSSProperties, type RefObject, useState } from 'react';
import { isDefined } from 'twenty-shared/utils';

const GAP = 4;
const VIEWPORT_MARGIN = 8;
const MAX_HEIGHT = 360;
const MIN_HEIGHT_BELOW = 160;
const ESTIMATED_MIN_WIDTH = 240;

type PopoverPlacement = 'below' | 'above';

// Opens under its control, left edges aligned; above only when there is no room below
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
        ? spaceAbove >= MIN_HEIGHT_BELOW || spaceAbove > spaceBelow
        : spaceBelow < MIN_HEIGHT_BELOW && spaceAbove > spaceBelow;
    const width = Math.max(
      ESTIMATED_MIN_WIDTH,
      matchAnchorWidth ? rect.width : 0,
    );
    const overflowsRight =
      rect.left + width > window.innerWidth - VIEWPORT_MARGIN;

    setPosition({
      ...(opensAbove
        ? { bottom: window.innerHeight - rect.top + GAP }
        : { top: rect.bottom + GAP }),
      ...(align === 'right' || overflowsRight
        ? { right: Math.max(VIEWPORT_MARGIN, window.innerWidth - rect.right) }
        : { left: Math.max(VIEWPORT_MARGIN, rect.left) }),
      maxHeight: Math.min(MAX_HEIGHT, opensAbove ? spaceAbove : spaceBelow),
      ...(matchAnchorWidth ? { minWidth: rect.width } : {}),
    });
  };

  return { position, updatePosition };
};
