import { ASSIGNED_DATE_TRACKING_CONFIGS } from 'src/modules/assigned-date-tracking/constants/assigned-date-tracking-configs.constant';
import { computeAssignedDateUpdates } from 'src/modules/assigned-date-tracking/utils/compute-assigned-date-updates.util';
import { isImportWrite } from 'src/modules/assigned-date-tracking/utils/is-import-write.util';

const CHANGED_AT = '2026-11-15T10:00:00.000Z';
const MEMBER_A = '11111111-1111-4111-8111-111111111111';
const MEMBER_B = '22222222-2222-4222-8222-222222222222';

const PERSON_CONFIGS = ASSIGNED_DATE_TRACKING_CONFIGS.filter(
  ({ objectNameSingular }) => objectNameSingular === 'person',
);
const COMPANY_CONFIGS = ASSIGNED_DATE_TRACKING_CONFIGS.filter(
  ({ objectNameSingular }) => objectNameSingular === 'company',
);
const OPPORTUNITY_CONFIGS = ASSIGNED_DATE_TRACKING_CONFIGS.filter(
  ({ objectNameSingular }) => objectNameSingular === 'opportunity',
);

const compute = (
  args: Partial<Parameters<typeof computeAssignedDateUpdates>[0]>,
) =>
  computeAssignedDateUpdates({
    configs: PERSON_CONFIGS,
    before: undefined,
    after: undefined,
    isUpdate: true,
    isImport: false,
    changedAt: CHANGED_AT,
    ...args,
  });

describe('computeAssignedDateUpdates', () => {
  it('stamps the date when an owner is set', () => {
    expect(
      compute({
        before: { contactOwnerId: null },
        after: { contactOwnerId: MEMBER_A },
      }),
    ).toEqual({ ownerAssignedDate: CHANGED_AT });
  });

  it('stamps the dates when a record is created with owners', () => {
    expect(
      compute({
        isUpdate: false,
        after: { contactOwnerId: MEMBER_A, contactSdrOwnerId: MEMBER_B },
      }),
    ).toEqual({
      ownerAssignedDate: CHANGED_AT,
      sdrOwnerAssignedDate: CHANGED_AT,
    });
  });

  it('stamps the date again every time the owner changes', () => {
    expect(
      compute({
        before: { contactSdrOwnerId: MEMBER_A },
        after: { contactSdrOwnerId: MEMBER_B },
      }),
    ).toEqual({ sdrOwnerAssignedDate: CHANGED_AT });
  });

  it('keeps the date when the owner is cleared', () => {
    expect(
      compute({
        before: { contactOwnerId: MEMBER_A },
        after: { contactOwnerId: null },
      }),
    ).toEqual({});
  });

  it('leaves the date alone when another field changes', () => {
    expect(
      compute({
        before: { contactOwnerId: MEMBER_A, jobTitle: 'CEO' },
        after: { contactOwnerId: MEMBER_A, jobTitle: 'COO' },
      }),
    ).toEqual({});
  });

  it('skips import writes', () => {
    const after = {
      contactOwnerId: MEMBER_A,
      createdBy: { source: 'IMPORT' },
    };

    expect(
      compute({
        isUpdate: false,
        after,
        isImport: isImportWrite(after, false),
      }),
    ).toEqual({});
  });

  it('dates company owner and SDR owner changes', () => {
    expect(
      compute({
        configs: COMPANY_CONFIGS,
        before: { accountOwnerId: MEMBER_A, sdrOwnerId: null },
        after: { accountOwnerId: MEMBER_B, sdrOwnerId: MEMBER_A },
      }),
    ).toEqual({
      ownerAssignedDate: CHANGED_AT,
      sdrOwnerAssignedDate: CHANGED_AT,
    });
  });

  describe('deal owner', () => {
    const computeForDeal = (
      args: Partial<Parameters<typeof computeAssignedDateUpdates>[0]>,
    ) => compute({ configs: OPPORTUNITY_CONFIGS, ...args });

    it('stamps the date when a deal owner is set, then again when it changes', () => {
      expect(
        computeForDeal({
          before: { ownerId: null },
          after: { ownerId: MEMBER_A },
        }),
      ).toEqual({ ownerAssignedDate: CHANGED_AT });
      expect(
        computeForDeal({
          before: { ownerId: MEMBER_A },
          after: { ownerId: MEMBER_B },
        }),
      ).toEqual({ ownerAssignedDate: CHANGED_AT });
    });

    it('keeps the date when the deal owner is cleared or left as is', () => {
      expect(
        computeForDeal({
          before: { ownerId: MEMBER_A },
          after: { ownerId: null },
        }),
      ).toEqual({});
      expect(
        computeForDeal({
          before: { ownerId: MEMBER_A, name: 'Old' },
          after: { ownerId: MEMBER_A, name: 'New' },
        }),
      ).toEqual({});
    });

    it('skips imported deals', () => {
      expect(
        computeForDeal({
          isUpdate: false,
          isImport: true,
          after: { ownerId: MEMBER_A },
        }),
      ).toEqual({});
    });
  });
});

describe('isImportWrite', () => {
  it('reads the creator on a create and the editor on an update', () => {
    const record = {
      createdBy: { source: 'IMPORT' },
      updatedBy: { source: 'MANUAL' },
    };

    expect(isImportWrite(record, false)).toBe(true);
    expect(isImportWrite(record, true)).toBe(false);
  });
});
