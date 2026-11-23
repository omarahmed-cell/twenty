import { roboostOpenCellEditorState } from '@/roboost-app/list/states/roboostOpenCellEditorState';
import { useAtomState } from '@/ui/utilities/state/jotai/hooks/useAtomState';

const ATTENTION_DURATION_MS = 1200;

// One editor open at a time across tables and record pages; an editor with unsaved changes blocks the next one
export const useRoboostCellEditor = (editorKey: string) => {
  const [roboostOpenCellEditor, setRoboostOpenCellEditor] = useAtomState(
    roboostOpenCellEditorState,
  );
  const isEditing = roboostOpenCellEditor?.key === editorKey;

  const open = () => {
    if (
      roboostOpenCellEditor !== null &&
      roboostOpenCellEditor.key !== editorKey &&
      roboostOpenCellEditor.isDirty
    ) {
      const attentionAt = Date.now();

      setRoboostOpenCellEditor({ ...roboostOpenCellEditor, attentionAt });
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
    isEditing,
    needsAttention:
      isEditing && roboostOpenCellEditor?.attentionAt !== undefined,
    open,
    close,
    closeIfUntouched,
    setIsDirty,
  };
};
