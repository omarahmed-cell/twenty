import { msg } from '@lingui/core/macro';

import {
  AuthException,
  AuthExceptionCode,
} from 'src/engine/core-modules/auth/auth.exception';
import { isWorkspaceMemberDeactivated } from 'src/modules/workspace-member/utils/is-workspace-member-deactivated.util';
import { type WorkspaceMemberWorkspaceEntity } from 'src/modules/workspace-member/standard-objects/workspace-member.workspace-entity';

export const buildWorkspaceMemberDeactivatedException = (
  exceptionCode:
    | typeof AuthExceptionCode.FORBIDDEN_EXCEPTION
    | typeof AuthExceptionCode.UNAUTHENTICATED = AuthExceptionCode.FORBIDDEN_EXCEPTION,
) =>
  new AuthException('This member has been deactivated', exceptionCode, {
    userFriendlyMessage: msg`This member has been deactivated`,
  });

export const assertWorkspaceMemberIsNotDeactivated = (
  workspaceMember: Partial<
    Pick<WorkspaceMemberWorkspaceEntity, 'memberStatus'>
  >,
  exceptionCode?:
    | typeof AuthExceptionCode.FORBIDDEN_EXCEPTION
    | typeof AuthExceptionCode.UNAUTHENTICATED,
): void => {
  if (isWorkspaceMemberDeactivated(workspaceMember)) {
    throw buildWorkspaceMemberDeactivatedException(exceptionCode);
  }
};
