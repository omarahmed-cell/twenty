// Only the actor of this write counts: a record imported long ago is edited live later
export const isImportWrite = (
  record: Record<string, unknown> | undefined,
  isUpdate: boolean,
) =>
  (
    (isUpdate ? record?.updatedBy : record?.createdBy) as
      | { source?: string }
      | undefined
  )?.source === 'IMPORT';
