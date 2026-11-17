import { parseCsvRows } from 'src/modules/workspace-member-pre-create/utils/parse-csv.util';
import { planWorkspaceMemberPreCreation } from 'src/modules/workspace-member-pre-create/utils/plan-workspace-member-pre-creation.util';

const CSV = [
  'Name,Email,twenty_status,team',
  'Sara Ali Hassan,Sara@Roboost.app,Active,Sales',
  '"Omar ""O"" Nabil",omar@roboost.app,deactivated,Ops',
  'Skipped Person,skip@roboost.app,Skip,Ops',
  'No Email,,Active,Ops',
  'Sara Again,sara@roboost.app ,Deactivated,Sales',
  'Mona Adel,mona@roboost.app,DEACTIVATED,Ops',
  'Mona Adel,mona@roboost.app,Active,Ops',
  'Already Here,existing@roboost.app,Active,Ops',
].join('\r\n');

describe('planWorkspaceMemberPreCreation', () => {
  it('skips, dedupes and leaves existing members alone', () => {
    const plan = planWorkspaceMemberPreCreation({
      rows: parseCsvRows(CSV),
      existingWorkspaceMemberEmails: new Set(['Existing@Roboost.app']),
    });

    expect(plan.toCreate).toEqual([
      {
        email: 'sara@roboost.app',
        firstName: 'Sara',
        lastName: 'Ali Hassan',
        memberStatus: 'ACTIVE',
      },
      {
        email: 'omar@roboost.app',
        firstName: 'Omar',
        lastName: '"O" Nabil',
        memberStatus: 'DEACTIVATED',
      },
      {
        email: 'mona@roboost.app',
        firstName: 'Mona',
        lastName: 'Adel',
        memberStatus: 'ACTIVE',
      },
    ]);
    expect(plan.existingEmails).toEqual(['existing@roboost.app']);
    expect(plan.skippedRowCount).toBe(2);
    expect(plan.statusConflictEmails).toEqual([
      'sara@roboost.app',
      'mona@roboost.app',
    ]);
  });

  it('reads the status column when twenty_status is absent', () => {
    const plan = planWorkspaceMemberPreCreation({
      rows: parseCsvRows(
        'name,email,status\nLina,lina@roboost.app,Deactivated',
      ),
      existingWorkspaceMemberEmails: new Set(),
    });

    expect(plan.toCreate).toEqual([
      {
        email: 'lina@roboost.app',
        firstName: 'Lina',
        lastName: '',
        memberStatus: 'DEACTIVATED',
      },
    ]);
  });

  it('creates nothing on a second run once the members exist', () => {
    const rows = parseCsvRows(CSV);
    const firstRun = planWorkspaceMemberPreCreation({
      rows,
      existingWorkspaceMemberEmails: new Set(['existing@roboost.app']),
    });

    const secondRun = planWorkspaceMemberPreCreation({
      rows,
      existingWorkspaceMemberEmails: new Set([
        'existing@roboost.app',
        ...firstRun.toCreate.map(({ email }) => email),
      ]),
    });

    expect(secondRun.toCreate).toEqual([]);
    expect(secondRun.existingEmails).toHaveLength(4);
  });
});
