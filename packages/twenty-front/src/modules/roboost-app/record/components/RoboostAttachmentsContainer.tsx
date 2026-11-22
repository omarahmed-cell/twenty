import { useUploadAttachmentFile } from '@/activities/files/hooks/useUploadAttachmentFile';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { RoboostRecordContainer } from '@/roboost-app/record/components/RoboostRecordContainer';
import { formatRoboostDate } from '@/roboost-app/utils/formatRoboostDate';
import { Button } from '@/roboost-ui/components/Button';
import { Icon } from '@/roboost-ui/components/Icon';
import { Input } from '@/roboost-ui/components/Input';
import { type MenuEntry } from '@/roboost-ui/components/Menu';
import { useLingui } from '@lingui/react/macro';
import { isNonEmptyString } from '@sniptt/guards';
import { useRef, useState } from 'react';
import { CoreObjectNameSingular } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

type AttachmentRecord = {
  id: string;
  name: string | null;
  createdAt: string;
  createdBy?: { name?: string | null } | null;
  file?: { url?: string | null; extension?: string | null }[] | null;
  __typename: string;
};

type RoboostAttachmentsContainerProps = {
  title: string;
  joinColumnName: string;
  recordId: string;
  objectNameSingular: string;
  settingsEntries: MenuEntry[];
  isDropTarget: boolean;
  onDragStart: (id: string) => void;
  onDragOver: (id: string) => void;
  onDrop: (id: string) => void;
  onDragEnd: () => void;
};

export const RoboostAttachmentsContainer = ({
  title,
  joinColumnName,
  recordId,
  objectNameSingular,
  settingsEntries,
  isDropTarget,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: RoboostAttachmentsContainerProps) => {
  const { t } = useLingui();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadAttachmentFile } = useUploadAttachmentFile();
  const [search, setSearch] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { records, totalCount, refetch } = useFindManyRecords<AttachmentRecord>(
    {
      objectNameSingular: CoreObjectNameSingular.Attachment,
      filter: { [joinColumnName]: { eq: recordId } },
      recordGqlFields: {
        id: true,
        name: true,
        createdAt: true,
        createdBy: true,
        file: true,
      },
      orderBy: [{ createdAt: 'DescNullsLast' }],
      limit: 100,
    },
  );

  const uploadFiles = async (files: FileList | null) => {
    if (!isDefined(files) || files.length === 0) {
      return;
    }
    setIsUploading(true);
    setError(null);
    try {
      for (const file of Array.from(files)) {
        await uploadAttachmentFile(file, {
          id: recordId,
          targetObjectNameSingular: objectNameSingular,
        });
      }
      refetch();
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : t`The file could not be uploaded.`,
      );
    } finally {
      setIsUploading(false);
      if (isDefined(fileInputRef.current)) {
        fileInputRef.current.value = '';
      }
    }
  };

  const normalizedSearch = search.trim().toLowerCase();
  const visibleRecords = records.filter(
    (record) =>
      normalizedSearch === '' ||
      (record.name ?? '').toLowerCase().includes(normalizedSearch),
  );
  const openPicker = () => fileInputRef.current?.click();

  return (
    <RoboostRecordContainer
      id="attachments"
      title={title}
      count={totalCount ?? records.length}
      defaultOpen
      settingsEntries={settingsEntries}
      isDropTarget={isDropTarget}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      actions={
        <button
          type="button"
          className="rb-rc-actbtn"
          disabled={isUploading}
          onClick={openPicker}
        >
          <Icon name="plus" size={12} strokeWidth={2} />
          {isUploading ? t`Uploading…` : t`Add`}
        </button>
      }
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        hidden
        aria-label={t`Upload files`}
        onChange={(event) => uploadFiles(event.target.files)}
      />
      {isNonEmptyString(error) && <div className="rb-rc-error">{error}</div>}
      {records.length === 0 ? (
        <div className="rb-rc-empty">
          {t`No attachments yet.`}
          <Button
            variant="secondary"
            size="sm"
            icon="upload"
            disabled={isUploading}
            onClick={openPicker}
          >
            {t`Upload a file`}
          </Button>
        </div>
      ) : (
        <>
          <div className="rb-rc-tools">
            <div className="rb-rc-search">
              <Input
                variant="search"
                size="sm"
                value={search}
                placeholder={t`Search`}
                aria-label={t`Search attachments`}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
          </div>
          <div className="rb-rc-scroll">
            {visibleRecords.map((record) => {
              const file = record.file?.[0];
              const name = isNonEmptyString(record.name)
                ? record.name
                : t`Untitled file`;
              const meta = [
                file?.extension?.replace(/^\./, '').toUpperCase(),
                record.createdBy?.name,
                formatRoboostDate(record.createdAt),
              ]
                .filter(isNonEmptyString)
                .join(' · ');

              return (
                <a
                  key={record.id}
                  className="rb-file"
                  href={file?.url ?? undefined}
                  target="_blank"
                  rel="noreferrer"
                >
                  <span className="rb-file-ic">
                    <Icon name="note" size={17} />
                  </span>
                  <span className="rb-file-main">
                    <span className="rb-file-name" title={name}>
                      {name}
                    </span>
                    <span className="rb-file-meta">{meta}</span>
                  </span>
                </a>
              );
            })}
          </div>
        </>
      )}
    </RoboostRecordContainer>
  );
};
