import { BubbleMenuIconButton } from '@/advanced-text-editor/components/BubbleMenuIconButton';
import { BubbleMenuSeparator } from '@/advanced-text-editor/components/BubbleMenuSeparator';
import { AdvancedTextEditorInsertImageButton } from '@/advanced-text-editor/components/AdvancedTextEditorInsertImageButton';
import { EditLinkDropdown } from '@/advanced-text-editor/components/EditLinkDropdown';
import { useTextBubbleState } from '@/advanced-text-editor/hooks/useTextBubbleState';
import { type UploadedImage } from '@/advanced-text-editor/types/UploadedImage';
import { buildFixedToolbarLinkEditor } from '@/advanced-text-editor/utils/buildFixedToolbarLinkEditor';
import { getEditLinkDropdownId } from '@/advanced-text-editor/utils/getEditLinkDropdownId';
import { hasEditorExtension } from '@/advanced-text-editor/utils/hasEditorExtension';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { type Editor } from '@tiptap/core';
import { isDefined } from 'twenty-shared/utils';
import {
  IconBold,
  IconItalic,
  IconPaperclip,
  IconStrikethrough,
  IconUnderline,
} from 'twenty-ui/icon';
import { themeCssVariables } from 'twenty-ui/theme';

const StyledToolbar = styled.div`
  align-items: center;
  border-bottom: 1px solid ${themeCssVariables.border.color.light};
  display: flex;
  gap: ${themeCssVariables.spacing['0.5']};
  padding-bottom: ${themeCssVariables.spacing[1]};
`;

type AdvancedTextEditorFixedToolbarProps = {
  editor: Editor;
  onImageUpload?: (file: File) => Promise<UploadedImage>;
  onImageUploadError?: (error: Error, file: File) => void;
  onAttachFiles?: () => void;
};

export const AdvancedTextEditorFixedToolbar = ({
  editor,
  onImageUpload,
  onImageUploadError,
  onAttachFiles,
}: AdvancedTextEditorFixedToolbarProps) => {
  const { t } = useLingui();
  const state = useTextBubbleState(editor);

  const formatActions = [
    {
      Icon: IconBold,
      label: t`Bold`,
      extensionName: 'bold',
      onClick: () => editor.chain().focus().toggleBold().run(),
      isActive: state.isBold,
    },
    {
      Icon: IconItalic,
      label: t`Italic`,
      extensionName: 'italic',
      onClick: () => editor.chain().focus().toggleItalic().run(),
      isActive: state.isItalic,
    },
    {
      Icon: IconUnderline,
      label: t`Underline`,
      extensionName: 'underline',
      onClick: () => editor.chain().focus().toggleUnderline().run(),
      isActive: state.isUnderline,
    },
    {
      Icon: IconStrikethrough,
      label: t`Strikethrough`,
      extensionName: 'strike',
      onClick: () => editor.chain().focus().toggleStrike().run(),
      isActive: state.isStrike,
    },
  ].filter(({ extensionName }) => hasEditorExtension(editor, extensionName));

  return (
    <StyledToolbar>
      {formatActions.map(({ label, Icon, onClick, isActive }) => (
        <BubbleMenuIconButton
          key={label}
          label={label}
          Icon={Icon}
          onClick={onClick}
          isActive={isActive}
        />
      ))}
      <BubbleMenuSeparator />
      {hasEditorExtension(editor, 'link') && (
        <EditLinkDropdown
          dropdownId={getEditLinkDropdownId({
            editorInstanceId: editor.instanceId,
            bubbleMenuType: 'toolbar',
          })}
          defaultValue={state.linkHref}
          editor={buildFixedToolbarLinkEditor(editor)}
        />
      )}
      {isDefined(onImageUpload) && hasEditorExtension(editor, 'image') && (
        <AdvancedTextEditorInsertImageButton
          editor={editor}
          onImageUpload={onImageUpload}
          onImageUploadError={onImageUploadError}
        />
      )}
      {isDefined(onAttachFiles) && (
        <BubbleMenuIconButton
          label={t`Attach files`}
          Icon={IconPaperclip}
          onClick={onAttachFiles}
        />
      )}
    </StyledToolbar>
  );
};
