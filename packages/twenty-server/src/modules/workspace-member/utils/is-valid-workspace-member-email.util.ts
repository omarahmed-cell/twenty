const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const isValidWorkspaceMemberEmail = (email: string): boolean =>
  EMAIL_PATTERN.test(email);
