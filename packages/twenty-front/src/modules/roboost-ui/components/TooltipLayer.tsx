import { FloatingPanel } from '@/roboost-ui/components/FloatingPanel';
import { ROBOOST_NO_PERMISSION_ATTRIBUTE } from '@/roboost-ui/utils/getRoboostNoPermissionAttributes';
import { useLingui } from '@lingui/react/macro';
import { isNonEmptyString } from '@sniptt/guards';
import { useEffect, useState } from 'react';

const NO_PERMISSION_SELECTOR = `[${ROBOOST_NO_PERMISSION_ATTRIBUTE}]`;
const TOOLTIP_SELECTOR = '[data-tip], [data-tooltip]';
const SHOW_DELAY_MS = 250;

type ShownTooltip = {
  anchor: HTMLElement;
  text: string | null;
  side: 'top' | 'right';
};

const findNoPermissionElement = (target: EventTarget | null) =>
  target instanceof Element
    ? target.closest<HTMLElement>(NO_PERMISSION_SELECTOR)
    : null;

// Nav labels only need a tooltip while the side panel is collapsed to icons
const findTooltipElement = (target: EventTarget | null) => {
  const element =
    target instanceof Element
      ? target.closest<HTMLElement>(TOOLTIP_SELECTOR)
      : null;

  if (element === null) {
    return null;
  }

  const isNavItem =
    element.classList.contains('rb-nav-item') ||
    element.classList.contains('rb-nav-toggle');

  return isNavItem && element.closest('.rb-nav-collapsed') === null
    ? null
    : element;
};

// Every Roboost tooltip renders here, in a body portal above tables, sticky headers and pop-ups;
// controls the user has no permission for also have their clicks swallowed here
export const TooltipLayer = () => {
  const { t } = useLingui();
  const [shown, setShown] = useState<ShownTooltip | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;

    const block = (event: Event) => {
      if (findNoPermissionElement(event.target) !== null) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    };
    const blockKeys = (event: KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        block(event);
      }
    };
    const showTooltip = (event: PointerEvent) => {
      clearTimeout(timer);

      const noPermissionElement = findNoPermissionElement(event.target);

      if (noPermissionElement !== null) {
        setShown({ anchor: noPermissionElement, text: null, side: 'top' });

        return;
      }

      const tooltipElement = findTooltipElement(event.target);

      if (tooltipElement === null) {
        setShown(null);

        return;
      }

      const text =
        tooltipElement.getAttribute('data-tip') ??
        tooltipElement.getAttribute('data-tooltip');

      if (!isNonEmptyString(text)) {
        setShown(null);

        return;
      }

      timer = setTimeout(
        () =>
          setShown({
            anchor: tooltipElement,
            text,
            side: tooltipElement.closest('.rb-nav') !== null ? 'right' : 'top',
          }),
        SHOW_DELAY_MS,
      );
    };
    const hideTooltip = () => {
      clearTimeout(timer);
      setShown(null);
    };

    document.addEventListener('click', block, true);
    document.addEventListener('mousedown', block, true);
    document.addEventListener('dragstart', block, true);
    document.addEventListener('keydown', blockKeys, true);
    document.addEventListener('pointerover', showTooltip, true);
    document.addEventListener('pointerdown', hideTooltip, true);
    document.documentElement.addEventListener('pointerleave', hideTooltip);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', block, true);
      document.removeEventListener('mousedown', block, true);
      document.removeEventListener('dragstart', block, true);
      document.removeEventListener('keydown', blockKeys, true);
      document.removeEventListener('pointerover', showTooltip, true);
      document.removeEventListener('pointerdown', hideTooltip, true);
      document.documentElement.removeEventListener('pointerleave', hideTooltip);
    };
  }, []);

  if (shown === null || !shown.anchor.isConnected) {
    return null;
  }

  return (
    <FloatingPanel
      anchor={shown.anchor}
      side={shown.side}
      maxHeight={null}
      className="rb-tooltip"
      role="tooltip"
    >
      {shown.text ?? t`You don't have permission to do this action`}
    </FloatingPanel>
  );
};
