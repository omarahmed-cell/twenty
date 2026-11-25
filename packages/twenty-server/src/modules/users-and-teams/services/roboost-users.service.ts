import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';

import {
  type RoboostUserPermissions,
  type RoboostUserRole,
} from 'twenty-shared/types';
import {
  buildDefaultRoboostPermissions,
  diffRoboostPermissions,
  isDefined,
  normalizeRoboostPermissions,
  summarizeRoboostAccess,
} from 'twenty-shared/utils';
import { DataSource, In } from 'typeorm';

import { type WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { WorkspaceMemberAccessService } from 'src/engine/core-modules/user-workspace/services/workspace-member-access.service';
import { WorkspaceInvitationService } from 'src/engine/core-modules/workspace-invitation/services/workspace-invitation.service';
import { type WorkspaceRepository } from 'src/engine/twenty-orm/repository/workspace-repository';
import { WorkspaceOrmManager } from 'src/engine/twenty-orm/workspace-orm.manager';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';
import { getWorkspaceSchemaName } from 'src/engine/workspace-datasource/utils/get-workspace-schema-name.util';
import { STANDARD_ROLE } from 'src/engine/workspace-manager/twenty-standard-application/constants/standard-role.constant';
import { RoboostRoleSyncService } from 'src/modules/users-and-teams/services/roboost-role-sync.service';
import {
  type RoboostPermissionHistoryWrite,
  RoboostUserPermissionStoreService,
} from 'src/modules/users-and-teams/services/roboost-user-permission-store.service';
import { type TeamMembershipWorkspaceEntity } from 'src/modules/users-and-teams/standard-objects/team-membership.workspace-entity';
import { type TeamWorkspaceEntity } from 'src/modules/users-and-teams/standard-objects/team.workspace-entity';
import { type WorkspaceMemberWorkspaceEntity } from 'src/modules/workspace-member/standard-objects/workspace-member.workspace-entity';

export type RoboostMemberRow = {
  workspaceMemberId: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  memberStatus: string;
  isPreCreated: boolean;
  createdAt: string;
  userWorkspaceId: string | null;
  roleId: string | null;
  isAdmin: boolean;
};

export type RoboostTeamMemberView = {
  workspaceMemberId: string;
  name: string;
  isMain: boolean;
};

export type RoboostTeamView = {
  id: string;
  name: string;
  createdAt: string;
  members: RoboostTeamMemberView[];
};

export type RoboostUserView = RoboostMemberRow & {
  access: string | null;
  mainTeamId: string | null;
  mainTeamName: string | null;
  additionalTeamNames: string[];
};

export type RoboostActor = {
  workspaceMemberId: string | null;
  name: string | null;
};

type RawRow = Record<string, unknown>;

const formatName = (row: RawRow) =>
  [row.nameFirstName, row.nameLastName]
    .filter((part) => typeof part === 'string' && part.trim() !== '')
    .join(' ')
    .trim() ||
  ((row.userEmail as string) ?? '');

@Injectable()
export class RoboostUsersService {
  private readonly logger = new Logger(RoboostUsersService.name);

  constructor(
    @InjectDataSource()
    private readonly coreDataSource: DataSource,
    private readonly storeService: RoboostUserPermissionStoreService,
    private readonly roleSyncService: RoboostRoleSyncService,
    private readonly workspaceOrmManager: WorkspaceOrmManager,
    private readonly workspaceInvitationService: WorkspaceInvitationService,
    private readonly workspaceMemberAccessService: WorkspaceMemberAccessService,
  ) {}

  async listMembers(workspaceId: string): Promise<RoboostMemberRow[]> {
    const rows: RawRow[] = await this.coreDataSource.query(
      `SELECT wm.id, wm."nameFirstName", wm."nameLastName", wm."userEmail", wm."avatarUrl",
        wm."memberStatus", wm."isPreCreated", wm."createdAt",
        uw.id AS "userWorkspaceId", r.id AS "roleId", r."universalIdentifier" AS "roleUniversalIdentifier"
      FROM "${getWorkspaceSchemaName(workspaceId)}"."workspaceMember" wm
      LEFT JOIN core."userWorkspace" uw ON uw."userId" = wm."userId" AND uw."workspaceId" = $1 AND uw."deletedAt" IS NULL
      LEFT JOIN core."roleTarget" rt ON rt."userWorkspaceId" = uw.id
      LEFT JOIN core."role" r ON r.id = rt."roleId"
      WHERE wm."deletedAt" IS NULL
      ORDER BY wm."nameFirstName", wm."nameLastName"`,
      [workspaceId],
    );
    const desiredRoleByMemberId = new Map(
      (await this.storeService.listUserPermissions(workspaceId)).map((row) => [
        row.workspaceMemberId,
        row.desiredRole,
      ]),
    );

    return rows.map((row) => {
      const userWorkspaceId = (row.userWorkspaceId as string) ?? null;

      return {
        workspaceMemberId: row.id as string,
        name: formatName(row),
        email: (row.userEmail as string) ?? '',
        avatarUrl: (row.avatarUrl as string) || null,
        memberStatus: (row.memberStatus as string) ?? 'ACTIVE',
        isPreCreated: row.isPreCreated === true,
        createdAt: new Date(row.createdAt as string).toISOString(),
        userWorkspaceId,
        roleId: (row.roleId as string) ?? null,
        isAdmin: isDefined(userWorkspaceId)
          ? row.roleUniversalIdentifier ===
            STANDARD_ROLE.admin.universalIdentifier
          : desiredRoleByMemberId.get(row.id as string) === 'ADMIN',
      };
    });
  }

  async findMemberOrThrow(
    workspaceId: string,
    workspaceMemberId: string,
  ): Promise<RoboostMemberRow> {
    const member = (await this.listMembers(workspaceId)).find(
      (row) => row.workspaceMemberId === workspaceMemberId,
    );

    if (!isDefined(member)) {
      throw new ForbiddenException('Workspace member not found');
    }

    return member;
  }

  async isAdmin(workspaceId: string, workspaceMemberId: string) {
    const member = (await this.listMembers(workspaceId)).find(
      (row) => row.workspaceMemberId === workspaceMemberId,
    );

    return member?.isAdmin === true;
  }

  async assertAdmin(
    workspaceId: string,
    workspaceMemberId: string | undefined,
  ) {
    if (
      !isDefined(workspaceMemberId) ||
      !(await this.isAdmin(workspaceId, workspaceMemberId))
    ) {
      throw new ForbiddenException('Only admins can do this');
    }
  }

  async getPermissions(
    workspaceId: string,
    workspaceMemberId: string,
  ): Promise<RoboostUserPermissions> {
    const row = await this.storeService.findUserPermission(
      workspaceId,
      workspaceMemberId,
    );

    return row?.permissions ?? buildDefaultRoboostPermissions();
  }

  // Gives a member who signed in on the default role their private role (and an invite's settings)
  async ensureProvisioned(
    workspaceId: string,
    workspaceMemberId: string,
  ): Promise<{ isAdmin: boolean; permissions: RoboostUserPermissions }> {
    const member = await this.findMemberOrThrow(workspaceId, workspaceMemberId);
    let row = await this.storeService.findUserPermission(
      workspaceId,
      workspaceMemberId,
    );

    if (!isDefined(row)) {
      const invite = member.email
        ? await this.storeService.findPendingInvite(workspaceId, member.email)
        : null;

      await this.storeService.upsertUserPermission({
        workspaceId,
        workspaceMemberId,
        permissions: invite?.permissions ?? buildDefaultRoboostPermissions(),
        desiredRole: invite?.role ?? (member.isAdmin ? 'ADMIN' : 'MEMBER'),
        updatedById: null,
      });

      if (isDefined(invite)) {
        await this.storeService.deletePendingInvite(workspaceId, invite.email);
      }

      row = await this.storeService.findUserPermission(
        workspaceId,
        workspaceMemberId,
      );
    }

    if (!isDefined(row)) {
      return {
        isAdmin: member.isAdmin,
        permissions: buildDefaultRoboostPermissions(),
      };
    }

    if (!isDefined(member.userWorkspaceId)) {
      if (row.desiredRole !== 'ADMIN' && !isDefined(row.roleId)) {
        await this.applyMemberRole({
          workspaceId,
          member,
          permissions: row.permissions,
          existingRoleId: null,
        });
      }

      return { isAdmin: member.isAdmin, permissions: row.permissions };
    }

    if (member.isAdmin) {
      return { isAdmin: true, permissions: row.permissions };
    }

    if (row.desiredRole === 'ADMIN') {
      await this.roleSyncService.assignRole({
        workspaceId,
        userWorkspaceId: member.userWorkspaceId,
        roleId: await this.roleSyncService.getAdminRoleId(workspaceId),
      });

      return { isAdmin: true, permissions: row.permissions };
    }

    if (!isDefined(row.roleId) || member.roleId !== row.roleId) {
      await this.applyMemberRole({
        workspaceId,
        member,
        permissions: row.permissions,
        existingRoleId: row.roleId,
      });
    }

    return { isAdmin: false, permissions: row.permissions };
  }

  // Runs from sign-up, invite accept and pre-create, before the member gets a token
  async provisionNewMember({
    workspaceId,
    workspaceMemberId,
    userWorkspaceId,
  }: {
    workspaceId: string;
    workspaceMemberId?: string;
    userWorkspaceId?: string;
  }): Promise<void> {
    const member = (await this.listMembers(workspaceId)).find(
      (row) =>
        row.workspaceMemberId === workspaceMemberId ||
        (isDefined(userWorkspaceId) && row.userWorkspaceId === userWorkspaceId),
    );

    if (!isDefined(member)) {
      return;
    }

    await this.ensureProvisioned(workspaceId, member.workspaceMemberId);
  }

  private async applyMemberRole({
    workspaceId,
    member,
    permissions,
    existingRoleId,
  }: {
    workspaceId: string;
    member: RoboostMemberRow;
    permissions: RoboostUserPermissions;
    existingRoleId: string | null;
  }) {
    const roleId = await this.roleSyncService.syncPrivateRole({
      workspaceId,
      workspaceMemberId: member.workspaceMemberId,
      memberName: member.name,
      existingRoleId,
      permissions,
    });

    await this.storeService.upsertUserPermission({
      workspaceId,
      workspaceMemberId: member.workspaceMemberId,
      permissions,
      roleId,
      updatedById: null,
    });

    if (isDefined(member.userWorkspaceId)) {
      await this.roleSyncService.assignRole({
        workspaceId,
        userWorkspaceId: member.userWorkspaceId,
        roleId,
      });
    }

    await this.roleSyncService.invalidateRecordAccess(workspaceId);
  }

  async listUsers({
    workspaceId,
    includeAccess,
  }: {
    workspaceId: string;
    includeAccess: boolean;
  }): Promise<RoboostUserView[]> {
    const [members, permissionRows, teams] = await Promise.all([
      this.listMembers(workspaceId),
      this.storeService.listUserPermissions(workspaceId),
      this.listTeams(workspaceId),
    ]);
    const permissionsByMemberId = new Map(
      permissionRows.map((row) => [row.workspaceMemberId, row.permissions]),
    );

    return members.map((member) => {
      const memberTeams = teams.flatMap((team) =>
        team.members
          .filter(
            (teamMember) =>
              teamMember.workspaceMemberId === member.workspaceMemberId,
          )
          .map((teamMember) => ({ team, isMain: teamMember.isMain })),
      );
      const mainTeam = memberTeams.find(({ isMain }) => isMain)?.team ?? null;

      return {
        ...member,
        access: includeAccess
          ? summarizeRoboostAccess({
              isAdmin: member.isAdmin,
              permissions:
                permissionsByMemberId.get(member.workspaceMemberId) ??
                buildDefaultRoboostPermissions(),
            })
          : null,
        mainTeamId: mainTeam?.id ?? null,
        mainTeamName: mainTeam?.name ?? null,
        additionalTeamNames: memberTeams
          .filter(({ isMain }) => !isMain)
          .map(({ team }) => team.name),
      };
    });
  }

  async listPendingInvites(workspace: WorkspaceEntity) {
    const [invitations, pendingRows, adminRoleId] = await Promise.all([
      this.workspaceInvitationService.loadWorkspaceInvitations(workspace),
      this.storeService.listPendingInvites(workspace.id),
      this.roleSyncService.getAdminRoleId(workspace.id),
    ]);
    const pendingByEmail = new Map(pendingRows.map((row) => [row.email, row]));

    return invitations.map((invitation) => {
      const pending = pendingByEmail.get(invitation.email.toLowerCase());

      return {
        id: invitation.id,
        email: invitation.email,
        role: (pending?.role ??
          (invitation.roleId === adminRoleId
            ? 'ADMIN'
            : 'MEMBER')) as RoboostUserRole,
        expiresAt: new Date(invitation.expiresAt).toISOString(),
        invitedAt: pending?.invitedAt ?? null,
      };
    });
  }

  async setAdmin({
    workspaceId,
    actor,
    workspaceMemberId,
    isAdmin,
  }: {
    workspaceId: string;
    actor: RoboostActor;
    workspaceMemberId: string;
    isAdmin: boolean;
  }) {
    const member = await this.findMemberOrThrow(workspaceId, workspaceMemberId);

    if (member.isAdmin === isAdmin) {
      return;
    }

    const permissions = await this.getPermissions(
      workspaceId,
      workspaceMemberId,
    );
    const existing = await this.storeService.findUserPermission(
      workspaceId,
      workspaceMemberId,
    );

    if (isDefined(member.userWorkspaceId)) {
      if (isAdmin) {
        await this.roleSyncService.assignRole({
          workspaceId,
          userWorkspaceId: member.userWorkspaceId,
          roleId: await this.roleSyncService.getAdminRoleId(workspaceId),
        });
      } else {
        await this.applyMemberRole({
          workspaceId,
          member,
          permissions,
          existingRoleId: existing?.roleId ?? null,
        });
      }
    }

    await this.storeService.upsertUserPermission({
      workspaceId,
      workspaceMemberId,
      permissions,
      desiredRole: isAdmin ? 'ADMIN' : 'MEMBER',
      updatedById: actor.workspaceMemberId,
    });

    await this.addHistory(workspaceId, [
      {
        ...this.actorFields(actor),
        targetWorkspaceMemberId: workspaceMemberId,
        targetLabel: member.name,
        kind: 'ROLE',
        setting: 'Role',
        fromValue: isAdmin ? 'Member' : 'Admin',
        toValue: isAdmin ? 'Admin' : 'Member',
      },
    ]);
  }

  async savePermissions({
    workspaceId,
    actor,
    workspaceMemberId,
    permissions: rawPermissions,
    historyKind = 'PERMISSION',
    historyNote,
  }: {
    workspaceId: string;
    actor: RoboostActor;
    workspaceMemberId: string;
    permissions: unknown;
    historyKind?: 'PERMISSION' | 'COPY';
    historyNote?: string;
  }): Promise<RoboostUserPermissions> {
    const member = await this.findMemberOrThrow(workspaceId, workspaceMemberId);
    const permissions = normalizeRoboostPermissions(
      rawPermissions as Partial<RoboostUserPermissions>,
    );
    const existing = await this.storeService.findUserPermission(
      workspaceId,
      workspaceMemberId,
    );
    const previous = existing?.permissions ?? buildDefaultRoboostPermissions();

    await this.storeService.upsertUserPermission({
      workspaceId,
      workspaceMemberId,
      permissions,
      updatedById: actor.workspaceMemberId,
    });

    if (!member.isAdmin && isDefined(member.userWorkspaceId)) {
      await this.applyMemberRole({
        workspaceId,
        member,
        permissions,
        existingRoleId: existing?.roleId ?? null,
      });
    }

    const differences = diffRoboostPermissions(previous, permissions);

    await this.addHistory(workspaceId, [
      ...(isDefined(historyNote)
        ? [
            {
              ...this.actorFields(actor),
              targetWorkspaceMemberId: workspaceMemberId,
              targetLabel: member.name,
              kind: historyKind,
              setting: historyNote,
              fromValue: null,
              toValue: null,
            },
          ]
        : []),
      ...differences.map((difference) => ({
        ...this.actorFields(actor),
        targetWorkspaceMemberId: workspaceMemberId,
        targetLabel: member.name,
        kind: historyKind,
        setting: `${difference.itemLabel} > ${difference.settingLabel}`,
        fromValue: difference.from,
        toValue: difference.to,
      })),
    ]);

    return permissions;
  }

  async copyPermissions({
    workspaceId,
    actor,
    fromWorkspaceMemberId,
    toWorkspaceMemberIds,
  }: {
    workspaceId: string;
    actor: RoboostActor;
    fromWorkspaceMemberId: string;
    toWorkspaceMemberIds: string[];
  }) {
    const source = await this.findMemberOrThrow(
      workspaceId,
      fromWorkspaceMemberId,
    );
    const permissions = await this.getPermissions(
      workspaceId,
      fromWorkspaceMemberId,
    );

    for (const workspaceMemberId of toWorkspaceMemberIds.filter(
      (id) => id !== fromWorkspaceMemberId,
    )) {
      await this.savePermissions({
        workspaceId,
        actor,
        workspaceMemberId,
        permissions,
        historyKind: 'COPY',
        historyNote: `Permissions copied from ${source.name}`,
      });
    }
  }

  async inviteUsers({
    workspace,
    actor,
    emails,
    role,
    copyFromWorkspaceMemberId,
  }: {
    workspace: WorkspaceEntity;
    actor: RoboostActor;
    emails: string[];
    role: RoboostUserRole;
    copyFromWorkspaceMemberId: string | null;
  }) {
    const cleanEmails = [
      ...new Set(
        emails.map((email) => email.trim().toLowerCase()).filter(Boolean),
      ),
    ];
    const permissions = isDefined(copyFromWorkspaceMemberId)
      ? await this.getPermissions(workspace.id, copyFromWorkspaceMemberId)
      : buildDefaultRoboostPermissions();
    const copySource = isDefined(copyFromWorkspaceMemberId)
      ? await this.findMemberOrThrow(workspace.id, copyFromWorkspaceMemberId)
      : null;

    for (const email of cleanEmails) {
      await this.storeService.upsertPendingInvite({
        workspaceId: workspace.id,
        email,
        role,
        permissions,
        copiedFromWorkspaceMemberId: copyFromWorkspaceMemberId,
        invitedById: actor.workspaceMemberId,
      });
    }

    const sender = await this.findWorkspaceMemberEntity(
      workspace.id,
      actor.workspaceMemberId,
    );
    const result = await this.workspaceInvitationService.sendInvitations({
      emails: cleanEmails,
      workspace,
      sender,
      roleId:
        role === 'ADMIN'
          ? await this.roleSyncService.getAdminRoleId(workspace.id)
          : undefined,
    });

    await this.addHistory(
      workspace.id,
      cleanEmails.map((email) => ({
        ...this.actorFields(actor),
        targetWorkspaceMemberId: null,
        targetLabel: email,
        kind: 'INVITE' as const,
        setting: isDefined(copySource)
          ? `Invited as ${role === 'ADMIN' ? 'Admin' : 'Member'}, permissions copied from ${copySource.name}`
          : `Invited as ${role === 'ADMIN' ? 'Admin' : 'Member'} with default permissions`,
        fromValue: null,
        toValue: null,
      })),
    );

    return result;
  }

  async setStatus({
    workspaceId,
    actor,
    actingUserId,
    workspaceMemberId,
    memberStatus,
  }: {
    workspaceId: string;
    actor: RoboostActor;
    actingUserId: string | undefined;
    workspaceMemberId: string;
    memberStatus: 'ACTIVE' | 'DEACTIVATED';
  }) {
    const member = await this.findMemberOrThrow(workspaceId, workspaceMemberId);

    await this.workspaceMemberAccessService.updateWorkspaceMemberStatus({
      workspaceId,
      workspaceMemberId,
      memberStatus,
      actingUserId,
    });

    await this.addHistory(workspaceId, [
      {
        ...this.actorFields(actor),
        targetWorkspaceMemberId: workspaceMemberId,
        targetLabel: member.name,
        kind: 'STATUS',
        setting: 'Status',
        fromValue:
          member.memberStatus === 'DEACTIVATED' ? 'Deactivated' : 'Active',
        toValue: memberStatus === 'DEACTIVATED' ? 'Deactivated' : 'Active',
      },
    ]);
  }

  async listTeams(workspaceId: string): Promise<RoboostTeamView[]> {
    const schema = `"${getWorkspaceSchemaName(workspaceId)}"`;
    const teamRows: RawRow[] = await this.coreDataSource.query(
      `SELECT id, name, "createdAt" FROM ${schema}."team" WHERE "deletedAt" IS NULL ORDER BY lower(name)`,
    );
    const membershipRows: RawRow[] = await this.coreDataSource.query(
      `SELECT tm."teamId", tm."workspaceMemberId", tm."isMain", wm."nameFirstName", wm."nameLastName", wm."userEmail"
      FROM ${schema}."teamMembership" tm
      JOIN ${schema}."workspaceMember" wm ON wm.id = tm."workspaceMemberId" AND wm."deletedAt" IS NULL
      WHERE tm."deletedAt" IS NULL`,
    );

    return teamRows.map((team) => ({
      id: team.id as string,
      name: team.name as string,
      createdAt: new Date(team.createdAt as string).toISOString(),
      members: membershipRows
        .filter((membership) => membership.teamId === team.id)
        .map((membership) => ({
          workspaceMemberId: membership.workspaceMemberId as string,
          name: formatName(membership),
          isMain: membership.isMain === true,
        })),
    }));
  }

  async saveTeam({
    workspaceId,
    actor,
    teamId,
    name,
    members,
  }: {
    workspaceId: string;
    actor: RoboostActor;
    teamId: string | null;
    name: string;
    members: { workspaceMemberId: string; isMain: boolean }[];
  }): Promise<string> {
    const trimmedName = name.trim();

    if (trimmedName === '') {
      throw new ForbiddenException('A team needs a name');
    }

    const before = isDefined(teamId)
      ? (await this.listTeams(workspaceId)).find((team) => team.id === teamId)
      : undefined;

    const savedTeamId = await this.withTeamRepositories(
      workspaceId,
      async ({ teamRepository, membershipRepository }) => {
        let id = teamId;

        if (isDefined(id)) {
          await teamRepository.update({ id }, { name: trimmedName });
        } else {
          const [created] = await teamRepository.save({ name: trimmedName });

          id = created.id;
        }

        await membershipRepository.delete({ teamId: id });

        const mainMemberIds = members
          .filter((member) => member.isMain)
          .map((member) => member.workspaceMemberId);

        if (mainMemberIds.length > 0) {
          await membershipRepository.update(
            { workspaceMemberId: In(mainMemberIds), isMain: true },
            { isMain: false },
          );
        }

        if (members.length > 0) {
          await membershipRepository.save(
            members.map((member) => ({
              teamId: id as string,
              workspaceMemberId: member.workspaceMemberId,
              isMain: member.isMain,
            })),
          );
        }

        return id as string;
      },
    );

    const memberNames = new Map(
      (await this.listMembers(workspaceId)).map((member) => [
        member.workspaceMemberId,
        member.name,
      ]),
    );
    const describeMembers = (
      list: { workspaceMemberId: string; isMain: boolean }[],
    ) =>
      list
        .map(
          (member) =>
            `${memberNames.get(member.workspaceMemberId) ?? member.workspaceMemberId}${member.isMain ? ' (main)' : ''}`,
        )
        .sort()
        .join(', ');

    await this.addHistory(workspaceId, [
      {
        ...this.actorFields(actor),
        targetWorkspaceMemberId: null,
        targetLabel: `Team ${trimmedName}`,
        kind: 'TEAM',
        setting: isDefined(before) ? 'Team updated' : 'Team created',
        fromValue: isDefined(before)
          ? `${before.name}: ${describeMembers(before.members)}`
          : null,
        toValue: `${trimmedName}: ${describeMembers(members)}`,
      },
      ...this.teamMembershipChanges({
        actor,
        teamName: trimmedName,
        before: before?.members ?? [],
        after: members,
        memberNames,
      }),
    ]);

    return savedTeamId;
  }

  async deleteTeam({
    workspaceId,
    actor,
    teamId,
  }: {
    workspaceId: string;
    actor: RoboostActor;
    teamId: string;
  }) {
    const team = (await this.listTeams(workspaceId)).find(
      (candidate) => candidate.id === teamId,
    );

    if (!isDefined(team)) {
      return;
    }

    await this.withTeamRepositories(
      workspaceId,
      async ({ teamRepository, membershipRepository }) => {
        await membershipRepository.delete({ teamId });
        await teamRepository.delete({ id: teamId });
      },
    );

    const memberNames = new Map(
      team.members.map((member) => [member.workspaceMemberId, member.name]),
    );

    await this.addHistory(workspaceId, [
      {
        ...this.actorFields(actor),
        targetWorkspaceMemberId: null,
        targetLabel: `Team ${team.name}`,
        kind: 'TEAM',
        setting: 'Team deleted',
        fromValue: team.name,
        toValue: null,
      },
      ...this.teamMembershipChanges({
        actor,
        teamName: team.name,
        before: team.members,
        after: [],
        memberNames,
      }),
    ]);
  }

  async setUserTeams({
    workspaceId,
    actor,
    workspaceMemberId,
    mainTeamId,
    additionalTeamIds,
  }: {
    workspaceId: string;
    actor: RoboostActor;
    workspaceMemberId: string;
    mainTeamId: string | null;
    additionalTeamIds: string[];
  }) {
    const member = await this.findMemberOrThrow(workspaceId, workspaceMemberId);
    const teams = await this.listTeams(workspaceId);
    const describe = (main: string | null, additional: string[]) => {
      const name = (id: string) =>
        teams.find((team) => team.id === id)?.name ?? id;

      return [
        main ? `Main: ${name(main)}` : 'Main: none',
        additional.length > 0
          ? `Additional: ${additional.map(name).sort().join(', ')}`
          : null,
      ]
        .filter(isDefined)
        .join('; ');
    };
    const beforeMain =
      teams.find((team) =>
        team.members.some(
          (teamMember) =>
            teamMember.workspaceMemberId === workspaceMemberId &&
            teamMember.isMain,
        ),
      )?.id ?? null;
    const beforeAdditional = teams
      .filter((team) =>
        team.members.some(
          (teamMember) =>
            teamMember.workspaceMemberId === workspaceMemberId &&
            !teamMember.isMain,
        ),
      )
      .map((team) => team.id);
    const cleanAdditional = [...new Set(additionalTeamIds)].filter(
      (teamId) => teamId !== mainTeamId,
    );

    await this.withTeamRepositories(
      workspaceId,
      async ({ membershipRepository }) => {
        await membershipRepository.delete({ workspaceMemberId });

        const memberships = [
          ...(isDefined(mainTeamId)
            ? [{ teamId: mainTeamId, workspaceMemberId, isMain: true }]
            : []),
          ...cleanAdditional.map((teamId) => ({
            teamId,
            workspaceMemberId,
            isMain: false,
          })),
        ];

        if (memberships.length > 0) {
          await membershipRepository.save(memberships);
        }
      },
    );

    await this.addHistory(workspaceId, [
      {
        ...this.actorFields(actor),
        targetWorkspaceMemberId: workspaceMemberId,
        targetLabel: member.name,
        kind: 'TEAM',
        setting: 'Teams',
        fromValue: describe(beforeMain, beforeAdditional),
        toValue: describe(mainTeamId, cleanAdditional),
      },
    ]);
  }

  async listHistory(args: {
    workspaceId: string;
    targetWorkspaceMemberId?: string | null;
    from?: string | null;
    to?: string | null;
  }) {
    return this.storeService.listHistory(args);
  }

  async resolveActor(
    workspaceId: string,
    workspaceMemberId: string | undefined,
  ): Promise<RoboostActor> {
    if (!isDefined(workspaceMemberId)) {
      return { workspaceMemberId: null, name: null };
    }

    const member = (await this.listMembers(workspaceId)).find(
      (row) => row.workspaceMemberId === workspaceMemberId,
    );

    return { workspaceMemberId, name: member?.name ?? null };
  }

  // Seeds a permission row (defaults, or Admin for current admins) for every member that has none
  async seedMissingPermissions(workspaceId: string): Promise<{
    seeded: { name: string; role: RoboostUserRole }[];
  }> {
    const [members, rows] = await Promise.all([
      this.listMembers(workspaceId),
      this.storeService.listUserPermissions(workspaceId),
    ]);
    const existing = new Set(rows.map((row) => row.workspaceMemberId));
    const seeded: { name: string; role: RoboostUserRole }[] = [];

    for (const member of members) {
      if (existing.has(member.workspaceMemberId)) {
        continue;
      }

      const role: RoboostUserRole = member.isAdmin ? 'ADMIN' : 'MEMBER';

      await this.storeService.upsertUserPermission({
        workspaceId,
        workspaceMemberId: member.workspaceMemberId,
        permissions: buildDefaultRoboostPermissions(),
        desiredRole: role,
        updatedById: null,
      });
      seeded.push({ name: member.name, role });
    }

    for (const member of members) {
      if (!member.isAdmin && isDefined(member.userWorkspaceId)) {
        try {
          await this.ensureProvisioned(workspaceId, member.workspaceMemberId);
        } catch (error) {
          this.logger.error(
            `Could not apply the private role of ${member.workspaceMemberId}: ${(error as Error).message}`,
          );
        }
      }
    }

    return { seeded };
  }

  private teamMembershipChanges({
    actor,
    teamName,
    before,
    after,
    memberNames,
  }: {
    actor: RoboostActor;
    teamName: string;
    before: { workspaceMemberId: string; isMain: boolean }[];
    after: { workspaceMemberId: string; isMain: boolean }[];
    memberNames: Map<string, string>;
  }): RoboostPermissionHistoryWrite[] {
    const describe = (membership?: { isMain: boolean }) =>
      isDefined(membership)
        ? membership.isMain
          ? 'Main team'
          : 'Additional team'
        : 'Not in team';
    const memberIds = new Set([
      ...before.map((membership) => membership.workspaceMemberId),
      ...after.map((membership) => membership.workspaceMemberId),
    ]);

    return [...memberIds].flatMap((workspaceMemberId) => {
      const fromValue = describe(
        before.find(
          (membership) => membership.workspaceMemberId === workspaceMemberId,
        ),
      );
      const toValue = describe(
        after.find(
          (membership) => membership.workspaceMemberId === workspaceMemberId,
        ),
      );

      return fromValue === toValue
        ? []
        : [
            {
              ...this.actorFields(actor),
              targetWorkspaceMemberId: workspaceMemberId,
              targetLabel:
                memberNames.get(workspaceMemberId) ?? workspaceMemberId,
              kind: 'TEAM' as const,
              setting: `Team ${teamName}`,
              fromValue,
              toValue,
            },
          ];
    });
  }

  private actorFields(actor: RoboostActor) {
    return {
      actorWorkspaceMemberId: actor.workspaceMemberId,
      actorName: actor.name,
    };
  }

  private async addHistory(
    workspaceId: string,
    entries: RoboostPermissionHistoryWrite[],
  ) {
    await this.storeService.addHistory(workspaceId, entries);
  }

  private async withTeamRepositories<TResult>(
    workspaceId: string,
    work: (repositories: {
      teamRepository: WorkspaceRepository<TeamWorkspaceEntity>;
      membershipRepository: WorkspaceRepository<TeamMembershipWorkspaceEntity>;
    }) => Promise<TResult>,
  ): Promise<TResult> {
    return this.workspaceOrmManager.executeInWorkspaceContext(
      () =>
        work({
          teamRepository:
            this.workspaceOrmManager.getRepository<TeamWorkspaceEntity>(
              'team',
              { shouldBypassPermissionChecks: true },
            ),
          membershipRepository:
            this.workspaceOrmManager.getRepository<TeamMembershipWorkspaceEntity>(
              'teamMembership',
              { shouldBypassPermissionChecks: true },
            ),
        }),
      buildSystemAuthContext(workspaceId),
    );
  }

  private async findWorkspaceMemberEntity(
    workspaceId: string,
    workspaceMemberId: string | null,
  ): Promise<WorkspaceMemberWorkspaceEntity> {
    if (!isDefined(workspaceMemberId)) {
      throw new ForbiddenException('Inviting needs a signed-in member');
    }

    return this.workspaceOrmManager.executeInWorkspaceContext(
      () =>
        this.workspaceOrmManager
          .getRepository<WorkspaceMemberWorkspaceEntity>('workspaceMember', {
            shouldBypassPermissionChecks: true,
          })
          .findOneOrFail({ where: { id: workspaceMemberId } }),
      buildSystemAuthContext(workspaceId),
    );
  }
}
