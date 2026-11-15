import { collectPersonCalculationReferences } from 'src/modules/person-calculated-fields/utils/collect-person-calculation-references.util';

const PERSON_A = '11111111-1111-4111-8111-111111111111';
const PERSON_B = '22222222-2222-4222-8222-222222222222';
const RECORD_ID = '33333333-3333-4333-8333-333333333333';

describe('collectPersonCalculationReferences', () => {
  it('points a deal change at its old and new point of contact and its contacts', () => {
    expect(
      collectPersonCalculationReferences({
        objectNameSingular: 'opportunity',
        isUpdate: true,
        before: { id: RECORD_ID, pointOfContactId: PERSON_A },
        after: { id: RECORD_ID, pointOfContactId: PERSON_B },
      }),
    ).toEqual([
      `person:${PERSON_A}`,
      `person:${PERSON_B}`,
      `opportunity:${RECORD_ID}`,
      `opportunity:${RECORD_ID}`,
    ]);
  });

  it('ignores a deal update that cannot change the first deal date', () => {
    expect(
      collectPersonCalculationReferences({
        objectNameSingular: 'opportunity',
        isUpdate: true,
        before: { id: RECORD_ID, pointOfContactId: PERSON_A, name: 'A' },
        after: { id: RECORD_ID, pointOfContactId: PERSON_A, name: 'B' },
      }),
    ).toEqual([]);
  });

  it('points a deal contact link at its person', () => {
    expect(
      collectPersonCalculationReferences({
        objectNameSingular: 'opportunityContact',
        isUpdate: false,
        before: undefined,
        after: { id: RECORD_ID, personId: PERSON_A },
      }),
    ).toEqual([`person:${PERSON_A}`]);
  });

  it('points an activity link at the linked person only', () => {
    expect(
      collectPersonCalculationReferences({
        objectNameSingular: 'noteTarget',
        isUpdate: false,
        before: undefined,
        after: {
          id: RECORD_ID,
          targetPersonId: PERSON_A,
          targetCompanyId: PERSON_B,
        },
      }),
    ).toEqual([`person:${PERSON_A}`]);
  });

  it('refers to a deleted note so its people get recomputed', () => {
    expect(
      collectPersonCalculationReferences({
        objectNameSingular: 'note',
        isUpdate: false,
        before: { id: RECORD_ID },
        after: { id: RECORD_ID, deletedAt: '2026-11-15T10:00:00.000Z' },
      }),
    ).toEqual([`note:${RECORD_ID}`, `note:${RECORD_ID}`]);
  });

  it('ignores an activity edit that leaves its dates alone', () => {
    expect(
      collectPersonCalculationReferences({
        objectNameSingular: 'note',
        isUpdate: true,
        before: { id: RECORD_ID, title: 'A' },
        after: { id: RECORD_ID, title: 'B' },
      }),
    ).toEqual([]);
  });
});
