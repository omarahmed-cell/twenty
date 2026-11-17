export const splitMemberName = (
  name: string,
): { firstName: string; lastName: string } => {
  const [firstName = '', ...lastNameTokens] = name.trim().split(/\s+/);

  return { firstName, lastName: lastNameTokens.join(' ') };
};
