import { countRoboostImportAssociations } from '@/roboost-app/data-transfer/utils/countRoboostImportAssociations';
import { isRoboostNewlyCreatedRecord } from '@/roboost-app/data-transfer/utils/isRoboostNewlyCreatedRecord';

describe('isRoboostNewlyCreatedRecord', () => {
  it('tells new records from matched ones by their timestamps', () => {
    expect(
      isRoboostNewlyCreatedRecord({
        createdAt: '2026-11-24T10:00:00.000Z',
        updatedAt: '2026-11-24T10:00:00.400Z',
      }),
    ).toBe(true);
    expect(
      isRoboostNewlyCreatedRecord({
        createdAt: '2026-10-01T10:00:00.000Z',
        updatedAt: '2026-11-24T10:00:00.000Z',
      }),
    ).toBe(false);
  });
});

describe('countRoboostImportAssociations', () => {
  it('counts filled relation columns', () => {
    expect(
      countRoboostImportAssociations([
        { id: 'r1', companyId: 'c1', name: 'A' },
        { companyId: '', accountOwnerId: 'm1' },
      ]),
    ).toBe(2);
  });
});
