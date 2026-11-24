import { type DataSource } from 'typeorm';

import { DealStageHistoryService } from 'src/modules/deal-stage-history/services/deal-stage-history.service';

const WORKSPACE_ID = '20202020-1c25-4d02-bf25-6aeccf7ea419';
const ENTERED_KICK_OFF_AT = '2026-11-01T00:00:00.000Z';
const MOVED_AT = '2026-11-10T00:00:00.000Z';

const SERVICE_COLUMNS = [
  'id',
  'stage',
  'dateEnteredOnboardingKickOff',
  'dateExitedOnboardingKickOff',
  'dateEnteredOnboardingLive',
  'dateExitedOnboardingLive',
];

const buildService = () => {
  const query = jest.fn(async (sql: string) => {
    if (sql.includes('to_regclass')) {
      return [{ exists: true }];
    }

    if (sql.includes('information_schema.columns')) {
      return SERVICE_COLUMNS.map((column_name) => ({ column_name }));
    }

    if (sql.startsWith('SELECT') && sql.includes('."service"')) {
      return [
        {
          id: 'service-record',
          stage: 'ONBOARDING_LIVE',
          dateEnteredOnboardingKickOff: new Date(ENTERED_KICK_OFF_AT),
          dateExitedOnboardingKickOff: null,
          dateEnteredOnboardingLive: null,
          dateExitedOnboardingLive: null,
        },
      ];
    }

    return [];
  });

  return {
    service: new DealStageHistoryService(
      { query } as unknown as DataSource,
      { recordCalculatedFieldChanges: jest.fn() } as never,
    ),
    query,
  };
};

describe('DealStageHistoryService on services', () => {
  it('records a move in the service history and dates the stages it left and entered', async () => {
    const { service, query } = buildService();

    await service.recordStageChanges({
      workspaceId: WORKSPACE_ID,
      objectNameSingular: 'service',
      changes: [
        {
          recordId: 'service-record',
          pipeline: 'ONBOARDING_PIPELINE',
          fromStage: 'ONBOARDING_KICK_OFF',
          toStage: 'ONBOARDING_LIVE',
          changedAt: MOVED_AT,
          changedBy: {
            source: 'MANUAL',
            name: 'Ana',
            workspaceMemberId: null,
          },
        },
      ],
    });

    const [insertSql, insertParameters] = query.mock.calls.find(([sql]) =>
      sql.includes('INSERT INTO'),
    ) as unknown as [string, unknown[]];

    expect(insertSql).toContain('."serviceStageHistory"');
    expect(insertSql).toContain('"serviceId"');
    expect(insertParameters.slice(0, 4)).toEqual([
      'service-record',
      'ONBOARDING_PIPELINE',
      'ONBOARDING_KICK_OFF',
      'ONBOARDING_LIVE',
    ]);

    const [updateSql, updateParameters] = query.mock.calls.find(([sql]) =>
      sql.includes('UPDATE'),
    ) as unknown as [string, unknown[]];

    expect(updateSql).toContain('."service" SET');
    expect(updateSql).not.toContain('CurrentStage');

    const assignedColumns = [...updateSql.matchAll(/"(\w+)" = \$/g)].map(
      ([, column]) => column,
    );
    const valueByColumn = Object.fromEntries(
      assignedColumns.map((column, index) => [
        column,
        updateParameters[index + 1],
      ]),
    );

    expect(valueByColumn).toEqual({
      dateExitedOnboardingKickOff: MOVED_AT,
      dateEnteredOnboardingLive: MOVED_AT,
    });
  });

  it('skips the write when the service history table does not exist yet', async () => {
    const { service, query } = buildService();

    query.mockImplementation(async (sql: string) =>
      sql.includes('to_regclass') ? [{ exists: false }] : [],
    );

    await service.recordStageChanges({
      workspaceId: WORKSPACE_ID,
      objectNameSingular: 'service',
      changes: [
        {
          recordId: 'service-record',
          pipeline: 'ONBOARDING_PIPELINE',
          fromStage: null,
          toStage: 'ONBOARDING_KICK_OFF',
          changedAt: MOVED_AT,
          changedBy: { source: 'API', name: 'API', workspaceMemberId: null },
        },
      ],
    });

    expect(query).toHaveBeenCalledTimes(1);
  });
});
