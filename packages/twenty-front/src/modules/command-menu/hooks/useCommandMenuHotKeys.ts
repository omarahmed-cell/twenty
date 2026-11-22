import { useKeyboardShortcutMenu } from '@/keyboard-shortcut-menu/hooks/useKeyboardShortcutMenu';
import { useIsRoboostUiEnabled } from '@/roboost-app/hooks/useIsRoboostUiEnabled';
import { roboostSearchOpenState } from '@/roboost-app/search/states/roboostSearchOpenState';
import { useSetAtomState } from '@/ui/utilities/state/jotai/hooks/useSetAtomState';
import { SIDE_PANEL_FOCUS_ID } from '@/side-panel/constants/SidePanelFocusId';
import { useHandleSidePanelEscape } from '@/side-panel/hooks/useHandleSidePanelEscape';
import { useOpenAskAiPageInSidePanel } from '@/side-panel/hooks/useOpenAskAiPageInSidePanel';
import { useOpenRecordsSearchPageInSidePanel } from '@/side-panel/hooks/useOpenRecordsSearchPageInSidePanel';
import { useSidePanelMenu } from '@/side-panel/hooks/useSidePanelMenu';
import { useGlobalHotkeys } from '@/ui/utilities/hotkey/hooks/useGlobalHotkeys';
import { useHotkeysOnFocusedElement } from '@/ui/utilities/hotkey/hooks/useHotkeysOnFocusedElement';
import { Key } from 'ts-key-enum';

export const useCommandMenuHotKeys = () => {
  const { toggleSidePanelMenu } = useSidePanelMenu();

  const { openRecordsSearchPage } = useOpenRecordsSearchPageInSidePanel();

  const { openAskAiPage } = useOpenAskAiPageInSidePanel();

  const handleSidePanelEscape = useHandleSidePanelEscape();

  const { closeKeyboardShortcutMenu } = useKeyboardShortcutMenu();

  const isRoboostUiEnabled = useIsRoboostUiEnabled();
  const setRoboostSearchOpen = useSetAtomState(roboostSearchOpenState);

  useGlobalHotkeys({
    keys: ['ctrl+k', 'meta+k'],
    callback: () => {
      closeKeyboardShortcutMenu();
      if (isRoboostUiEnabled) {
        setRoboostSearchOpen(true);
        return;
      }
      toggleSidePanelMenu();
    },
    containsModifier: true,
    dependencies: [
      closeKeyboardShortcutMenu,
      toggleSidePanelMenu,
      isRoboostUiEnabled,
      setRoboostSearchOpen,
    ],
  });

  useGlobalHotkeys({
    keys: ['/'],
    callback: () => {
      if (isRoboostUiEnabled) {
        setRoboostSearchOpen(true);
        return;
      }
      openRecordsSearchPage();
    },
    containsModifier: false,
    dependencies: [
      openRecordsSearchPage,
      isRoboostUiEnabled,
      setRoboostSearchOpen,
    ],
    options: {
      ignoreModifiers: true,
    },
  });

  useGlobalHotkeys({
    keys: ['@'],
    callback: () => {
      if (isRoboostUiEnabled) {
        return;
      }
      openAskAiPage({ resetNavigationStack: true });
    },
    containsModifier: false,
    dependencies: [openAskAiPage, isRoboostUiEnabled],
    options: {
      ignoreModifiers: true,
    },
  });

  useHotkeysOnFocusedElement({
    keys: [Key.Escape],
    callback: () => {
      handleSidePanelEscape();
    },
    focusId: SIDE_PANEL_FOCUS_ID,
    dependencies: [handleSidePanelEscape],
    options: {
      enableOnFormTags: false,
    },
  });
};
