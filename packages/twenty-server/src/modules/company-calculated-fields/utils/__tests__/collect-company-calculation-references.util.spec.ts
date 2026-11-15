import { collectCompanyCalculationReferences } from 'src/modules/company-calculated-fields/utils/collect-company-calculation-references.util';

describe('collectCompanyCalculationReferences', () => {
  it('recomputes the company and both parents when the parent changes', () => {
    expect(
      collectCompanyCalculationReferences({
        objectNameSingular: 'company',
        isUpdate: true,
        before: { id: 'b', parentCompanyId: 'old-parent' },
        after: { id: 'b', parentCompanyId: 'new-parent' },
      }).sort(),
    ).toEqual([
      'company:b',
      'company:b',
      'company:new-parent',
      'company:old-parent',
    ]);
  });

  it('ignores company edits that leave the parent alone', () => {
    expect(
      collectCompanyCalculationReferences({
        objectNameSingular: 'company',
        isUpdate: true,
        before: { id: 'b', name: 'Old', parentCompanyId: null },
        after: { id: 'b', name: 'New', parentCompanyId: null },
      }),
    ).toEqual([]);
  });

  it('recomputes both companies when a deal moves company', () => {
    expect(
      collectCompanyCalculationReferences({
        objectNameSingular: 'opportunity',
        isUpdate: true,
        before: { companyId: 'a', stage: 'NEW' },
        after: { companyId: 'b', stage: 'NEW' },
      }),
    ).toEqual(['company:a', 'company:b']);
  });

  it('recomputes when a deal stage changes', () => {
    expect(
      collectCompanyCalculationReferences({
        objectNameSingular: 'opportunity',
        isUpdate: true,
        before: { companyId: 'a', stage: 'NEW' },
        after: { companyId: 'a', stage: 'CLOSED_LOST' },
      }),
    ).toEqual(['company:a', 'company:a']);
  });

  it('points an activity link at its company, person and deal', () => {
    expect(
      collectCompanyCalculationReferences({
        objectNameSingular: 'noteTarget',
        isUpdate: false,
        before: undefined,
        after: {
          targetCompanyId: null,
          targetPersonId: 'person-1',
          targetOpportunityId: 'deal-1',
        },
      }),
    ).toEqual(['person:person-1', 'opportunity:deal-1']);
  });

  it('references a deleted activity so its companies lose it', () => {
    expect(
      collectCompanyCalculationReferences({
        objectNameSingular: 'note',
        isUpdate: false,
        before: { id: 'note-1' },
        after: { id: 'note-1', deletedAt: '2026-11-14T10:00:00.000Z' },
      }),
    ).toEqual(['note:note-1', 'note:note-1']);
  });

  it('ignores objects that feed no company field', () => {
    expect(
      collectCompanyCalculationReferences({
        objectNameSingular: 'workflow',
        isUpdate: false,
        before: undefined,
        after: { id: 'workflow-1' },
      }),
    ).toEqual([]);
  });

  it('reaches the company through the people and deals an open task is linked to', () => {
    expect(
      collectCompanyCalculationReferences({
        objectNameSingular: 'taskTarget',
        isUpdate: false,
        before: undefined,
        after: { targetPersonId: 'person-1', targetOpportunityId: 'deal-1' },
      }),
    ).toEqual(['person:person-1', 'opportunity:deal-1']);
  });

  it('recomputes when a task due date moves', () => {
    expect(
      collectCompanyCalculationReferences({
        objectNameSingular: 'task',
        isUpdate: true,
        before: { id: 'task-1', dueAt: '2026-11-16T09:00:00.000Z' },
        after: { id: 'task-1', dueAt: '2026-11-18T09:00:00.000Z' },
      }),
    ).toEqual(['task:task-1', 'task:task-1']);
  });
});
