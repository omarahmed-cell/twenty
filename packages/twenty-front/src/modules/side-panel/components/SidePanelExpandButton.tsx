import { isNonEmptyString } from '@sniptt/guards';
import { isDefined } from 'twenty-shared/utils';
import { IconMaximize } from 'twenty-ui/icon';
import { IconButton } from 'twenty-ui/components/input';

import { useSidePanelExpandTarget } from '@/side-panel/hooks/useSidePanelExpandTarget';
import { SidePanelPageComponentInstanceContext } from '@/side-panel/states/contexts/SidePanelPageComponentInstanceContext';
import { useComponentInstanceStateContext } from '@/ui/utilities/state/component-state/hooks/useComponentInstanceStateContext';

const SidePanelExpandButtonContent = () => {
  const expandTarget = useSidePanelExpandTarget();

  if (!isDefined(expandTarget)) {
    return null;
  }

  const isDisabled = isDefined(expandTarget.disabledReason);
  const tooltipContent = expandTarget.disabledReason ?? expandTarget.label;

  return (
    <>
      <IconButton
        tooltip={tooltipContent}
        disabled={isDisabled}
        size="sm"
        variant="ghost"
        onClick={expandTarget.expand}
        aria-label={expandTarget.label}
      >
        <IconMaximize />
      </IconButton>
    </>
  );
};

export const SidePanelExpandButton = () => {
  const sidePanelPageInstanceId = useComponentInstanceStateContext(
    SidePanelPageComponentInstanceContext,
  )?.instanceId;

  // The context defaults to a blank instance id that expand targets reject, so check for that rather than presence
  if (!isNonEmptyString(sidePanelPageInstanceId)) {
    return null;
  }

  return <SidePanelExpandButtonContent />;
};
