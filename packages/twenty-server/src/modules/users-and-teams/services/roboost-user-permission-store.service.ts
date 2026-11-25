import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';

import {
  type RoboostUserPermissions,
  type RoboostUserRole,
} from 'twenty-shared/types';
import { isDefined, normalizeRoboostPermissions } from 'twenty-shared/utils';
import { DataSource } from 'typeorm';

import { getWorkspaceSchemaName } from 'src/engine/workspace-datasource/utils/get-workspace-schema-name.util';

export type RoboostUserPermissionRow = {
  workspaceMemberId: string;
  roleId: string | null;
  permissions: RoboostUserPermissions;
  desiredRole: RoboostUserRole;
  updatedAt: string;
};

export type RoboostPendingInviteRow = {
  email: string;
  role: RoboostUserRole;
  permissions: RoboostUserPermissions;
  copiedFromWorkspaceMemberId: string | null;
  invitedAt: string;
};

export type RoboostPermissionHistoryKind =
  | 'PERMISSION'
  | 'ROLE'
  | 'TEAM'
  | 'COPY'
  | 'INVITE'
  | 'STATUS';

export type RoboostPermissionHistoryEntry = {
  id: string;
  createdAt: string;
  actorWorkspaceMemberId: string | null;
  actorName: string | null;
  targetWorkspaceMemberId: string | null;
  targetLabel: string;
  kind: RoboostPermissionHistoryKind;
  setting: string;
  fromValue: string | null;
  toValue: string | null;
};

export type RoboostPermissionHistoryWrite = Omit<
  RoboostPermissionHistoryEntry,
  'id' | 'createdAt'
>;

type RawRow = Record<string, unknown>;

const toIso = (value: unknown) => new Date(value as string).toISOString();

@Injectable()
export class RoboostUserPermissionStoreService {
  constructor(
    @InjectDataSource()
    private readonly coreDataSource: DataSource,
  ) {}

  schema(workspaceId: string) {
    return `"${getWorkspaceSchemaName(workspaceId)}"`;
  }

  async listUserPermissions(
    workspaceId: string,
  ): Promise<RoboostUserPermissionRow[]> {
    const rows: RawRow[] = await this.coreDataSource.query(
      `SELECT * FROM ${this.schema(workspaceId)}."roboostUserPermission"`,
    );

    return rows.map((row) => this.toUserPermission(row));
  }

  async findUserPermission(
    workspaceId: string,
    workspaceMemberId: string,
  ): Promise<RoboostUserPermissionRow | null> {
    const rows: RawRow[] = await this.coreDataSource.query(
      `SELECT * FROM ${this.schema(workspaceId)}."roboostUserPermission" WHERE "workspaceMemberId" = $1`,
      [workspaceMemberId],
    );

    return rows.length > 0 ? this.toUserPermission(rows[0]) : null;
  }

  async upsertUserPermission({
    workspaceId,
    workspaceMemberId,
    permissions,
    desiredRole,
    roleId,
    updatedById,
  }: {
    workspaceId: string;
    workspaceMemberId: string;
    permissions: RoboostUserPermissions;
    desiredRole?: RoboostUserRole;
    roleId?: string | null;
    updatedById: string | null;
  }): Promise<void> {
    await this.coreDataSource.query(
      `INSERT INTO ${this.schema(workspaceId)}."roboostUserPermission"
        ("workspaceMemberId", permissions, "desiredRole", "roleId", "updatedById", "updatedAt")
      VALUES ($1, $2, COALESCE($3, 'MEMBER'), $4, $5, now())
      ON CONFLICT ("workspaceMemberId") DO UPDATE SET
        permissions = EXCLUDED.permissions,
        "desiredRole" = COALESCE($3, ${this.schema(workspaceId)}."roboostUserPermission"."desiredRole"),
        "roleId" = CASE WHEN $6 THEN EXCLUDED."roleId" ELSE ${this.schema(workspaceId)}."roboostUserPermission"."roleId" END,
        "updatedById" = EXCLUDED."updatedById",
        "updatedAt" = now()`,
      [
        workspaceMemberId,
        JSON.stringify(permissions),
        desiredRole ?? null,
        roleId ?? null,
        updatedById,
        roleId !== undefined,
      ],
    );
  }

  async findPendingInvite(
    workspaceId: string,
    email: string,
  ): Promise<RoboostPendingInviteRow | null> {
    const rows: RawRow[] = await this.coreDataSource.query(
      `SELECT * FROM ${this.schema(workspaceId)}."roboostPendingInvite" WHERE email = $1`,
      [email.trim().toLowerCase()],
    );

    return rows.length > 0 ? this.toPendingInvite(rows[0]) : null;
  }

  async listPendingInvites(
    workspaceId: string,
  ): Promise<RoboostPendingInviteRow[]> {
    const rows: RawRow[] = await this.coreDataSource.query(
      `SELECT * FROM ${this.schema(workspaceId)}."roboostPendingInvite" ORDER BY "invitedAt" DESC`,
    );

    return rows.map((row) => this.toPendingInvite(row));
  }

  async upsertPendingInvite({
    workspaceId,
    email,
    role,
    permissions,
    copiedFromWorkspaceMemberId,
    invitedById,
  }: {
    workspaceId: string;
    email: string;
    role: RoboostUserRole;
    permissions: RoboostUserPermissions;
    copiedFromWorkspaceMemberId: string | null;
    invitedById: string | null;
  }): Promise<void> {
    await this.coreDataSource.query(
      `INSERT INTO ${this.schema(workspaceId)}."roboostPendingInvite"
        (email, role, permissions, "copiedFromWorkspaceMemberId", "invitedById", "invitedAt")
      VALUES ($1, $2, $3, $4, $5, now())
      ON CONFLICT (email) DO UPDATE SET
        role = EXCLUDED.role,
        permissions = EXCLUDED.permissions,
        "copiedFromWorkspaceMemberId" = EXCLUDED."copiedFromWorkspaceMemberId",
        "invitedById" = EXCLUDED."invitedById",
        "invitedAt" = now()`,
      [
        email.trim().toLowerCase(),
        role,
        JSON.stringify(permissions),
        copiedFromWorkspaceMemberId,
        invitedById,
      ],
    );
  }

  async deletePendingInvite(workspaceId: string, email: string) {
    await this.coreDataSource.query(
      `DELETE FROM ${this.schema(workspaceId)}."roboostPendingInvite" WHERE email = $1`,
      [email.trim().toLowerCase()],
    );
  }

  async addHistory(
    workspaceId: string,
    entries: RoboostPermissionHistoryWrite[],
  ): Promise<void> {
    if (entries.length === 0) {
      return;
    }

    const values: unknown[] = [];
    const placeholders = entries.map((entry, index) => {
      values.push(
        entry.actorWorkspaceMemberId,
        entry.actorName,
        entry.targetWorkspaceMemberId,
        entry.targetLabel,
        entry.kind,
        entry.setting,
        entry.fromValue,
        entry.toValue,
      );
      const offset = index * 8;

      return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8})`;
    });

    await this.coreDataSource.query(
      `INSERT INTO ${this.schema(workspaceId)}."roboostPermissionHistory"
        ("actorWorkspaceMemberId", "actorName", "targetWorkspaceMemberId", "targetLabel", kind, setting, "fromValue", "toValue")
      VALUES ${placeholders.join(', ')}`,
      values,
    );
  }

  async listHistory({
    workspaceId,
    targetWorkspaceMemberId,
    from,
    to,
  }: {
    workspaceId: string;
    targetWorkspaceMemberId?: string | null;
    from?: string | null;
    to?: string | null;
  }): Promise<RoboostPermissionHistoryEntry[]> {
    const conditions: string[] = [];
    const parameters: unknown[] = [];

    if (isDefined(targetWorkspaceMemberId)) {
      parameters.push(targetWorkspaceMemberId);
      conditions.push(`"targetWorkspaceMemberId" = $${parameters.length}`);
    }

    if (isDefined(from)) {
      parameters.push(from);
      conditions.push(`"createdAt" >= $${parameters.length}`);
    }

    if (isDefined(to)) {
      parameters.push(to);
      conditions.push(`"createdAt" <= $${parameters.length}`);
    }

    const rows: RawRow[] = await this.coreDataSource.query(
      `SELECT * FROM ${this.schema(workspaceId)}."roboostPermissionHistory"
      ${conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''}
      ORDER BY "createdAt" DESC LIMIT 500`,
      parameters,
    );

    return rows.map((row) => ({
      id: row.id as string,
      createdAt: toIso(row.createdAt),
      actorWorkspaceMemberId: (row.actorWorkspaceMemberId as string) ?? null,
      actorName: (row.actorName as string) ?? null,
      targetWorkspaceMemberId: (row.targetWorkspaceMemberId as string) ?? null,
      targetLabel: row.targetLabel as string,
      kind: row.kind as RoboostPermissionHistoryKind,
      setting: row.setting as string,
      fromValue: (row.fromValue as string) ?? null,
      toValue: (row.toValue as string) ?? null,
    }));
  }

  private toUserPermission(row: RawRow): RoboostUserPermissionRow {
    return {
      workspaceMemberId: row.workspaceMemberId as string,
      roleId: (row.roleId as string) ?? null,
      permissions: normalizeRoboostPermissions(
        row.permissions as Partial<RoboostUserPermissions>,
      ),
      desiredRole: row.desiredRole === 'ADMIN' ? 'ADMIN' : 'MEMBER',
      updatedAt: toIso(row.updatedAt),
    };
  }

  private toPendingInvite(row: RawRow): RoboostPendingInviteRow {
    return {
      email: row.email as string,
      role: row.role === 'ADMIN' ? 'ADMIN' : 'MEMBER',
      permissions: normalizeRoboostPermissions(
        row.permissions as Partial<RoboostUserPermissions>,
      ),
      copiedFromWorkspaceMemberId:
        (row.copiedFromWorkspaceMemberId as string) ?? null,
      invitedAt: toIso(row.invitedAt),
    };
  }
}
