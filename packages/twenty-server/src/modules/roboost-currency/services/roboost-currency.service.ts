import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';

import { isNonEmptyString } from '@sniptt/guards';
import { ROBOOST_ALL_CURRENCY_CODES } from 'twenty-shared/constants';
import { getRoboostCurrencyDetails, isDefined } from 'twenty-shared/utils';
import { DataSource } from 'typeorm';

import { type EncryptedString } from 'src/engine/core-modules/secret-encryption/branded-strings/encrypted-string.type';
import { type PlaintextString } from 'src/engine/core-modules/secret-encryption/branded-strings/plaintext-string.type';
import { SecretEncryptionService } from 'src/engine/core-modules/secret-encryption/secret-encryption.service';
import { getWorkspaceSchemaName } from 'src/engine/workspace-datasource/utils/get-workspace-schema-name.util';
import { RoboostCurrencyHooksService } from 'src/modules/roboost-currency/services/roboost-currency-hooks.service';
import {
  type ExchangeRateFetchResult,
  RoboostExchangeRateProviderService,
} from 'src/modules/roboost-currency/services/roboost-exchange-rate-provider.service';
import {
  computeNextUpdateDate,
  isUpdateDue,
  ROBOOST_RATE_FREQUENCIES,
  type RoboostRateFrequency,
} from 'src/modules/roboost-currency/utils/roboost-rate-schedule.util';

export type RoboostRateSource = 'AUTOMATIC' | 'MANUAL' | 'IMPORT';

export type RoboostCurrencyRow = {
  code: string;
  name: string;
  symbol: string;
  decimals: number;
  isCompanyCurrency: boolean;
  isArchived: boolean;
  rate: number;
  rateDate: string | null;
  rateSource: RoboostRateSource | null;
  setByName: string | null;
  addedAt: string;
  addedByName: string | null;
};

export type RoboostAutoUpdateSettings = {
  enabled: boolean;
  frequency: RoboostRateFrequency;
};

export type RoboostLastRun = {
  at: string;
  status: 'COMPLETED' | 'FAILED' | 'NOT_DUE' | 'DISABLED' | 'NO_APP_ID';
  message: string | null;
  missingCodes: string[];
  attempts: number;
};

export type RoboostRateLogEntry = {
  rate: number;
  effectiveDate: string;
  source: RoboostRateSource;
  setByName: string | null;
  createdAt: string;
};

const RATE_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MAX_RATE = 1e12;
const RETRY_DELAYS_MS = [10_000, 30_000, 60_000];

const toIsoDate = (value: unknown) =>
  value instanceof Date
    ? value.toISOString().slice(0, 10)
    : String(value).slice(0, 10);

const todayUtc = () => new Date().toISOString().slice(0, 10);

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Currencies, dated exchange rates (1 unit = rate x company currency) and the automatic update settings
@Injectable()
export class RoboostCurrencyService {
  private readonly logger = new Logger(RoboostCurrencyService.name);

  constructor(
    @InjectDataSource()
    private readonly coreDataSource: DataSource,
    private readonly secretEncryptionService: SecretEncryptionService,
    private readonly exchangeRateProviderService: RoboostExchangeRateProviderService,
    private readonly roboostCurrencyHooksService: RoboostCurrencyHooksService,
  ) {}

  private schema(workspaceId: string) {
    return `"${getWorkspaceSchemaName(workspaceId)}"`;
  }

  async tablesExist(workspaceId: string): Promise<boolean> {
    const [row]: { exists: boolean }[] = await this.coreDataSource.query(
      `SELECT to_regclass($1) IS NOT NULL AS exists`,
      [`${this.schema(workspaceId)}."roboostCurrency"`],
    );

    return row?.exists === true;
  }

  // ---------- access ----------
  async getMember(workspaceId: string, workspaceMemberId: string) {
    const [member]: { name: string }[] = await this.coreDataSource.query(
      `SELECT trim(coalesce("nameFirstName", '') || ' ' || coalesce("nameLastName", '')) AS name
      FROM ${this.schema(workspaceId)}."workspaceMember" WHERE id = $1`,
      [workspaceMemberId],
    );

    return { name: member?.name || 'A member' };
  }

  async isAdmin(workspaceId: string, workspaceMemberId: string | undefined) {
    if (!isDefined(workspaceMemberId)) {
      return false;
    }
    const rows: { id: string }[] = await this.coreDataSource.query(
      `SELECT wm.id FROM ${this.schema(workspaceId)}."workspaceMember" wm
      JOIN core."userWorkspace" uw ON uw."userId" = wm."userId" AND uw."workspaceId" = $1
      JOIN core."roleTarget" rt ON rt."userWorkspaceId" = uw.id
      JOIN core."role" r ON r.id = rt."roleId"
      WHERE r.label = 'Admin' AND wm.id = $2 AND wm."deletedAt" IS NULL`,
      [workspaceId, workspaceMemberId],
    );

    return rows.length > 0;
  }

  async assertAdmin(
    workspaceId: string,
    workspaceMemberId: string | undefined,
  ) {
    if (!(await this.isAdmin(workspaceId, workspaceMemberId))) {
      throw new ForbiddenException('Only admins can change currencies');
    }
  }

  // ---------- reading ----------
  async getCompanyCurrency(workspaceId: string): Promise<string> {
    const [row]: { code: string }[] = await this.coreDataSource.query(
      `SELECT code FROM ${this.schema(workspaceId)}."roboostCurrency" WHERE "isCompanyCurrency" LIMIT 1`,
    );

    return row?.code ?? 'USD';
  }

  // The rate effective on a date: the latest one on or before it, a manual rate winning on its own day
  async getRate(
    workspaceId: string,
    code: string,
    date: string = todayUtc(),
  ): Promise<number | null> {
    const companyCurrency = await this.getCompanyCurrency(workspaceId);

    if (code === companyCurrency) {
      return 1;
    }
    const [row]: { rate: string }[] = await this.coreDataSource.query(
      `SELECT rate FROM ${this.schema(workspaceId)}."roboostExchangeRate"
      WHERE "currencyCode" = $1 AND "effectiveDate" <= $2
      ORDER BY "effectiveDate" DESC, (source = 'MANUAL') DESC, "createdAt" DESC LIMIT 1`,
      [code, date],
    );

    if (isDefined(row)) {
      return Number(row.rate);
    }
    // Nothing that early: the oldest known rate is the best guess
    const [oldest]: { rate: string }[] = await this.coreDataSource.query(
      `SELECT rate FROM ${this.schema(workspaceId)}."roboostExchangeRate"
      WHERE "currencyCode" = $1 ORDER BY "effectiveDate" ASC, (source = 'MANUAL') DESC LIMIT 1`,
      [code],
    );

    return isDefined(oldest) ? Number(oldest.rate) : null;
  }

  async listCurrencies(workspaceId: string): Promise<RoboostCurrencyRow[]> {
    const rows: {
      code: string;
      isCompanyCurrency: boolean;
      archivedAt: Date | null;
      addedByName: string | null;
      createdAt: Date;
      rate: string | null;
      effectiveDate: Date | null;
      source: RoboostRateSource | null;
      setByName: string | null;
    }[] = await this.coreDataSource.query(
      `SELECT c.code, c."isCompanyCurrency", c."archivedAt", c."addedByName", c."createdAt",
        r.rate, r."effectiveDate", r.source, r."setByName"
      FROM ${this.schema(workspaceId)}."roboostCurrency" c
      LEFT JOIN LATERAL (
        SELECT rate, "effectiveDate", source, "setByName" FROM ${this.schema(workspaceId)}."roboostExchangeRate" x
        WHERE x."currencyCode" = c.code AND x."effectiveDate" <= current_date
        ORDER BY "effectiveDate" DESC, (source = 'MANUAL') DESC, "createdAt" DESC LIMIT 1
      ) r ON true
      ORDER BY c."isCompanyCurrency" DESC, c."archivedAt" IS NOT NULL, c."createdAt", c.code`,
    );

    return rows.map((row) => {
      const details = getRoboostCurrencyDetails(row.code);

      return {
        ...details,
        isCompanyCurrency: row.isCompanyCurrency,
        isArchived: isDefined(row.archivedAt),
        rate: row.isCompanyCurrency ? 1 : Number(row.rate ?? 0),
        rateDate: isDefined(row.effectiveDate)
          ? toIsoDate(row.effectiveDate)
          : null,
        rateSource: row.isCompanyCurrency ? null : row.source,
        setByName: row.isCompanyCurrency ? row.addedByName : row.setByName,
        addedAt: new Date(row.createdAt).toISOString(),
        addedByName: row.addedByName,
      };
    });
  }

  async listActiveCodes(workspaceId: string): Promise<string[]> {
    return (await this.listCurrencies(workspaceId))
      .filter(({ isArchived }) => !isArchived)
      .map(({ code }) => code);
  }

  async getRateLog(
    workspaceId: string,
    code: string,
    date: string | null,
  ): Promise<{
    effective: RoboostRateLogEntry | null;
    history: RoboostRateLogEntry[];
  }> {
    this.assertCurrencyCode(code);
    const rows: {
      rate: string;
      effectiveDate: Date;
      source: RoboostRateSource;
      setByName: string | null;
      createdAt: Date;
    }[] = await this.coreDataSource.query(
      `SELECT rate, "effectiveDate", source, "setByName", "createdAt"
      FROM ${this.schema(workspaceId)}."roboostExchangeRate" WHERE "currencyCode" = $1
      ORDER BY "effectiveDate" DESC, (source = 'MANUAL') DESC, "createdAt" DESC`,
      [code],
    );
    const history = rows.map((row) => ({
      rate: Number(row.rate),
      effectiveDate: toIsoDate(row.effectiveDate),
      source: row.source,
      setByName: row.setByName,
      createdAt: new Date(row.createdAt).toISOString(),
    }));
    const effective = isNonEmptyString(date)
      ? (history.find(({ effectiveDate }) => effectiveDate <= date) ?? null)
      : (history[0] ?? null);

    return { effective, history };
  }

  async getSetting<TValue>(
    workspaceId: string,
    key: string,
  ): Promise<TValue | null> {
    const [row]: { value: TValue }[] = await this.coreDataSource.query(
      `SELECT value FROM ${this.schema(workspaceId)}."roboostCurrencySetting" WHERE key = $1`,
      [key],
    );

    return row?.value ?? null;
  }

  private async setSetting(workspaceId: string, key: string, value: unknown) {
    await this.coreDataSource.query(
      `INSERT INTO ${this.schema(workspaceId)}."roboostCurrencySetting" (key, value, "updatedAt")
      VALUES ($1, $2::jsonb, now())
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, "updatedAt" = now()`,
      [key, JSON.stringify(value)],
    );
  }

  async getAutoUpdate(workspaceId: string): Promise<RoboostAutoUpdateSettings> {
    const value = await this.getSetting<Partial<RoboostAutoUpdateSettings>>(
      workspaceId,
      'autoUpdate',
    );

    return {
      enabled: value?.enabled ?? true,
      frequency: ROBOOST_RATE_FREQUENCIES.includes(
        value?.frequency as RoboostRateFrequency,
      )
        ? (value?.frequency as RoboostRateFrequency)
        : 'DAILY',
    };
  }

  async getStatus(workspaceId: string) {
    const autoUpdate = await this.getAutoUpdate(workspaceId);
    const lastRun = await this.getSetting<RoboostLastRun>(
      workspaceId,
      'lastRun',
    );
    const lastSuccess = await this.getSetting<{ at: string }>(
      workspaceId,
      'lastSuccess',
    );
    const appId = await this.getSetting<{ encrypted: string }>(
      workspaceId,
      'openExchangeRatesAppId',
    );
    const [size]: { bytes: string }[] = await this.coreDataSource.query(
      `SELECT coalesce(sum(pg_total_relation_size(c.oid)), 0) AS bytes FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = $1 AND c.relkind = 'r' AND c.relname IN
        ('roboostCurrency', 'roboostExchangeRate', 'roboostCurrencySetting', 'roboostCurrencyLog')`,
      [getWorkspaceSchemaName(workspaceId)],
    );

    return {
      autoUpdate,
      lastRun,
      lastSuccessAt: lastSuccess?.at ?? null,
      nextUpdateOn: autoUpdate.enabled
        ? computeNextUpdateDate(autoUpdate.frequency, new Date())
        : null,
      hasAppId: isDefined(appId?.encrypted),
      appIdMasked: isDefined(appId?.encrypted)
        ? this.maskAppId(workspaceId, appId.encrypted)
        : null,
      storageBytes: Number(size?.bytes ?? 0),
    };
  }

  async listLog(workspaceId: string, limit = 200) {
    const rows: {
      id: string;
      action: string;
      detail: Record<string, unknown> | null;
      actorName: string | null;
      createdAt: Date;
    }[] = await this.coreDataSource.query(
      `SELECT id, action, detail, "actorName", "createdAt" FROM ${this.schema(workspaceId)}."roboostCurrencyLog"
      ORDER BY "createdAt" DESC LIMIT $1`,
      [limit],
    );

    return rows.map((row) => ({
      id: row.id,
      action: row.action,
      detail: JSON.stringify(row.detail ?? {}),
      actorName: row.actorName,
      createdAt: new Date(row.createdAt).toISOString(),
    }));
  }

  // ---------- writing (admins) ----------
  private assertCurrencyCode(code: string) {
    if (!ROBOOST_ALL_CURRENCY_CODES.includes(code)) {
      throw new BadRequestException(`Unknown currency ${code}`);
    }
  }

  private assertRate(rate: number) {
    if (!Number.isFinite(rate) || rate <= 0 || rate > MAX_RATE) {
      throw new BadRequestException(
        'The exchange rate must be a positive number',
      );
    }
  }

  private async log(
    workspaceId: string,
    workspaceMemberId: string | null,
    actorName: string | null,
    action: string,
    detail: Record<string, unknown>,
  ) {
    await this.coreDataSource.query(
      `INSERT INTO ${this.schema(workspaceId)}."roboostCurrencyLog" (action, detail, "workspaceMemberId", "actorName")
      VALUES ($1, $2::jsonb, $3, $4)`,
      [action, JSON.stringify(detail), workspaceMemberId, actorName],
    );
  }

  async addCurrency(
    workspaceId: string,
    workspaceMemberId: string,
    code: string,
    rate: number,
  ) {
    await this.assertAdmin(workspaceId, workspaceMemberId);
    this.assertCurrencyCode(code);
    this.assertRate(rate);
    const { name } = await this.getMember(workspaceId, workspaceMemberId);
    const [existing]: { archivedAt: Date | null }[] =
      await this.coreDataSource.query(
        `SELECT "archivedAt" FROM ${this.schema(workspaceId)}."roboostCurrency" WHERE code = $1`,
        [code],
      );

    if (isDefined(existing)) {
      throw new BadRequestException(
        isDefined(existing.archivedAt)
          ? `${code} is archived: unarchive it instead`
          : `${code} is already added`,
      );
    }
    await this.coreDataSource.query(
      `INSERT INTO ${this.schema(workspaceId)}."roboostCurrency" (code, "addedByWorkspaceMemberId", "addedByName")
      VALUES ($1, $2, $3)`,
      [code, workspaceMemberId, name],
    );
    await this.insertRate(workspaceId, code, rate, todayUtc(), 'MANUAL', {
      workspaceMemberId,
      name,
    });
    await this.log(workspaceId, workspaceMemberId, name, 'CURRENCY_ADDED', {
      code,
      rate,
    });
    await this.roboostCurrencyHooksService.currenciesChanged(workspaceId);
    await this.roboostCurrencyHooksService.ratesChanged(workspaceId);
  }

  async setManualRate(
    workspaceId: string,
    workspaceMemberId: string,
    code: string,
    rate: number,
    effectiveDate: string,
  ) {
    await this.assertAdmin(workspaceId, workspaceMemberId);
    this.assertRate(rate);

    if (!RATE_DATE_PATTERN.test(effectiveDate)) {
      throw new BadRequestException('The effective date must be YYYY-MM-DD');
    }
    if ((await this.getCompanyCurrency(workspaceId)) === code) {
      throw new BadRequestException('The company currency is always 1');
    }
    await this.assertKnownCurrency(workspaceId, code);
    const { name } = await this.getMember(workspaceId, workspaceMemberId);

    await this.insertRate(workspaceId, code, rate, effectiveDate, 'MANUAL', {
      workspaceMemberId,
      name,
    });
    await this.log(workspaceId, workspaceMemberId, name, 'RATE_SET', {
      code,
      rate,
      effectiveDate,
    });
    await this.roboostCurrencyHooksService.ratesChanged(workspaceId);
  }

  async setArchived(
    workspaceId: string,
    workspaceMemberId: string,
    code: string,
    isArchived: boolean,
  ) {
    await this.assertAdmin(workspaceId, workspaceMemberId);
    await this.assertKnownCurrency(workspaceId, code);

    if (isArchived && (await this.getCompanyCurrency(workspaceId)) === code) {
      throw new BadRequestException('The company currency cannot be archived');
    }
    const { name } = await this.getMember(workspaceId, workspaceMemberId);

    await this.coreDataSource.query(
      `UPDATE ${this.schema(workspaceId)}."roboostCurrency" SET "archivedAt" = ${isArchived ? 'now()' : 'NULL'} WHERE code = $1`,
      [code],
    );
    await this.log(
      workspaceId,
      workspaceMemberId,
      name,
      isArchived ? 'CURRENCY_ARCHIVED' : 'CURRENCY_UNARCHIVED',
      { code },
    );
    await this.roboostCurrencyHooksService.currenciesChanged(workspaceId);
  }

  // Rates are kept relative to the company currency, so every stored rate is re-based on the new one
  async changeCompanyCurrency(
    workspaceId: string,
    workspaceMemberId: string,
    code: string,
  ) {
    await this.assertAdmin(workspaceId, workspaceMemberId);
    await this.assertKnownCurrency(workspaceId, code);
    const previous = await this.getCompanyCurrency(workspaceId);

    if (previous === code) {
      return;
    }
    const { name } = await this.getMember(workspaceId, workspaceMemberId);
    const schema = this.schema(workspaceId);

    await this.coreDataSource.transaction(async (manager) => {
      const dates: { effectiveDate: Date }[] = await manager.query(
        `SELECT DISTINCT "effectiveDate" FROM ${schema}."roboostExchangeRate" ORDER BY 1`,
      );

      for (const { effectiveDate } of dates) {
        const date = toIsoDate(effectiveDate);
        const [base]: { rate: string }[] = await manager.query(
          `SELECT rate FROM ${schema}."roboostExchangeRate" WHERE "currencyCode" = $1 AND "effectiveDate" <= $2
          ORDER BY "effectiveDate" DESC, (source = 'MANUAL') DESC, "createdAt" DESC LIMIT 1`,
          [code, date],
        );

        if (!isDefined(base)) {
          continue;
        }
        const factor = Number(base.rate);

        await manager.query(
          `UPDATE ${schema}."roboostExchangeRate" SET rate = rate / $1
          WHERE "effectiveDate" = $2 AND "currencyCode" <> $3`,
          [factor, date, code],
        );
        await manager.query(
          `INSERT INTO ${schema}."roboostExchangeRate" ("currencyCode", rate, "effectiveDate", source, "setByWorkspaceMemberId", "setByName")
          VALUES ($1, $2, $3, 'MANUAL', $4, $5)`,
          [previous, 1 / factor, date, workspaceMemberId, name],
        );
      }
      await manager.query(
        `DELETE FROM ${schema}."roboostExchangeRate" WHERE "currencyCode" = $1`,
        [code],
      );
      await manager.query(
        `UPDATE ${schema}."roboostCurrency" SET "isCompanyCurrency" = (code = $1)`,
        [code],
      );
    });
    await this.log(
      workspaceId,
      workspaceMemberId,
      name,
      'COMPANY_CURRENCY_CHANGED',
      {
        from: previous,
        to: code,
      },
    );
    await this.roboostCurrencyHooksService.currenciesChanged(workspaceId);
    await this.roboostCurrencyHooksService.ratesChanged(workspaceId, {
      includeClosed: true,
    });
  }

  async setAutoUpdate(
    workspaceId: string,
    workspaceMemberId: string,
    settings: RoboostAutoUpdateSettings,
  ) {
    await this.assertAdmin(workspaceId, workspaceMemberId);

    if (!ROBOOST_RATE_FREQUENCIES.includes(settings.frequency)) {
      throw new BadRequestException('Unknown update frequency');
    }
    const previous = await this.getAutoUpdate(workspaceId);
    const { name } = await this.getMember(workspaceId, workspaceMemberId);

    await this.setSetting(workspaceId, 'autoUpdate', settings);
    const action =
      previous.enabled !== settings.enabled
        ? settings.enabled
          ? 'AUTO_UPDATE_ON'
          : 'AUTO_UPDATE_OFF'
        : 'FREQUENCY_CHANGED';

    await this.log(workspaceId, workspaceMemberId, name, action, {
      from: previous,
      to: settings,
    });
  }

  async setAppId(
    workspaceId: string,
    workspaceMemberId: string,
    appId: string | null,
  ) {
    await this.assertAdmin(workspaceId, workspaceMemberId);
    const { name } = await this.getMember(workspaceId, workspaceMemberId);
    const trimmed = (appId ?? '').trim();

    if (trimmed === '') {
      await this.coreDataSource.query(
        `DELETE FROM ${this.schema(workspaceId)}."roboostCurrencySetting" WHERE key = 'openExchangeRatesAppId'`,
      );
      await this.log(
        workspaceId,
        workspaceMemberId,
        name,
        'APP_ID_REMOVED',
        {},
      );

      return;
    }
    if (!/^[A-Za-z0-9]{16,64}$/.test(trimmed)) {
      throw new BadRequestException(
        'That does not look like an Open Exchange Rates App ID',
      );
    }
    const encrypted = this.secretEncryptionService.encryptVersioned(
      trimmed as PlaintextString,
      { workspaceId },
    );

    await this.setSetting(workspaceId, 'openExchangeRatesAppId', {
      encrypted,
    });
    await this.log(workspaceId, workspaceMemberId, name, 'APP_ID_SET', {});
  }

  private async readAppId(workspaceId: string): Promise<string | null> {
    const value = await this.getSetting<{ encrypted: string }>(
      workspaceId,
      'openExchangeRatesAppId',
    );

    if (!isDefined(value?.encrypted)) {
      return null;
    }

    return this.secretEncryptionService.decryptVersionedOrThrow(
      value.encrypted as EncryptedString,
      { workspaceId },
    );
  }

  private maskAppId(workspaceId: string, encrypted: string) {
    try {
      const plain = this.secretEncryptionService.decryptVersionedOrThrow(
        encrypted as EncryptedString,
        { workspaceId },
      );

      return `${'•'.repeat(8)}${plain.slice(-4)}`;
    } catch {
      return '••••••••';
    }
  }

  async testConnection(workspaceId: string, workspaceMemberId: string) {
    await this.assertAdmin(workspaceId, workspaceMemberId);
    const appId = await this.readAppId(workspaceId);

    if (!isDefined(appId)) {
      return { ok: false, message: 'No App ID saved yet', currencies: 0 };
    }
    const result = await this.exchangeRateProviderService.fetchLatest(appId);

    return result.ok
      ? {
          ok: true,
          message: `Connected: ${Object.keys(result.rates).length} currencies, rates from ${result.timestamp}`,
          currencies: Object.keys(result.rates).length,
        }
      : { ok: false, message: result.error, currencies: 0 };
  }

  private async insertRate(
    workspaceId: string,
    code: string,
    rate: number,
    effectiveDate: string,
    source: RoboostRateSource,
    by: { workspaceMemberId: string | null; name: string | null },
  ) {
    await this.coreDataSource.query(
      `INSERT INTO ${this.schema(workspaceId)}."roboostExchangeRate"
        ("currencyCode", rate, "effectiveDate", source, "setByWorkspaceMemberId", "setByName")
      VALUES ($1, $2, $3, $4, $5, $6)`,
      [code, rate, effectiveDate, source, by.workspaceMemberId, by.name],
    );
  }

  private async assertKnownCurrency(workspaceId: string, code: string) {
    const [row]: { code: string }[] = await this.coreDataSource.query(
      `SELECT code FROM ${this.schema(workspaceId)}."roboostCurrency" WHERE code = $1`,
      [code],
    );

    if (!isDefined(row)) {
      throw new BadRequestException(
        `${code} is not one of the workspace currencies`,
      );
    }
  }

  // ---------- the scheduled update ----------
  async runScheduledUpdate(
    workspaceId: string,
    {
      force = false,
      retryDelaysMs = RETRY_DELAYS_MS,
      ratesOverride,
    }: {
      force?: boolean;
      retryDelaysMs?: number[];
      // Rates per 1 USD supplied by hand instead of the provider (checks without an App ID)
      ratesOverride?: Record<string, number>;
    } = {},
  ): Promise<RoboostLastRun> {
    const autoUpdate = await this.getAutoUpdate(workspaceId);
    const lastSuccess = await this.getSetting<{ at: string }>(
      workspaceId,
      'lastSuccess',
    );
    const now = new Date();
    const finish = async (run: Omit<RoboostLastRun, 'at'>) => {
      const lastRun = { ...run, at: now.toISOString() };

      await this.setSetting(workspaceId, 'lastRun', lastRun);

      return lastRun;
    };

    if (!force && !autoUpdate.enabled) {
      return finish({
        status: 'DISABLED',
        message: null,
        missingCodes: [],
        attempts: 0,
      });
    }
    if (
      !force &&
      !isUpdateDue(
        autoUpdate.frequency,
        isDefined(lastSuccess?.at) ? new Date(lastSuccess.at) : null,
        now,
      )
    ) {
      return finish({
        status: 'NOT_DUE',
        message: null,
        missingCodes: [],
        attempts: 0,
      });
    }
    const appId = isDefined(ratesOverride)
      ? 'override'
      : await this.readAppId(workspaceId);

    if (!isDefined(appId)) {
      return finish({
        status: 'NO_APP_ID',
        message: 'No Open Exchange Rates App ID saved in Settings > Currencies',
        missingCodes: [],
        attempts: 0,
      });
    }

    let result: ExchangeRateFetchResult = {
      ok: false,
      error: 'not tried',
    };
    let attempts = 0;

    for (const delay of [0, ...retryDelaysMs]) {
      if (delay > 0) {
        await sleep(delay);
      }
      attempts += 1;
      result = isDefined(ratesOverride)
        ? { ok: true, rates: ratesOverride, timestamp: now.toISOString() }
        : await this.exchangeRateProviderService.fetchLatest(appId);

      if (result.ok) {
        break;
      }
      this.logger.warn(
        `Workspace ${workspaceId}: exchange rate fetch attempt ${attempts} failed: ${result.error}`,
      );
    }

    if (!result.ok) {
      this.logger.error(
        `Workspace ${workspaceId}: exchange rates not updated after ${attempts} attempts, the last rates stay: ${result.error}`,
      );

      return finish({
        status: 'FAILED',
        message: result.error,
        missingCodes: [],
        attempts,
      });
    }

    const saved = await this.saveFetchedRates(
      workspaceId,
      result.rates,
      toIsoDate(now),
    );

    // Every currency the provider knows, so "Add currency" can suggest a rate
    await this.setSetting(workspaceId, 'lastFetchedRates', {
      at: now.toISOString(),
      usdRates: result.rates,
    });

    await this.setSetting(workspaceId, 'lastSuccess', {
      at: now.toISOString(),
    });
    await this.roboostCurrencyHooksService.ratesChanged(workspaceId);

    return finish({
      status: 'COMPLETED',
      message: `${saved.saved} rate(s) saved`,
      missingCodes: saved.missing,
      attempts,
    });
  }

  // Provider rates are "units per 1 USD"; stored rates are "company-currency units per 1 unit"
  private async saveFetchedRates(
    workspaceId: string,
    usdRates: Record<string, number>,
    date: string,
  ) {
    const companyCurrency = await this.getCompanyCurrency(workspaceId);
    const companyPerUsd =
      companyCurrency === 'USD' ? 1 : usdRates[companyCurrency];
    const codes = (await this.listActiveCodes(workspaceId)).filter(
      (code) => code !== companyCurrency,
    );
    const missing: string[] = [];
    let saved = 0;

    if (!isDefined(companyPerUsd) || companyPerUsd <= 0) {
      return { saved, missing: codes };
    }
    for (const code of codes) {
      const perUsd = code === 'USD' ? 1 : usdRates[code];

      if (!isDefined(perUsd) || perUsd <= 0) {
        missing.push(code);
        continue;
      }
      const rate = companyPerUsd / perUsd;

      await this.coreDataSource.query(
        `DELETE FROM ${this.schema(workspaceId)}."roboostExchangeRate"
        WHERE "currencyCode" = $1 AND "effectiveDate" = $2 AND source = 'AUTOMATIC'`,
        [code, date],
      );
      await this.insertRate(workspaceId, code, rate, date, 'AUTOMATIC', {
        workspaceMemberId: null,
        name: 'Automatic update',
      });
      saved += 1;
    }

    return { saved, missing };
  }

  async getSuggestedRate(
    workspaceId: string,
    code: string,
  ): Promise<number | null> {
    const fetched = await this.getSetting<{ usdRates: Record<string, number> }>(
      workspaceId,
      'lastFetchedRates',
    );
    const companyCurrency = await this.getCompanyCurrency(workspaceId);
    const usdRates: Record<string, number> = {
      ...(fetched?.usdRates ?? {}),
      USD: 1,
    };
    const perUsd = usdRates[code];
    const companyPerUsd = usdRates[companyCurrency];

    if (!isDefined(perUsd) || !isDefined(companyPerUsd) || perUsd <= 0) {
      return null;
    }

    return companyPerUsd / perUsd;
  }

  async runNow(workspaceId: string, workspaceMemberId: string) {
    await this.assertAdmin(workspaceId, workspaceMemberId);
    const { name } = await this.getMember(workspaceId, workspaceMemberId);
    const run = await this.runScheduledUpdate(workspaceId, {
      force: true,
      retryDelaysMs: [],
    });

    await this.log(workspaceId, workspaceMemberId, name, 'UPDATE_RUN_NOW', {
      status: run.status,
    });

    return run;
  }
}
