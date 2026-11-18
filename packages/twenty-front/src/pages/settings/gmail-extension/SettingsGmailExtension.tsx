import { styled } from '@linaria/react';
import { useMutation, useQuery } from '@apollo/client/react';
import { Trans, useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { SettingsPath } from 'twenty-shared/types';
import { getSettingsPath, isDefined } from 'twenty-shared/utils';
import { Section } from 'twenty-ui/components/layout';
import { IconCopy, IconPlus, IconTrash } from 'twenty-ui/icon';
import { Button } from 'twenty-ui/primitives/input';
import { themeCssVariables } from 'twenty-ui/theme';

import { SettingsPageContainer } from '@/settings/components/SettingsPageContainer';
import { SettingsPageLayout } from '@/settings/components/layout/SettingsPageLayout';
import { CREATE_GMAIL_EXTENSION_TOKEN } from '@/settings/gmail-extension/graphql/createGmailExtensionToken';
import { GMAIL_EXTENSION_TOKENS } from '@/settings/gmail-extension/graphql/gmailExtensionTokens';
import { REVOKE_GMAIL_EXTENSION_TOKEN } from '@/settings/gmail-extension/graphql/revokeGmailExtensionToken';
import { useCopyToClipboard } from '~/hooks/useCopyToClipboard';
import { formatToHumanReadableDate } from '~/utils/date-utils';

type GmailExtensionToken = {
  id: string;
  createdAt: string;
  lastUsedAt: string | null;
};

const StyledList = styled.div`
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.md};
  display: flex;
  flex-direction: column;
`;

const StyledRow = styled.div`
  align-items: center;
  border-bottom: 1px solid ${themeCssVariables.border.color.light};
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
  justify-content: space-between;
  padding: ${themeCssVariables.spacing[2]} ${themeCssVariables.spacing[3]};

  &:last-child {
    border-bottom: none;
  }
`;

const StyledMuted = styled.span`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.sm};
`;

const StyledToken = styled.code`
  background: ${themeCssVariables.background.tertiary};
  border-radius: ${themeCssVariables.border.radius.sm};
  font-size: ${themeCssVariables.font.size.sm};
  overflow-wrap: anywhere;
  padding: ${themeCssVariables.spacing[2]};
`;

const StyledNewToken = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
`;

export const SettingsGmailExtension = () => {
  const { t } = useLingui();
  const { copyToClipboard } = useCopyToClipboard();
  const [newToken, setNewToken] = useState<string | null>(null);

  const { data, refetch } = useQuery<{
    gmailExtensionTokens: GmailExtensionToken[];
  }>(GMAIL_EXTENSION_TOKENS);
  const [createToken, { loading: isCreating }] = useMutation<{
    createGmailExtensionToken: { id: string; token: string };
  }>(CREATE_GMAIL_EXTENSION_TOKEN);
  const [revokeToken] = useMutation(REVOKE_GMAIL_EXTENSION_TOKEN);

  const tokens = data?.gmailExtensionTokens ?? [];

  const handleCreate = async () => {
    const result = await createToken();
    const created = result.data?.createGmailExtensionToken;

    if (isDefined(created)) {
      setNewToken(created.token);
      await refetch();
    }
  };

  const handleRevoke = async (id: string) => {
    await revokeToken({ variables: { id } });
    await refetch();
  };

  return (
    <SettingsPageLayout
      title={t`Gmail extension`}
      links={[
        {
          children: <Trans>User</Trans>,
          href: getSettingsPath(SettingsPath.ProfilePage),
        },
        { children: <Trans>Gmail extension</Trans> },
      ]}
    >
      <SettingsPageContainer>
        <Section.Root>
          <Section.Header
            title={t`Personal token`}
            description={t`The Roboost CRM Chrome extension asks for this token once. It logs emails as you, so keep it private and revoke it if a computer is lost.`}
          />
          {isDefined(newToken) && (
            <StyledNewToken>
              <StyledMuted>
                <Trans>Copy the token now; it is not shown again.</Trans>
              </StyledMuted>
              <StyledToken>{newToken}</StyledToken>
              <div>
                <Button
                  size="sm"
                  variant="outline"
                  startIcon={<IconCopy />}
                  onClick={() => copyToClipboard(newToken, t`Token copied`)}
                >
                  {t`Copy token`}
                </Button>
              </div>
            </StyledNewToken>
          )}
          <div>
            <Button
              size="sm"
              variant="solid"
              color="accent"
              startIcon={<IconPlus />}
              disabled={isCreating}
              onClick={handleCreate}
            >
              {t`Create token`}
            </Button>
          </div>
        </Section.Root>
        {tokens.length > 0 && (
          <Section.Root>
            <Section.Header
              title={t`Active tokens`}
              description={t`Revoking a token signs the extension out on that computer.`}
            />
            <StyledList>
              {tokens.map((token) => (
                <StyledRow key={token.id}>
                  <span>
                    {t`Created ${formatToHumanReadableDate(token.createdAt)}`}
                  </span>
                  <StyledMuted>
                    {isDefined(token.lastUsedAt)
                      ? t`Last used ${formatToHumanReadableDate(token.lastUsedAt)}`
                      : t`Never used`}
                  </StyledMuted>
                  <Button
                    size="sm"
                    variant="outline"
                    color="danger"
                    startIcon={<IconTrash />}
                    onClick={() => handleRevoke(token.id)}
                  >
                    {t`Revoke`}
                  </Button>
                </StyledRow>
              ))}
            </StyledList>
          </Section.Root>
        )}
      </SettingsPageContainer>
    </SettingsPageLayout>
  );
};
