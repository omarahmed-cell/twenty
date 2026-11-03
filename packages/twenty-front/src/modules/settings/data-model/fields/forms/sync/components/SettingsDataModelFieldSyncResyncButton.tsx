import { SettingsDataModelFieldResyncButton } from '@/settings/data-model/fields/forms/components/SettingsDataModelFieldResyncButton';
import { useMutation } from '@apollo/client/react';
import { ResyncSyncFieldDocument } from '~/generated-metadata/graphql';

type SettingsDataModelFieldSyncResyncButtonProps = {
  fieldMetadataId: string;
  disabled?: boolean;
};

export const SettingsDataModelFieldSyncResyncButton = ({
  fieldMetadataId,
  disabled,
}: SettingsDataModelFieldSyncResyncButtonProps) => {
  const [resyncSyncField] = useMutation(ResyncSyncFieldDocument);

  return (
    <SettingsDataModelFieldResyncButton
      disabled={disabled}
      onResync={async () => {
        const { data } = await resyncSyncField({
          variables: { fieldMetadataId },
        });

        return data?.resyncSyncField === true;
      }}
    />
  );
};
