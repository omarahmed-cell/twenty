import { gql } from '@apollo/client';
import { useContext } from 'react';
import { isDefined } from 'twenty-shared/utils';

import { ApolloCoreClientContext } from '@/object-metadata/contexts/ApolloCoreClientContext';
import { usePropertySettings } from '@/properties/hooks/usePropertySettings';
import { propertyCreationContextState } from '@/settings/data-model/properties/states/propertyCreationContextState';
import { useAtomState } from '@/ui/utilities/state/jotai/hooks/useAtomState';

const CREATE_PROPERTY_GROUP_MEMBERSHIP = gql`
  mutation CreatePropertyGroupMembershipForNewField(
    $input: PropertyGroupMembershipCreateInput!
  ) {
    createPropertyGroupMembership(data: $input) {
      id
    }
  }
`;

// The new-field flow offers a group picker; a raw mutation keeps it working in workspaces without the property objects
export const useNewPropertyGroupAssignment = (objectMetadataId: string) => {
  const apolloCoreClient = useContext(ApolloCoreClientContext);
  const { propertySettings, reloadPropertySettings } = usePropertySettings();
  const [propertyCreationContext, setPropertyCreationContext] = useAtomState(
    propertyCreationContextState,
  );

  const isFromPropertiesScreen =
    propertyCreationContext?.objectMetadataId === objectMetadataId;

  const groups = (propertySettings?.groups ?? [])
    .filter((group) => group.objectMetadataId === objectMetadataId)
    .sort((left, right) => left.position - right.position);

  const initialPropertyGroupId = isFromPropertiesScreen
    ? (propertyCreationContext?.propertyGroupId ?? '')
    : '';

  const assignNewFieldToGroup = async ({
    fieldMetadataId,
    propertyGroupId,
  }: {
    fieldMetadataId: string | undefined;
    propertyGroupId: string;
  }) => {
    if (
      !isDefined(apolloCoreClient) ||
      !isDefined(fieldMetadataId) ||
      propertyGroupId === ''
    ) {
      return;
    }

    const position = (propertySettings?.memberships ?? []).filter(
      (membership) => membership.propertyGroupId === propertyGroupId,
    ).length;

    await apolloCoreClient.mutate({
      mutation: CREATE_PROPERTY_GROUP_MEMBERSHIP,
      variables: {
        input: { propertyGroupId, fieldMetadataId, objectMetadataId, position },
      },
    });
    await reloadPropertySettings();
  };

  const consumePropertyCreationContext = () => {
    setPropertyCreationContext(null);

    return isFromPropertiesScreen;
  };

  return {
    hasPropertyGroups: isDefined(propertySettings),
    groups,
    initialPropertyGroupId,
    assignNewFieldToGroup,
    consumePropertyCreationContext,
  };
};
