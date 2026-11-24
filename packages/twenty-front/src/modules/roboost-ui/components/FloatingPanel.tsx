import { getRoboostZoom } from '@/roboost-ui/utils/getRoboostZoom';
import { cx } from '@/roboost-ui/utils/cx';
import {
  arrow,
  autoUpdate,
  flip,
  hide,
  offset,
  shift,
  size,
  useFloating,
} from '@floating-ui/react';
import {
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
  type RefObject,
  useEffect,
  useRef,
} from 'react';
import { createPortal } from 'react-dom';
import { isDefined } from 'twenty-shared/utils';

const GAP = 6;
const VIEWPORT_PADDING = 8;
const ARROW_CORNER_PADDING = 16;
const MIN_USABLE_HEIGHT = 120;
export const FLOATING_PANEL_DEFAULT_MAX_HEIGHT = 320;

export type FloatingPanelProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  'children'
> & {
  // The exact visible trigger: the field's value box, the cell, the chip or the button
  anchor: HTMLElement | null;
  children: ReactNode;
  panelRef?: RefObject<HTMLDivElement | null>;
  align?: 'start' | 'end';
  // Below by default; the other side is used only when the preferred one has no room
  side?: 'bottom' | 'top';
  // Design pixels, like the rest of the stylesheet
  minWidth?: number;
  matchAnchorWidth?: boolean;
  maxHeight?: number | null;
  // Called once the trigger scrolls out of view
  onAnchorHidden?: () => void;
};

// The one positioning primitive for every Roboost list and panel. floating-ui measures in
// visual pixels, while html carries the interface-scale zoom; data-floating-ui-viewport
// (viewport-zoom.css) undoes that zoom on this layer and its child restores it, so measured
// and applied coordinates agree at every scale.
export const FloatingPanel = ({
  anchor,
  children,
  panelRef,
  align = 'start',
  side: preferredSide = 'bottom',
  minWidth = 0,
  matchAnchorWidth = false,
  maxHeight = FLOATING_PANEL_DEFAULT_MAX_HEIGHT,
  onAnchorHidden,
  className,
  style,
  ...panelProps
}: FloatingPanelProps) => {
  const arrowRef = useRef<HTMLDivElement>(null);
  const { refs, floatingStyles, placement, middlewareData, isPositioned } =
    useFloating({
      strategy: 'fixed',
      placement: `${preferredSide}-${align}`,
      transform: false,
      elements: { reference: anchor },
      whileElementsMounted: autoUpdate,
      middleware: [
        offset(GAP),
        flip({
          fallbackPlacements: [
            `${preferredSide === 'bottom' ? 'top' : 'bottom'}-${align}`,
          ],
          padding: VIEWPORT_PADDING,
        }),
        shift({ padding: VIEWPORT_PADDING }),
        size({
          padding: VIEWPORT_PADDING,
          apply: ({ rects, availableHeight, availableWidth, elements }) => {
            const zoom = getRoboostZoom();
            const minimumWidth = Math.min(minWidth * zoom, availableWidth);
            const floatingStyle = elements.floating.style;

            floatingStyle.minWidth = `${minimumWidth}px`;
            floatingStyle.maxWidth = `${Math.max(availableWidth, minimumWidth)}px`;
            floatingStyle.width = matchAnchorWidth
              ? `${Math.max(rects.reference.width, minimumWidth)}px`
              : '';
            floatingStyle.setProperty(
              '--rb-floating-max-height',
              maxHeight === null
                ? `${Math.max(availableHeight, MIN_USABLE_HEIGHT)}px`
                : `${Math.max(Math.min(maxHeight * zoom, availableHeight), MIN_USABLE_HEIGHT)}px`,
            );
          },
        }),
        arrow({ element: arrowRef, padding: ARROW_CORNER_PADDING }),
        hide(),
      ],
    });
  const isAnchorHidden = middlewareData.hide?.referenceHidden === true;
  const side = placement.startsWith('top') ? 'top' : 'bottom';
  const arrowX = middlewareData.arrow?.x;

  useEffect(() => {
    if (isAnchorHidden) {
      onAnchorHidden?.();
    }
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [isAnchorHidden]);

  const arrowStyle: CSSProperties = {
    left: isDefined(arrowX) ? `${arrowX}px` : undefined,
    zoom: 1,
  };

  return createPortal(
    <div
      ref={refs.setFloating}
      data-floating-ui-viewport
      data-side={side}
      className="rb-floating"
      style={{
        ...floatingStyles,
        visibility: isPositioned && !isAnchorHidden ? 'visible' : 'hidden',
      }}
    >
      <div
        ref={panelRef}
        className={cx('rb-ui rb-floating-panel', className)}
        style={style}
        {...panelProps}
      >
        {children}
      </div>
      <div ref={arrowRef} className="rb-floating-arrow" style={arrowStyle} />
    </div>,
    document.body,
  );
};
