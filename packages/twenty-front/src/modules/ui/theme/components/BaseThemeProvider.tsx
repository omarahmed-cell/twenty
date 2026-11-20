import { type JSX, createContext } from 'react';

import { UI_SCALE_MULTIPLIERS } from '@/ui/theme/constants/UiScaleMultipliers';
import { persistedColorSchemeState } from '@/ui/theme/states/persistedColorSchemeState';
import { persistedUiScaleStepState } from '@/ui/theme/states/persistedUiScaleStepState';
import { useAtomState } from '@/ui/utilities/state/jotai/hooks/useAtomState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { ThemeProvider } from 'twenty-ui/theme';
import { type ColorScheme } from '@/ui/theme/types/ColorScheme';

type BaseThemeProviderProps = {
  children: JSX.Element | JSX.Element[];
};

export const ThemeSchemeContext = createContext<(theme: ColorScheme) => void>(
  () => {},
);

export const BaseThemeProvider = ({ children }: BaseThemeProviderProps) => {
  const [, setPersistedColorScheme] = useAtomState(persistedColorSchemeState);
  const persistedUiScaleStep = useAtomStateValue(persistedUiScaleStepState);

  return (
    <ThemeSchemeContext.Provider value={setPersistedColorScheme}>
      <ThemeProvider
        // The Roboost design is light-only for now; a member's saved Dark or System choice is ignored
        colorScheme="light"
        scale={UI_SCALE_MULTIPLIERS[persistedUiScaleStep]}
      >
        {children}
      </ThemeProvider>
    </ThemeSchemeContext.Provider>
  );
};
