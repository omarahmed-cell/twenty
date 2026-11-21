import { BadRequestException } from '@nestjs/common';

export const ROBOOST_USER_VAR_PREFIX = 'roboost.';
export const ROBOOST_WORKSPACE_DEFAULT_PREFIX = 'roboost.default.';

const ROBOOST_USER_VAR_KEY_PATTERN = /^roboost\.[A-Za-z0-9._-]{1,120}$/;
const ROBOOST_USER_VAR_MAX_LENGTH = 50_000;

// Frontend preferences (mode, layout order) live in user vars under one prefix, so other keys stay server-owned
export const assertRoboostUserVar = (
  key: string,
  value: unknown,
  scope: 'user' | 'workspace',
) => {
  // Workspace defaults and member keys never share a name, so deleting one can't touch the other
  const isWorkspaceDefaultKey = key.startsWith(
    ROBOOST_WORKSPACE_DEFAULT_PREFIX,
  );

  if (
    !ROBOOST_USER_VAR_KEY_PATTERN.test(key) ||
    isWorkspaceDefaultKey !== (scope === 'workspace')
  ) {
    throw new BadRequestException(
      `Preference keys must start with "${ROBOOST_USER_VAR_PREFIX}"`,
    );
  }

  if (JSON.stringify(value ?? null).length > ROBOOST_USER_VAR_MAX_LENGTH) {
    throw new BadRequestException('Preference value is too large');
  }
};
