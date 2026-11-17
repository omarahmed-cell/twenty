import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { getWorkspaceMemberLabelWithStatus } from '@/workspace-member/utils/getWorkspaceMemberLabelWithStatus';
import { isString } from '@sniptt/guards';
import { CoreObjectNameSingular } from 'twenty-shared/types';

export const getRecordIdentifierLabel = ({
  objectNameSingular,
  record,
  label,
}: {
  objectNameSingular: string;
  record: ObjectRecord;
  label: string;
}) => {
  if (objectNameSingular !== CoreObjectNameSingular.WorkspaceMember) {
    return label;
  }

  return getWorkspaceMemberLabelWithStatus({
    label,
    memberStatus: isString(record.memberStatus) ? record.memberStatus : null,
  });
};
