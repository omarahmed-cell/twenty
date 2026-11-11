import { SettingsAccountsMessageAutoCreationIcon } from '@/settings/accounts/components/SettingsAccountsMessageAutoCreationIcon';
import { SettingsRadioSettingsCard } from '@/settings/components/SettingsRadioSettingsCard';
import { msg } from '@lingui/core/macro';
import { MessageChannelContactAutoCreationPolicy } from 'twenty-shared/types';

type SettingsAccountsMessageAutoCreationCardProps = {
  onChange: (nextValue: MessageChannelContactAutoCreationPolicy) => void;
};

// Contacts and companies are never created from synced mail; the server enforces it too.
const autoCreationOptions = [
  {
    title: msg`None`,
    description: msg`Contacts and companies are never created from synced emails.`,
    value: MessageChannelContactAutoCreationPolicy.NONE,
    cardMedia: (
      <SettingsAccountsMessageAutoCreationIcon
        isSentActive={false}
        isReceivedActive={false}
      />
    ),
  },
];

export const SettingsAccountsMessageAutoCreationCard = ({
  onChange,
}: SettingsAccountsMessageAutoCreationCardProps) => (
  <SettingsRadioSettingsCard
    name="message-auto-creation"
    options={autoCreationOptions}
    value={MessageChannelContactAutoCreationPolicy.NONE}
    onChange={onChange}
  />
);
