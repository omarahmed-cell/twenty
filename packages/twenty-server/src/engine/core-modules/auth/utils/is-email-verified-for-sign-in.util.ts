export const isEmailVerifiedForSignIn = ({
  isUserEmailVerified,
  isEmailVerifiedByAuthProvider,
}: {
  isUserEmailVerified: boolean | undefined;
  isEmailVerifiedByAuthProvider: boolean | undefined;
}): boolean =>
  isUserEmailVerified === true || isEmailVerifiedByAuthProvider === true;
