import { BubbleMenuIconButton } from '@/advanced-text-editor/components/BubbleMenuIconButton';
import { type UploadedImage } from '@/advanced-text-editor/types/UploadedImage';
import { insertUploadingImage } from '@/advanced-text-editor/utils/insertUploadingImage';
import { useFileUpload } from '@/file-upload/hooks/useFileUpload';
import { useLingui } from '@lingui/react/macro';
import { type Editor } from '@tiptap/core';
import { EMAIL_IMAGE_MIME_TYPES } from 'twenty-shared/constants';
import { IconPhoto } from 'twenty-ui/icon';

type AdvancedTextEditorInsertImageButtonProps = {
  editor: Editor;
  onImageUpload: (file: File) => Promise<UploadedImage>;
  onImageUploadError?: (error: Error, file: File) => void;
};

export const AdvancedTextEditorInsertImageButton = ({
  editor,
  onImageUpload,
  onImageUploadError,
}: AdvancedTextEditorInsertImageButtonProps) => {
  const { t } = useLingui();
  const { openFileUpload } = useFileUpload();

  const handleClick = () => {
    openFileUpload({
      multiple: true,
      accept: EMAIL_IMAGE_MIME_TYPES.join(','),
      onUpload: (files) => {
        files.forEach((file) =>
          insertUploadingImage({
            editor,
            file,
            onImageUpload,
            onImageUploadError,
          }),
        );
      },
    });
  };

  return (
    <BubbleMenuIconButton
      label={t`Insert image`}
      Icon={IconPhoto}
      onClick={handleClick}
    />
  );
};
