import { Select } from '@/ui/input/components/Select';
import { SettingsTextInput } from '@/ui/input/components/SettingsTextInput';
import { DialogInstance } from '@/ui/layout/dialog/components/DialogInstance';
import { useDialog } from '@/ui/layout/dialog/hooks/useDialog';
import { type WorkspaceMemberStatus } from '@/workspace-member/types/WorkspaceMemberStatus';
import { useMutation } from '@apollo/client/react';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { isNonEmptyString } from '@sniptt/guards';
import { useState } from 'react';
import { isDefined } from 'twenty-shared/utils';
import { Button } from 'twenty-ui/primitives/input';
import { Dialog } from 'twenty-ui/primitives/surfaces';
import { themeCssVariables } from 'twenty-ui/theme';
import { PreCreateWorkspaceMemberDocument } from '~/generated-metadata/graphql';

type SettingsWorkspaceMemberAddModalProps = {
  modalInstanceId: string;
  onMemberAdded: () => void | Promise<void>;
};

const StyledFields = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[4]};
`;

const StyledErrorMessage = styled.div`
  color: ${themeCssVariables.font.color.danger};
  font-size: ${themeCssVariables.font.size.sm};
  margin-top: ${themeCssVariables.spacing[4]};
`;

const DEFAULT_MEMBER_STATUS: WorkspaceMemberStatus = 'ACTIVE';

export const SettingsWorkspaceMemberAddModal = ({
  modalInstanceId,
  onMemberAdded,
}: SettingsWorkspaceMemberAddModalProps) => {
  const { t } = useLingui();
  const { closeDialog } = useDialog();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [memberStatus, setMemberStatus] = useState<WorkspaceMemberStatus>(
    DEFAULT_MEMBER_STATUS,
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [preCreateWorkspaceMember, { loading }] = useMutation(
    PreCreateWorkspaceMemberDocument,
  );

  const trimmedFirstName = firstName.trim();
  const trimmedLastName = lastName.trim();
  const trimmedEmail = email.trim();
  const canSubmit =
    isNonEmptyString(trimmedFirstName) &&
    isNonEmptyString(trimmedEmail) &&
    !loading;

  // The modal stays mounted, so reset it for the next use.
  const handleClose = () => {
    setFirstName('');
    setLastName('');
    setEmail('');
    setMemberStatus(DEFAULT_MEMBER_STATUS);
    setErrorMessage(null);
    closeDialog(modalInstanceId);
  };

  const handleSubmit = async () => {
    if (!canSubmit) {
      return;
    }

    setErrorMessage(null);

    try {
      await preCreateWorkspaceMember({
        variables: {
          input: {
            firstName: trimmedFirstName,
            lastName: trimmedLastName,
            email: trimmedEmail,
            memberStatus,
          },
        },
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error && isNonEmptyString(error.message)
          ? error.message
          : t`Unable to add this member right now`,
      );
      return;
    }

    handleClose();
    await onMemberAdded();
  };

  return (
    <DialogInstance
      dialogId={modalInstanceId}
      dismissible
      onClose={handleClose}
      renderInDocumentBody
    >
      {({ onKeyDown }) => (
        <Dialog.Popup
          onKeyDown={onKeyDown}
          size="md"
          data-globally-prevent-click-outside
        >
          <Dialog.Header>
            <Dialog.Title>{t`Add member`}</Dialog.Title>
            <Dialog.Description>
              {t`They join this member when they first sign in with this email. No invitation is sent.`}
            </Dialog.Description>
          </Dialog.Header>

          <Dialog.Body>
            <StyledFields>
              <SettingsTextInput
                instanceId={`${modalInstanceId}-first-name`}
                label={t`First name`}
                value={firstName}
                onChange={setFirstName}
                autoFocusOnMount
                fullWidth
              />
              <SettingsTextInput
                instanceId={`${modalInstanceId}-last-name`}
                label={t`Last name`}
                value={lastName}
                onChange={setLastName}
                fullWidth
              />
              <SettingsTextInput
                instanceId={`${modalInstanceId}-email`}
                label={t`Email`}
                type="email"
                value={email}
                onChange={setEmail}
                fullWidth
              />
              <Select
                dropdownId={`${modalInstanceId}-status`}
                label={t`Status`}
                value={memberStatus}
                options={[
                  { value: 'ACTIVE', label: t`Active` },
                  { value: 'DEACTIVATED', label: t`Deactivated` },
                ]}
                onChange={setMemberStatus}
                fullWidth
              />
            </StyledFields>

            {isDefined(errorMessage) && (
              <StyledErrorMessage role="alert">
                {errorMessage}
              </StyledErrorMessage>
            )}
          </Dialog.Body>

          <Dialog.Footer>
            <Button onClick={handleClose} variant="outline">{t`Cancel`}</Button>
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit}
              variant="solid"
              color="accent"
            >{t`Add member`}</Button>
          </Dialog.Footer>
        </Dialog.Popup>
      )}
    </DialogInstance>
  );
};
