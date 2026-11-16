import { objectRecordDiffMerge } from 'src/engine/core-modules/event-emitter/utils/object-record-diff-merge';

describe('objectRecordDiffMerge', () => {
  it('chains the before of the old diff with the after of the new one', () => {
    expect(
      objectRecordDiffMerge(
        { diff: { stage: { before: 'A', after: 'B' } } },
        {
          diff: {
            stage: { before: 'B', after: 'C' },
            amount: { before: 1, after: 2 },
          },
        },
      ),
    ).toEqual({
      diff: {
        stage: { before: 'A', after: 'C' },
        amount: { before: 1, after: 2 },
      },
    });
  });

  it('keeps other properties already on the row', () => {
    expect(
      objectRecordDiffMerge(
        { pipelineRuleOverride: 'Moved out of Lost by Ana' },
        { diff: { stage: { before: 'LOST', after: 'B' } } },
      ),
    ).toEqual({
      pipelineRuleOverride: 'Moved out of Lost by Ana',
      diff: { stage: { before: 'LOST', after: 'B' } },
    });
  });
});
