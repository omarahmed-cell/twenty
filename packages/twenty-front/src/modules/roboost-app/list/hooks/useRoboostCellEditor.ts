import { roboostOpenCellEditorState } from '@/roboost-app/list/states/roboostOpenCellEditorState';
import { useRoutedFlowStateScopeId } from '@/ui/utilities/state/contexts/RoutedFlowStateScopeContext';
import { useAtomValue, useSetAtom, useStore } from 'jotai';
import { selectAtom } from 'jotai/utils';
import { useMemo } from 'react';

const ATTENTION_DURATION_MS = 1200;

type RoboostCellEditorStatus = 'closed' | 'open' | 'attention';

// One editor open at a time across tables and record pages; an editor with unsaved changes blocks the next one.
// Each cell reads only its own status, so opening one editor re-renders that cell and the one it replaces.
export const useRoboostCellEditor = (editorKey: string) => {
  const scopeId = useRoutedFlowStateScopeId();
  const editorAtom = roboostOpenCellEditorState.getAtom(scopeId);
  const store = useStore();
  const setRoboostOpenCellEditor = useSetAtom(editorAtom);
  const statusAtom = useMemo(
    () =>
      selectAtom(editorAtom, (openEditor): RoboostCellEditorStatus =>
        openEditor?.key !== editorKey
          ? 'closed'
          : openEditor.attentionAt !== undefined
            ? 'attention'
            : 'open',
      ),
    [editorAtom, editorKey],
  );
  const status = useAtomValue(statusAtom);

  const open = () => {
    const openEditor = store.get(editorAtom);

    if (
      openEditor !== null &&
      openEditor.key !== editorKey &&
      openEditor.isDirty
    ) {
      const attentionAt = Date.now();

      setRoboostOpenCellEditor({ ...openEditor, attentionAt });
      window.setTimeout(
        () =>
          setRoboostOpenCellEditor((current) =>
            current?.attentionAt === attentionAt
              ? { ...current, attentionAt: undefined }
              : current,
          ),
        ATTENTION_DURATION_MS,
      );

      return false;
    }
    setRoboostOpenCellEditor({ key: editorKey, isDirty: false });

    return true;
  };

  const close = () =>
    setRoboostOpenCellEditor((current) =>
      current?.key === editorKey ? null : current,
    );

  const closeIfUntouched = () =>
    setRoboostOpenCellEditor((current) =>
      current?.key === editorKey && !current.isDirty ? null : current,
    );

  const setIsDirty = (isDirty: boolean) =>
    setRoboostOpenCellEditor((current) =>
      current?.key === editorKey && current.isDirty !== isDirty
        ? { ...current, isDirty }
        : current,
    );

  return {
    isEditing: status !== 'closed',
    needsAttention: status === 'attention',
    open,
    close,
    closeIfUntouched,
    setIsDirty,
  };
};
