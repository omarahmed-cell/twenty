import { useCallback } from 'react';
import { CoreObjectNameSingular } from 'twenty-shared/types';
import { type ConditionalLogicRule, isDefined } from 'twenty-shared/utils';
import { useToast } from 'twenty-ui/components/feedback';

import { getToastOptionsFromError } from '@/error-handler/utils/getToastOptionsFromError';
import { useCreateOneRecord } from '@/object-record/hooks/useCreateOneRecord';
import { useDestroyOneRecord } from '@/object-record/hooks/useDestroyOneRecord';
import { useUpdateOneRecord } from '@/object-record/hooks/useUpdateOneRecord';
import { usePropertySettings } from '@/properties/hooks/usePropertySettings';

export const useSettingsPropertyActions = () => {
  const { enqueueToast } = useToast();
  const { propertySettings, reloadPropertySettings } = usePropertySettings();

  const { createOneRecord: createPropertyGroup } = useCreateOneRecord({
    objectNameSingular: CoreObjectNameSingular.PropertyGroup,
  });
  const { createOneRecord: createPropertyGroupMembership } = useCreateOneRecord(
    {
      objectNameSingular: CoreObjectNameSingular.PropertyGroupMembership,
    },
  );
  const { createOneRecord: createPropertyLogicRule } = useCreateOneRecord({
    objectNameSingular: CoreObjectNameSingular.PropertyLogicRule,
  });
  const { updateOneRecord } = useUpdateOneRecord();
  const { destroyOneRecord: destroyPropertyGroup } = useDestroyOneRecord({
    objectNameSingular: CoreObjectNameSingular.PropertyGroup,
  });
  const { destroyOneRecord: destroyPropertyGroupMembership } =
    useDestroyOneRecord({
      objectNameSingular: CoreObjectNameSingular.PropertyGroupMembership,
    });
  const { destroyOneRecord: destroyPropertyLogicRule } = useDestroyOneRecord({
    objectNameSingular: CoreObjectNameSingular.PropertyLogicRule,
  });

  const runAndReload = useCallback(
    async (action: () => Promise<unknown>): Promise<boolean> => {
      try {
        await action();

        return true;
      } catch (error) {
        const toastOptions = getToastOptionsFromError({ error });

        if (isDefined(toastOptions)) {
          enqueueToast(toastOptions);
        }

        return false;
      } finally {
        await reloadPropertySettings();
      }
    },
    [enqueueToast, reloadPropertySettings],
  );

  const nextPosition = (positions: number[]) =>
    positions.length === 0 ? 0 : Math.max(...positions) + 1;

  const createGroup = (objectMetadataId: string, name: string) =>
    runAndReload(() =>
      createPropertyGroup({
        name,
        objectMetadataId,
        position: nextPosition(
          (propertySettings?.groups ?? [])
            .filter((group) => group.objectMetadataId === objectMetadataId)
            .map(({ position }) => position),
        ),
      }),
    );

  const renameGroup = (propertyGroupId: string, name: string) =>
    runAndReload(() =>
      updateOneRecord({
        objectNameSingular: CoreObjectNameSingular.PropertyGroup,
        idToUpdate: propertyGroupId,
        updateOneRecordInput: { name },
      }),
    );

  // The server frees the group's properties; they are never deleted
  const deleteGroup = (propertyGroupId: string) =>
    runAndReload(() => destroyPropertyGroup(propertyGroupId));

  const addToGroup = ({
    propertyGroupId,
    objectMetadataId,
    fieldMetadataIds,
  }: {
    propertyGroupId: string;
    objectMetadataId: string;
    fieldMetadataIds: string[];
  }) =>
    runAndReload(async () => {
      const startPosition = nextPosition(
        (propertySettings?.memberships ?? [])
          .filter(
            (membership) => membership.propertyGroupId === propertyGroupId,
          )
          .map(({ position }) => position),
      );

      for (const [index, fieldMetadataId] of fieldMetadataIds.entries()) {
        await createPropertyGroupMembership({
          propertyGroupId,
          objectMetadataId,
          fieldMetadataId,
          position: startPosition + index,
        });
      }
    });

  const removeFromGroup = (membershipId: string) =>
    runAndReload(() => destroyPropertyGroupMembership(membershipId));

  const reorderGroupMembers = (positions: { id: string; position: number }[]) =>
    runAndReload(async () => {
      for (const { id, position } of positions) {
        await updateOneRecord({
          objectNameSingular: CoreObjectNameSingular.PropertyGroupMembership,
          idToUpdate: id,
          updateOneRecordInput: { position },
        });
      }
    });

  const saveRule = ({
    ruleRecordId,
    objectMetadataId,
    rule,
  }: {
    ruleRecordId: string | null;
    objectMetadataId: string;
    rule: ConditionalLogicRule;
  }) =>
    runAndReload(() =>
      isDefined(ruleRecordId)
        ? updateOneRecord({
            objectNameSingular: CoreObjectNameSingular.PropertyLogicRule,
            idToUpdate: ruleRecordId,
            updateOneRecordInput: {
              conditionGroups: rule.conditionGroups,
              properties: rule.properties,
            },
          })
        : createPropertyLogicRule({
            objectMetadataId,
            conditionGroups: rule.conditionGroups,
            properties: rule.properties,
            position: nextPosition(
              (propertySettings?.rules ?? []).map(({ position }) => position),
            ),
          }),
    );

  const deleteRule = (ruleRecordId: string) =>
    runAndReload(() => destroyPropertyLogicRule(ruleRecordId));

  return {
    createGroup,
    renameGroup,
    deleteGroup,
    addToGroup,
    removeFromGroup,
    reorderGroupMembers,
    saveRule,
    deleteRule,
  };
};
