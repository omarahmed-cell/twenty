import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { useToast } from 'twenty-ui/components/feedback';
import { IconRefresh } from 'twenty-ui/icon';
import { Button } from 'twenty-ui/primitives/input';

type SettingsDataModelFieldResyncButtonProps = {
  onResync: () => Promise<boolean>;
  disabled?: boolean;
};

export const SettingsDataModelFieldResyncButton = ({
  onResync,
  disabled,
}: SettingsDataModelFieldResyncButtonProps) => {
  const { t } = useLingui();
  const { enqueueToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);

    try {
      const hasStarted = await onResync();

      enqueueToast(
        hasStarted
          ? { status: 'success', children: t`Resync started` }
          : {
              status: 'error',
              children: t`This field can't resync until it has a valid source.`,
            },
      );
    } catch {
      enqueueToast({
        status: 'error',
        children: t`Could not start the resync`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      startIcon={<IconRefresh />}
      size="sm"
      disabled={disabled || isLoading}
      onClick={handleClick}
    >
      {t`Resync now`}
    </Button>
  );
};
