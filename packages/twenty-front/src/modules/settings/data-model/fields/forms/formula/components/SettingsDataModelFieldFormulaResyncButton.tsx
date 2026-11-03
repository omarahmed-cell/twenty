import { SettingsDataModelFieldResyncButton } from '@/settings/data-model/fields/forms/components/SettingsDataModelFieldResyncButton';
import { useMutation } from '@apollo/client/react';
import { ResyncFormulaFieldDocument } from '~/generated-metadata/graphql';

type SettingsDataModelFieldFormulaResyncButtonProps = {
  fieldMetadataId: string;
  disabled?: boolean;
};

export const SettingsDataModelFieldFormulaResyncButton = ({
  fieldMetadataId,
  disabled,
}: SettingsDataModelFieldFormulaResyncButtonProps) => {
  const [resyncFormulaField] = useMutation(ResyncFormulaFieldDocument);

  return (
    <SettingsDataModelFieldResyncButton
      disabled={disabled}
      onResync={async () => {
        const { data } = await resyncFormulaField({
          variables: { fieldMetadataId },
        });

        return data?.resyncFormulaField === true;
      }}
    />
  );
};
