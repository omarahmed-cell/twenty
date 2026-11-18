import { FilesCardContent } from '@/activities/files/components/FilesCardContent';
import { useAttachments } from '@/activities/files/hooks/useAttachments';
import { useCanUploadAttachmentFiles } from '@/activities/files/hooks/useCanUploadAttachmentFiles';
import { useLinkedActivityAttachments } from '@/activities/files/hooks/useLinkedActivityAttachments';
import { useUploadAttachmentFiles } from '@/activities/files/hooks/useUploadAttachmentFiles';
import { WidgetHeaderCountEffect } from '@/page-layout/widgets/components/WidgetHeaderCountEffect';
import { useTargetRecord } from '@/ui/layout/contexts/useTargetRecord';

export const FilesCard = () => {
  const targetRecord = useTargetRecord();
  const { attachments, loading, totalCountAttachments } =
    useAttachments(targetRecord);
  const {
    linkedAttachments,
    sourceLabelByAttachmentId,
    loadingLinkedAttachments,
  } = useLinkedActivityAttachments(targetRecord);
  const { uploadAttachmentFiles } = useUploadAttachmentFiles();
  const { canUploadFiles } = useCanUploadAttachmentFiles(targetRecord);

  const directAttachmentIds = new Set(
    attachments.map((attachment) => attachment.id),
  );
  const linkedOnlyAttachments = linkedAttachments.filter(
    (attachment) => !directAttachmentIds.has(attachment.id),
  );
  const linkedSourceLabelByAttachmentId = Object.fromEntries(
    linkedOnlyAttachments
      .filter((attachment) => attachment.id in sourceLabelByAttachmentId)
      .map((attachment) => [
        attachment.id,
        sourceLabelByAttachmentId[attachment.id],
      ]),
  );
  const allAttachments = [...attachments, ...linkedOnlyAttachments].sort(
    (first, second) => second.createdAt.localeCompare(first.createdAt),
  );

  const handleUploadFiles = (files: File[]) =>
    uploadAttachmentFiles({ files, targetableObject: targetRecord });

  return (
    <>
      <WidgetHeaderCountEffect
        count={
          (totalCountAttachments ?? attachments.length) +
          linkedOnlyAttachments.length
        }
      />
      <FilesCardContent
        attachments={allAttachments}
        sourceLabelByAttachmentId={linkedSourceLabelByAttachmentId}
        canUploadFiles={canUploadFiles}
        loading={loading || loadingLinkedAttachments}
        onUploadFiles={handleUploadFiles}
        targetRecord={targetRecord}
      />
    </>
  );
};
