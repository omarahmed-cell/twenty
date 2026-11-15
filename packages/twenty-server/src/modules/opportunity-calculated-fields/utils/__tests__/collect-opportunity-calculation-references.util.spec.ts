import { collectOpportunityCalculationReferences } from 'src/modules/opportunity-calculated-fields/utils/collect-opportunity-calculation-references.util';

const DEAL_ID = '11111111-1111-4111-8111-111111111111';
const PERSON_ID = '22222222-2222-4222-8222-222222222222';
const TASK_ID = '33333333-3333-4333-8333-333333333333';

describe('collectOpportunityCalculationReferences', () => {
  it('recomputes a deal when its point of contact changes, not on other edits', () => {
    expect(
      collectOpportunityCalculationReferences({
        objectNameSingular: 'opportunity',
        isUpdate: true,
        before: { id: DEAL_ID, pointOfContactId: null },
        after: { id: DEAL_ID, pointOfContactId: PERSON_ID },
      }),
    ).toEqual([`opportunity:${DEAL_ID}`, `opportunity:${DEAL_ID}`]);

    expect(
      collectOpportunityCalculationReferences({
        objectNameSingular: 'opportunity',
        isUpdate: true,
        before: { id: DEAL_ID, name: 'Old', pointOfContactId: PERSON_ID },
        after: { id: DEAL_ID, name: 'New', pointOfContactId: PERSON_ID },
      }),
    ).toEqual([]);
  });

  it('follows deal contacts and line items to their deal', () => {
    expect(
      collectOpportunityCalculationReferences({
        objectNameSingular: 'opportunityContact',
        isUpdate: false,
        before: undefined,
        after: { opportunityId: DEAL_ID, personId: PERSON_ID },
      }),
    ).toEqual([`opportunity:${DEAL_ID}`]);

    expect(
      collectOpportunityCalculationReferences({
        objectNameSingular: 'lineItem',
        isUpdate: false,
        before: undefined,
        after: { dealId: DEAL_ID },
      }),
    ).toEqual([`opportunity:${DEAL_ID}`]);
  });

  it('recomputes when a task due date or status changes', () => {
    expect(
      collectOpportunityCalculationReferences({
        objectNameSingular: 'task',
        isUpdate: true,
        before: { id: TASK_ID, status: 'TODO' },
        after: { id: TASK_ID, status: 'DONE' },
      }),
    ).toEqual([`task:${TASK_ID}`, `task:${TASK_ID}`]);

    expect(
      collectOpportunityCalculationReferences({
        objectNameSingular: 'task',
        isUpdate: true,
        before: { id: TASK_ID, title: 'Call' },
        after: { id: TASK_ID, title: 'Call back' },
      }),
    ).toEqual([]);
  });

  it('follows activity links on deals only', () => {
    expect(
      collectOpportunityCalculationReferences({
        objectNameSingular: 'taskTarget',
        isUpdate: false,
        before: undefined,
        after: { targetOpportunityId: DEAL_ID, targetPersonId: PERSON_ID },
      }),
    ).toEqual([`opportunity:${DEAL_ID}`]);
  });
});
