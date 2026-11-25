import { FloatingPanel } from '@/roboost-ui/components/FloatingPanel';
import { ROBOOST_NO_PERMISSION_ATTRIBUTE } from '@/roboost-ui/utils/getRoboostNoPermissionAttributes';
import { useLingui } from '@lingui/react/macro';
import { useEffect, useState } from 'react';

const SELECTOR = `[${ROBOOST_NO_PERMISSION_ATTRIBUTE}]`;

const findNoPermissionElement = (target: EventTarget | null) =>
  target instanceof Element ? target.closest<HTMLElement>(SELECTOR) : null;

// Controls the user has no permission for stay visible; one document-level layer makes them inert
export const NoPermissionLayer = () => {
  const { t } = useLingui();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  useEffect(() => {
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
      setAnchor(findNoPermissionElement(event.target));
    };

    document.addEventListener('click', block, true);
    document.addEventListener('mousedown', block, true);
    document.addEventListener('dragstart', block, true);
    document.addEventListener('keydown', blockKeys, true);
    document.addEventListener('pointerover', showTooltip, true);

    return () => {
      document.removeEventListener('click', block, true);
      document.removeEventListener('mousedown', block, true);
      document.removeEventListener('dragstart', block, true);
      document.removeEventListener('keydown', blockKeys, true);
      document.removeEventListener('pointerover', showTooltip, true);
    };
  }, []);

  if (anchor === null || !anchor.isConnected) {
    return null;
  }

  return (
    <FloatingPanel
      anchor={anchor}
      side="top"
      maxHeight={null}
      className="rb-noperm-tip"
      role="tooltip"
    >
      {t`You don't have permission to do this action`}
    </FloatingPanel>
  );
};
