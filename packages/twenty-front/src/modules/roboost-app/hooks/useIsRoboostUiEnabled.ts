import { useIsFeatureEnabled } from '@/workspace/hooks/useIsFeatureEnabled';
import { FeatureFlagKey } from '~/generated-metadata/graphql';

export const useIsRoboostUiEnabled = () =>
  useIsFeatureEnabled(FeatureFlagKey.IS_ROBOOST_UI_ENABLED);
