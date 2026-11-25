import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';

import { DataSource } from 'typeorm';

const LOAD_MODE_KEY = 'ROBOOST_LOAD_MODE';
const CACHE_TTL_MS = 10_000;

// Bulk migration loads switch this on so per-record side effects (notifications, workflows,
// score recalculation, the duplicate scan) wait for one pass at the end
@Injectable()
export class RoboostLoadModeService {
  private readonly cache = new Map<
    string,
    { isOn: boolean; expiresAt: number }
  >();

  constructor(
    @InjectDataSource()
    private readonly coreDataSource: DataSource,
  ) {}

  async isOn(workspaceId: string): Promise<boolean> {
    const cached = this.cache.get(workspaceId);

    if (cached !== undefined && cached.expiresAt > Date.now()) {
      return cached.isOn;
    }

    const rows: { value: unknown }[] = await this.coreDataSource.query(
      `SELECT value FROM core."keyValuePair" WHERE "workspaceId" = $1 AND "userId" IS NULL AND key = $2 AND "deletedAt" IS NULL`,
      [workspaceId, LOAD_MODE_KEY],
    );
    const isOn = rows.some((row) => row.value === true);

    this.cache.set(workspaceId, { isOn, expiresAt: Date.now() + CACHE_TTL_MS });

    return isOn;
  }

  async set(workspaceId: string, isOn: boolean): Promise<void> {
    await this.coreDataSource.query(
      `DELETE FROM core."keyValuePair" WHERE "workspaceId" = $1 AND "userId" IS NULL AND key = $2`,
      [workspaceId, LOAD_MODE_KEY],
    );

    if (isOn) {
      await this.coreDataSource.query(
        `INSERT INTO core."keyValuePair" ("workspaceId", "userId", key, value, type) VALUES ($1, NULL, $2, 'true'::jsonb, 'CONFIG_VARIABLE')`,
        [workspaceId, LOAD_MODE_KEY],
      );
    }

    this.cache.delete(workspaceId);
  }
}
