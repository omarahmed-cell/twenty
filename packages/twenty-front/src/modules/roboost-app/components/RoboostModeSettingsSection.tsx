import { useIsRoboostUiEnabled } from '@/roboost-app/hooks/useIsRoboostUiEnabled';
import { useRoboostMode } from '@/roboost-app/hooks/useRoboostMode';
import { ModeSwitcher } from '@/roboost-ui/components/ModeSwitcher';
import { useLingui } from '@lingui/react/macro';
import { Section } from 'twenty-ui/components/layout';

export const RoboostModeSettingsSection = () => {
  const { t } = useLingui();
  const isRoboostUiEnabled = useIsRoboostUiEnabled();
  const { mode, changeMode } = useRoboostMode();

  if (!isRoboostUiEnabled) {
    return null;
  }

  return (
    <Section.Root>
      <Section.Header
        title={t`Mode`}
        description={t`Choose the colours of the frame and accent. Saved for your account on every device.`}
      />
      <ModeSwitcher value={mode} onChange={changeMode} />
    </Section.Root>
  );
};
