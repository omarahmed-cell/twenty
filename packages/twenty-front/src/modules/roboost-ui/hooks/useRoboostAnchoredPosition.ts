import {
  type CSSProperties,
  type RefObject,
  useLayoutEffect,
  useState,
} from 'react';

const GAP = 4;
const VIEWPORT_MARGIN = 8;
const PANEL_MAX_HEIGHT = 320;
const MIN_HEIGHT_BELOW = 200;

const computeStyle = (rect: DOMRect, minWidth: number): CSSProperties => {
  const width = Math.min(
    Math.max(minWidth, rect.width),
    window.innerWidth - 2 * VIEWPORT_MARGIN,
  );
  const spaceBelow = window.innerHeight - rect.bottom - GAP - VIEWPORT_MARGIN;
  const spaceAbove = rect.top - GAP - VIEWPORT_MARGIN;
  const opensAbove =
    spaceBelow < Math.min(PANEL_MAX_HEIGHT, MIN_HEIGHT_BELOW) &&
    spaceAbove > spaceBelow;
  const left = Math.min(
    Math.max(VIEWPORT_MARGIN, rect.left),
    window.innerWidth - width - VIEWPORT_MARGIN,
  );

  return {
    ...(opensAbove
      ? { bottom: window.innerHeight - rect.top + GAP }
      : { top: rect.bottom + GAP }),
    left,
    width,
    maxHeight: Math.min(PANEL_MAX_HEIGHT, opensAbove ? spaceAbove : spaceBelow),
  };
};

// Below the anchor with left edges aligned and at least its width; above only when there is no room below.
// Re-measured every frame while open, so a panel never drifts over its field when the page moves.
export const useRoboostAnchoredPosition = ({
  anchorRef,
  isOpen,
  minWidth = 0,
}: {
  anchorRef: RefObject<HTMLElement | null>;
  isOpen: boolean;
  minWidth?: number;
}) => {
  const [style, setStyle] = useState<CSSProperties>({ visibility: 'hidden' });

  useLayoutEffect(() => {
    if (!isOpen) {
      return;
    }
    let frameId = 0;
    let lastKey = '';
    const measure = () => {
      const rect = anchorRef.current?.getBoundingClientRect();

      if (rect !== undefined) {
        const key = `${rect.left}|${rect.top}|${rect.bottom}|${rect.width}|${window.innerWidth}|${window.innerHeight}`;

        if (key !== lastKey) {
          lastKey = key;
          setStyle(computeStyle(rect, minWidth));
        }
      }
      frameId = requestAnimationFrame(measure);
    };

    measure();

    return () => cancelAnimationFrame(frameId);
  }, [anchorRef, isOpen, minWidth]);

  return style;
};
