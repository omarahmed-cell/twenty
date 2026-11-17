import { getObjectRecordIdentifier } from '@/object-metadata/utils/getObjectRecordIdentifier';
import { CoreObjectNameSingular } from 'twenty-shared/types';
import { getMockObjectMetadataItemOrThrow } from '~/testing/utils/getMockObjectMetadataItemOrThrow';

const workspaceMemberObjectMetadataItem = getMockObjectMetadataItemOrThrow(
  CoreObjectNameSingular.WorkspaceMember,
);

const buildWorkspaceMemberRecord = (memberStatus: string) => ({
  __typename: 'WorkspaceMember',
  id: '20202020-0000-4000-8000-000000000001',
  name: { firstName: 'Jane', lastName: 'Austen' },
  memberStatus,
});

describe('getObjectRecordIdentifier', () => {
  it('labels a deactivated workspace member so existing records still show them', () => {
    const identifier = getObjectRecordIdentifier({
      objectMetadataItem: workspaceMemberObjectMetadataItem,
      record: buildWorkspaceMemberRecord('DEACTIVATED'),
      allowRequestsToTwentyIcons: false,
    });

    expect(identifier.name).toBe('Jane Austen (deactivated)');
  });

  it('keeps the plain name of an active workspace member', () => {
    const identifier = getObjectRecordIdentifier({
      objectMetadataItem: workspaceMemberObjectMetadataItem,
      record: buildWorkspaceMemberRecord('ACTIVE'),
      allowRequestsToTwentyIcons: false,
    });

    expect(identifier.name).toBe('Jane Austen');
  });
});
