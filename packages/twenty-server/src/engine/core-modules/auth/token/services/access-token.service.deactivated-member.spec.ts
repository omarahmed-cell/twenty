import { WorkspaceActivationStatus } from 'twenty-shared/workspace';

import { AuthExceptionCode } from 'src/engine/core-modules/auth/auth.exception';
import { AccessTokenService } from 'src/engine/core-modules/auth/token/services/access-token.service';
import { AuthProviderEnum } from 'src/engine/core-modules/workspace/types/workspace.type';

const USER_ID = 'user-id';
const WORKSPACE_ID = 'workspace-id';

const buildAccessTokenService = (memberStatus: 'ACTIVE' | 'DEACTIVATED') => {
  const workspaceMemberRepository = {
    findOne: jest.fn(async () => ({
      id: 'workspace-member-id',
      userId: USER_ID,
      memberStatus,
    })),
  };

  const jwtWrapperService = {
    signAsyncOrThrow: jest.fn(async () => 'signed-token'),
  };

  const service = new AccessTokenService(
    jwtWrapperService as never,
    {} as never,
    { get: jest.fn(() => '30m') } as never,
    { findOne: jest.fn(async () => ({ id: USER_ID })) } as never,
    {
      findOne: jest.fn(async () => ({
        id: WORKSPACE_ID,
        activationStatus: WorkspaceActivationStatus.ACTIVE,
      })),
    } as never,
    {
      executeInWorkspaceContext: jest.fn(async (work: () => unknown) => work()),
      getRepository: jest.fn(() => workspaceMemberRepository),
    } as never,
    {
      findOne: jest.fn(async () => ({
        id: 'user-workspace-id',
        userId: USER_ID,
        workspaceId: WORKSPACE_ID,
      })),
    } as never,
    {} as never,
    {} as never,
  );

  return { service, jwtWrapperService };
};

describe('AccessTokenService for a deactivated member', () => {
  it('refuses to issue or renew an access token', async () => {
    const { service, jwtWrapperService } =
      buildAccessTokenService('DEACTIVATED');

    await expect(
      service.generateAccessToken({
        userId: USER_ID,
        workspaceId: WORKSPACE_ID,
        authProvider: AuthProviderEnum.Password,
      }),
    ).rejects.toMatchObject({
      code: AuthExceptionCode.FORBIDDEN_EXCEPTION,
      message: 'This member has been deactivated',
    });
    expect(jwtWrapperService.signAsyncOrThrow).not.toHaveBeenCalled();
  });

  it('issues an access token again once the member is reactivated', async () => {
    const { service } = buildAccessTokenService('ACTIVE');

    await expect(
      service.generateAccessToken({
        userId: USER_ID,
        workspaceId: WORKSPACE_ID,
        authProvider: AuthProviderEnum.Password,
      }),
    ).resolves.toMatchObject({ token: 'signed-token' });
  });
});
