import { defaultRoboostRecordOwner } from 'src/engine/twenty-orm/utils/default-roboost-record-owner.util';

describe('defaultRoboostRecordOwner', () => {
  it('makes the creator the deal owner when no owner is given', () => {
    expect(
      defaultRoboostRecordOwner({
        records: [{ name: 'Deal' }],
        objectNameSingular: 'opportunity',
        workspaceMemberId: 'member-1',
      }),
    ).toEqual([{ name: 'Deal', ownerId: 'member-1' }]);
  });

  it('keeps an owner the member picked', () => {
    expect(
      defaultRoboostRecordOwner({
        records: [{ ownerId: 'member-2' }],
        objectNameSingular: 'opportunity',
        workspaceMemberId: 'member-1',
      }),
    ).toEqual([{ ownerId: 'member-2' }]);
  });

  it('counts any ownership field, like the company SDR owner', () => {
    expect(
      defaultRoboostRecordOwner({
        records: [{ sdrOwnerId: 'member-2' }],
        objectNameSingular: 'company',
        workspaceMemberId: 'member-1',
      }),
    ).toEqual([{ sdrOwnerId: 'member-2' }]);
  });

  it('leaves objects without ownership fields alone', () => {
    expect(
      defaultRoboostRecordOwner({
        records: [{ name: 'Item' }],
        objectNameSingular: 'lineItem',
        workspaceMemberId: 'member-1',
      }),
    ).toEqual([{ name: 'Item' }]);
  });
});
