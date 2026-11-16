import { type ObjectRecordBaseEvent } from 'twenty-shared/database-events';

import { buildDealStageChanges } from 'src/modules/deal-stage-history/utils/build-deal-stage-changes.util';

const CHANGED_AT = '2026-11-16T10:00:00.000Z';
const MEMBER = { source: 'MANUAL', name: 'Ana Admin', workspaceMemberId: 'm1' };

const event = (
  before: Record<string, unknown> | undefined,
  after: Record<string, unknown>,
) =>
  ({
    recordId: 'deal',
    properties: { before, after },
  }) as unknown as ObjectRecordBaseEvent<Record<string, unknown>>;

const build = (
  events: ObjectRecordBaseEvent<Record<string, unknown>>[],
  isUpdate = true,
  isWorkflowWrite = false,
) =>
  buildDealStageChanges({
    events,
    isUpdate,
    isWorkflowWrite,
    changedAt: CHANGED_AT,
  });

describe('buildDealStageChanges', () => {
  it('records a move with the pipeline and who made it', () => {
    expect(
      build([
        event(
          { stage: 'SALES_DISCOVERY_STAGE' },
          {
            stage: 'SALES_QUALIFIED_TO_BUY',
            pipeline: 'SALES_PIPELINE',
            updatedBy: MEMBER,
          },
        ),
      ]),
    ).toEqual([
      {
        recordId: 'deal',
        pipeline: 'SALES_PIPELINE',
        fromStage: 'SALES_DISCOVERY_STAGE',
        toStage: 'SALES_QUALIFIED_TO_BUY',
        changedAt: CHANGED_AT,
        changedBy: MEMBER,
      },
    ]);
  });

  it('records a creation as entering the first stage', () => {
    expect(
      build(
        [event(undefined, { stage: 'PILOT_DISCOVERY', createdBy: MEMBER })],
        false,
      ),
    ).toMatchObject([{ fromStage: null, toStage: 'PILOT_DISCOVERY' }]);
  });

  it('marks workflow moves and skips imports and edits that keep the stage', () => {
    expect(
      build(
        [event({ stage: 'A' }, { stage: 'B', updatedBy: MEMBER })],
        true,
        true,
      )[0].changedBy,
    ).toEqual({
      source: 'WORKFLOW',
      name: 'Workflow',
      workspaceMemberId: 'm1',
    });
    expect(
      build(
        [event(undefined, { stage: 'A', createdBy: { source: 'IMPORT' } })],
        false,
      ),
    ).toEqual([]);
    expect(build([event({ stage: 'A' }, { stage: 'A', amount: 2 })])).toEqual(
      [],
    );
  });
});
