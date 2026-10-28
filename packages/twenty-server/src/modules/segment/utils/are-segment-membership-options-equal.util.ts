import { type FieldMetadataComplexOption } from 'twenty-shared/types';

export const areSegmentMembershipOptionsEqual = (
  currentOptions: Partial<FieldMetadataComplexOption>[],
  desiredOptions: FieldMetadataComplexOption[],
) =>
  currentOptions.length === desiredOptions.length &&
  desiredOptions.every((desiredOption, index) => {
    const currentOption = currentOptions[index];

    return (
      currentOption.id === desiredOption.id &&
      currentOption.value === desiredOption.value &&
      currentOption.label === desiredOption.label &&
      currentOption.position === desiredOption.position
    );
  });
