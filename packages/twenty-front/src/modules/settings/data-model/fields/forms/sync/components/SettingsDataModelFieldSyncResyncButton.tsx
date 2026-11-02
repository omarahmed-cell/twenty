import { useMutation } from '@apollo/client/react';
import { useLingui } from '@lingui/react/macro';
import { useToast } from 'twenty-ui/components/feedback';
import { IconRefresh } from 'twenty-ui/icon';
import { Button } from 'twenty-ui/primitives/input';
import { ResyncSyncFieldDocument } from '~/generated-metadata/graphql';

type SettingsDataModelFieldSyncResyncButtonProps = {
  fieldMetadataId: string;
  disabled?: boolean;
};

export const SettingsDataModelFieldSyncResyncButton = ({
  fieldMetadataId,
  disabled,
}: SettingsDataModelFieldSyncResyncButtonProps) => {
  const { t } = useLingui();
  const { enqueueToast } = useToast();
  const [resyncSyncField, { loading }] = useMutation(ResyncSyncFieldDocument);

  const handleClick = async () => {
    try {
      const { data } = await resyncSyncField({
        variables: { fieldMetadataId },
      });

      if (data?.resyncSyncField === true) {
        enqueueToast({ status: 'success', children: t`Resync started` });
      } else {
        enqueueToast({
          status: 'error',
          children: t`This field can't resync until it has a valid source.`,
        });
      }
    } catch {
      enqueueToast({
        status: 'error',
        children: t`Could not start the resync`,
      });
    }
  };

  return (
    <Button
      startIcon={<IconRefresh />}
      size="sm"
      disabled={disabled || loading}
      onClick={handleClick}
    >
      {t`Resync now`}
    </Button>
  );
};
