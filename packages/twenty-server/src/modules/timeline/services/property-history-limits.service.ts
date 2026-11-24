import { Injectable } from '@nestjs/common';

import { isDefined } from 'twenty-shared/utils';

import { UserVarsService } from 'src/engine/core-modules/user/user-vars/services/user-vars.service';
import {
  PROPERTY_HISTORY_LIMITS_KEY,
  type PropertyHistoryLimits,
} from 'src/modules/timeline/constants/property-history-limits.constant';
import { parsePropertyHistoryLimits } from 'src/modules/timeline/utils/get-property-history-limit.util';

// Every field change asks for the limits, so a short cache keeps that off the database
const CACHE_TTL_MS = 60_000;

@Injectable()
export class PropertyHistoryLimitsService {
  private readonly cache = new Map<
    string,
    { limits: PropertyHistoryLimits; expiresAt: number }
  >();

  constructor(private readonly userVarsService: UserVarsService) {}

  async getLimits(workspaceId: string): Promise<PropertyHistoryLimits> {
    const cached = this.cache.get(workspaceId);

    if (isDefined(cached) && cached.expiresAt > Date.now()) {
      return cached.limits;
    }

    const limits = parsePropertyHistoryLimits(
      await this.userVarsService.get({
        workspaceId,
        key: PROPERTY_HISTORY_LIMITS_KEY,
      }),
    );

    this.cache.set(workspaceId, {
      limits,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });

    return limits;
  }
}
