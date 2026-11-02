import { isDefined } from 'twenty-shared/utils';
import { v4 } from 'uuid';

export type SyncedFieldOption = {
  id: string;
  label: string;
  value: string;
  color: string;
  position: number;
};

// Target option ids are preserved through the source's previous values, so that
// a renamed source option migrates the target's stored values instead of clearing them.
export const buildSyncedFieldOptions = ({
  sourceOptions,
  sourceOptionsBefore = [],
  targetOptions,
}: {
  sourceOptions: SyncedFieldOption[];
  sourceOptionsBefore?: SyncedFieldOption[];
  targetOptions: SyncedFieldOption[];
}): SyncedFieldOption[] => {
  const targetOptionIdByValue = new Map(
    targetOptions.map(({ id, value }) => [value, id]),
  );

  const previousValueBySourceOptionId = new Map(
    sourceOptionsBefore.map(({ id, value }) => [id, value]),
  );

  const getRenamedTargetOptionId = (sourceOptionId: string) => {
    const previousValue = previousValueBySourceOptionId.get(sourceOptionId);

    return isDefined(previousValue)
      ? targetOptionIdByValue.get(previousValue)
      : undefined;
  };

  const claimedTargetOptionIds = new Set(
    sourceOptions
      .map(({ id }) => getRenamedTargetOptionId(id))
      .filter(isDefined),
  );

  return sourceOptions.map(({ id, label, value, color, position }) => {
    const sameValueTargetOptionId = targetOptionIdByValue.get(value);

    const targetOptionId =
      getRenamedTargetOptionId(id) ??
      (isDefined(sameValueTargetOptionId) &&
      !claimedTargetOptionIds.has(sameValueTargetOptionId)
        ? sameValueTargetOptionId
        : v4());

    return { id: targetOptionId, label, value, color, position };
  });
};

export const areSyncedFieldOptionsEqual = (
  leftOptions: SyncedFieldOption[],
  rightOptions: SyncedFieldOption[],
) => {
  const toComparable = (options: SyncedFieldOption[]) =>
    JSON.stringify(
      options.map(({ id, label, value, color, position }) => ({
        id,
        label,
        value,
        color,
        position,
      })),
    );

  return toComparable(leftOptions) === toComparable(rightOptions);
};
