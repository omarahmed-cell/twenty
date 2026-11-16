import { type PipelineBoardScope } from '@/pipeline/board/types/PipelineBoardScope';

// Settings order wins over view-group order and visibility: the board shows exactly the pipeline's stages
export const orderRecordGroupsForPipelineBoardScope = <
  TRecordGroup extends { value: string | null },
>({
  recordGroups,
  scope,
}: {
  recordGroups: TRecordGroup[];
  scope: PipelineBoardScope;
}): TRecordGroup[] => {
  const stageIndexByValue = new Map(
    scope.stageValues.map((stageValue, index) => [stageValue, index]),
  );

  return recordGroups
    .filter(
      (recordGroup) =>
        recordGroup.value !== null && stageIndexByValue.has(recordGroup.value),
    )
    .sort(
      (first, second) =>
        (stageIndexByValue.get(first.value as string) ?? 0) -
        (stageIndexByValue.get(second.value as string) ?? 0),
    );
};
