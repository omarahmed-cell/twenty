import { assertWorkspaceMemberAccessFieldsNotWritten } from 'src/engine/core-modules/actor/utils/assert-workspace-member-access-fields-not-written.util';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';

const userAuthContext = {
  type: 'user',
  workspace: { id: 'workspace-id' },
} as unknown as WorkspaceAuthContext;

describe('assertWorkspaceMemberAccessFieldsNotWritten', () => {
  it.each(['memberStatus', 'isPreCreated', 'userId', 'userEmail'])(
    'refuses writing %s on a workspace member',
    (fieldName) => {
      expect(() =>
        assertWorkspaceMemberAccessFieldsNotWritten({
          records: [{ [fieldName]: 'value' }],
          objectMetadataNameSingular: 'workspaceMember',
          authContext: userAuthContext,
        }),
      ).toThrow();
    },
  );

  it('allows profile fields on a workspace member', () => {
    expect(() =>
      assertWorkspaceMemberAccessFieldsNotWritten({
        records: [{ locale: 'en', colorScheme: 'Light' }],
        objectMetadataNameSingular: 'workspaceMember',
        authContext: userAuthContext,
      }),
    ).not.toThrow();
  });

  it('ignores other objects', () => {
    expect(() =>
      assertWorkspaceMemberAccessFieldsNotWritten({
        records: [{ userId: 'value' }],
        objectMetadataNameSingular: 'company',
        authContext: userAuthContext,
      }),
    ).not.toThrow();
  });
});
