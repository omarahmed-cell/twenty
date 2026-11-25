import {
  ROBOOST_ACTIVITY_OWNERSHIP,
  ROBOOST_ACTIVITY_TARGET_COLUMNS,
  ROBOOST_OWNERSHIP_FIELDS,
  ROBOOST_TOGGLE_OBJECT_PERMISSIONS,
} from 'twenty-shared/constants';
import {
  type RoboostScopeSetting,
  type RoboostUserPermissions,
} from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

import { type RoboostRecordAccessSubject } from 'src/engine/metadata-modules/role/types/roboost-record-access-maps.type';
import { type OperationType } from 'src/engine/twenty-orm/repository/permissions.utils';
import { escapeIdentifier } from 'src/engine/workspace-manager/workspace-migration/utils/remove-sql-injection.util';

export type RoboostRecordAccessCondition =
  | { kind: 'open' }
  | { kind: 'denied' }
  | { kind: 'gated'; sql: string; parameters: Record<string, string> };

export const ROBOOST_RECORD_ACCESS_MEMBER_PARAMETER = 'roboostAccessMemberId';

const OPEN: RoboostRecordAccessCondition = { kind: 'open' };
const DENIED: RoboostRecordAccessCondition = { kind: 'denied' };

type ScopeContext = {
  schemaName: string;
  memberParameter: string;
};

const column = (alias: string, columnName: string) =>
  `${escapeIdentifier(alias)}.${escapeIdentifier(columnName)}`;

const table = (schemaName: string, tableName: string) =>
  `${escapeIdentifier(schemaName)}.${escapeIdentifier(tableName)}`;

const teammatesSubquery = ({ schemaName, memberParameter }: ScopeContext) =>
  `SELECT "rbtm2"."workspaceMemberId" FROM ${table(schemaName, 'teamMembership')} "rbtm1" JOIN ${table(schemaName, 'teamMembership')} "rbtm2" ON "rbtm2"."teamId" = "rbtm1"."teamId" AND "rbtm2"."deletedAt" IS NULL WHERE "rbtm1"."workspaceMemberId" = :${memberParameter} AND "rbtm1"."deletedAt" IS NULL`;

const orJoin = (conditions: string[]) =>
  conditions.length === 1 ? conditions[0] : `(${conditions.join(' OR ')})`;

// Records whose member columns hold the user (OWN) or anyone sharing a team with them (TEAM)
const buildMemberColumnsCondition = ({
  alias,
  memberColumns,
  scope,
  context,
}: {
  alias: string;
  memberColumns: string[];
  scope: 'OWN' | 'TEAM';
  context: ScopeContext;
}) => {
  const conditions = memberColumns.flatMap((columnName) =>
    scope === 'OWN'
      ? [`${column(alias, columnName)} = :${context.memberParameter}`]
      : [
          `${column(alias, columnName)} = :${context.memberParameter}`,
          `${column(alias, columnName)} IN (${teammatesSubquery(context)})`,
        ],
  );

  return orJoin(conditions);
};

const buildOwnedRecordCondition = ({
  alias,
  objectNameSingular,
  setting,
  context,
}: {
  alias: string;
  objectNameSingular: string;
  setting: RoboostScopeSetting;
  context: ScopeContext;
}): RoboostRecordAccessCondition => {
  if (setting.scope === 'ALL') {
    return OPEN;
  }

  if (setting.scope === 'NONE') {
    return DENIED;
  }

  const ownershipColumns = (
    ROBOOST_OWNERSHIP_FIELDS[objectNameSingular] ?? []
  ).map(({ joinColumnName }) => joinColumnName);

  if (ownershipColumns.length === 0) {
    return OPEN;
  }

  const conditions = [
    buildMemberColumnsCondition({
      alias,
      memberColumns: ownershipColumns,
      scope: setting.scope,
      context,
    }),
  ];

  if (setting.includeUnassigned) {
    conditions.push(
      `(${ownershipColumns
        .map((columnName) => `${column(alias, columnName)} IS NULL`)
        .join(' AND ')})`,
    );
  }

  return {
    kind: 'gated',
    sql: orJoin(conditions),
    parameters: {},
  };
};

const activityMemberColumns = (objectNameSingular: string) => [
  'createdByWorkspaceMemberId',
  ...(
    ROBOOST_ACTIVITY_OWNERSHIP[objectNameSingular]?.assigneeColumns ?? []
  ).map(({ joinColumnName }) => joinColumnName),
];

// An activity is readable when it is theirs or linked to at least one record they can view
const buildActivityViewCondition = ({
  alias,
  objectNameSingular,
  subject,
  context,
}: {
  alias: string;
  objectNameSingular: string;
  subject: RoboostRecordAccessSubject;
  context: ScopeContext;
}): RoboostRecordAccessCondition => {
  const activityOwnership = ROBOOST_ACTIVITY_OWNERSHIP[objectNameSingular];

  if (!isDefined(activityOwnership)) {
    return OPEN;
  }

  const targetAlias = 'rbat';
  const linkConditions: string[] = [];
  let areAllTargetsOpen = true;

  for (const [targetObjectName, targetColumnName] of Object.entries(
    ROBOOST_ACTIVITY_TARGET_COLUMNS,
  )) {
    const targetPermissions = subject.permissions.objects[targetObjectName];

    if (!isDefined(targetPermissions) || !targetPermissions.enabled) {
      areAllTargetsOpen = false;
      continue;
    }

    const recordAlias = `rbat_${targetObjectName}`;
    const recordCondition = isDefined(targetPermissions.view)
      ? buildOwnedRecordCondition({
          alias: recordAlias,
          objectNameSingular: targetObjectName,
          setting: targetPermissions.view,
          context,
        })
      : OPEN;

    if (recordCondition.kind === 'open') {
      linkConditions.push(
        `${column(targetAlias, targetColumnName)} IS NOT NULL`,
      );
      continue;
    }

    areAllTargetsOpen = false;

    if (recordCondition.kind === 'gated') {
      linkConditions.push(
        `${column(targetAlias, targetColumnName)} IN (SELECT ${column(recordAlias, 'id')} FROM ${table(context.schemaName, targetObjectName)} ${escapeIdentifier(recordAlias)} WHERE ${recordCondition.sql})`,
      );
    }
  }

  if (areAllTargetsOpen) {
    return OPEN;
  }

  // Links to objects without record-level access (products, custom objects, ...) never hide the activity
  linkConditions.push(
    `(${Object.values(ROBOOST_ACTIVITY_TARGET_COLUMNS)
      .map(
        (targetColumnName) =>
          `${column(targetAlias, targetColumnName)} IS NULL`,
      )
      .join(' AND ')})`,
  );

  const linkedCondition = `EXISTS (SELECT 1 FROM ${table(context.schemaName, activityOwnership.targetTableName)} ${escapeIdentifier(targetAlias)} WHERE ${column(targetAlias, activityOwnership.targetForeignKey)} = ${column(alias, 'id')} AND ${column(targetAlias, 'deletedAt')} IS NULL AND ${orJoin(linkConditions)})`;

  return {
    kind: 'gated',
    sql: orJoin([
      buildMemberColumnsCondition({
        alias,
        memberColumns: activityMemberColumns(objectNameSingular),
        scope: 'OWN',
        context,
      }),
      linkedCondition,
    ]),
    parameters: {},
  };
};

const buildActivityWriteCondition = ({
  alias,
  objectNameSingular,
  setting,
  context,
}: {
  alias: string;
  objectNameSingular: string;
  setting: RoboostScopeSetting | undefined;
  context: ScopeContext;
}): RoboostRecordAccessCondition => {
  if (!isDefined(setting) || setting.scope === 'NONE') {
    return DENIED;
  }

  if (setting.scope === 'ALL') {
    return OPEN;
  }

  return {
    kind: 'gated',
    sql: buildMemberColumnsCondition({
      alias,
      memberColumns: activityMemberColumns(objectNameSingular),
      scope: setting.scope,
      context,
    }),
    parameters: {},
  };
};

const isAnyToggleOn = (
  permissions: RoboostUserPermissions,
  toggleKeys: string[] | undefined,
) =>
  !isDefined(toggleKeys) ||
  toggleKeys.some((toggleKey) => permissions.toggles[toggleKey] === true);

const toSettingKey = (operationType: OperationType) => {
  switch (operationType) {
    case 'select':
      return 'view';
    case 'insert':
      return 'create';
    case 'update':
      return 'edit';
    case 'delete':
    case 'soft-delete':
    case 'restore':
      return 'delete';
  }
};

// Per-user record access on top of the user's private role; the role already decides object-level access
export const buildRoboostRecordAccessCondition = ({
  subject,
  objectNameSingular,
  operationType,
  alias,
  schemaName,
}: {
  subject: RoboostRecordAccessSubject;
  objectNameSingular: string;
  operationType: OperationType;
  alias: string;
  schemaName: string;
}): RoboostRecordAccessCondition => {
  const settingKey = toSettingKey(operationType);
  const toggleObjectPermission =
    ROBOOST_TOGGLE_OBJECT_PERMISSIONS[objectNameSingular];

  if (isDefined(toggleObjectPermission)) {
    return isAnyToggleOn(
      subject.permissions,
      toggleObjectPermission[settingKey],
    )
      ? OPEN
      : DENIED;
  }

  const objectPermissions = subject.permissions.objects[objectNameSingular];

  if (!isDefined(objectPermissions) || operationType === 'insert') {
    return OPEN;
  }

  const context: ScopeContext = {
    schemaName,
    memberParameter: ROBOOST_RECORD_ACCESS_MEMBER_PARAMETER,
  };

  const withMemberParameter = (
    condition: RoboostRecordAccessCondition,
  ): RoboostRecordAccessCondition =>
    condition.kind === 'gated'
      ? {
          ...condition,
          parameters: {
            [ROBOOST_RECORD_ACCESS_MEMBER_PARAMETER]: subject.workspaceMemberId,
          },
        }
      : condition;

  if (!objectPermissions.enabled) {
    return DENIED;
  }

  if (isDefined(ROBOOST_ACTIVITY_OWNERSHIP[objectNameSingular])) {
    return withMemberParameter(
      settingKey === 'view'
        ? buildActivityViewCondition({
            alias,
            objectNameSingular,
            subject,
            context,
          })
        : buildActivityWriteCondition({
            alias,
            objectNameSingular,
            setting:
              settingKey === 'edit'
                ? objectPermissions.edit
                : objectPermissions.delete,
            context,
          }),
    );
  }

  const setting =
    settingKey === 'view'
      ? objectPermissions.view
      : settingKey === 'edit'
        ? objectPermissions.edit
        : objectPermissions.delete;

  if (!isDefined(setting)) {
    return OPEN;
  }

  return withMemberParameter(
    buildOwnedRecordCondition({
      alias,
      objectNameSingular,
      setting,
      context,
    }),
  );
};

export const isRoboostCreateAllowed = ({
  subject,
  objectNameSingular,
}: {
  subject: RoboostRecordAccessSubject;
  objectNameSingular: string;
}): boolean => {
  const toggleObjectPermission =
    ROBOOST_TOGGLE_OBJECT_PERMISSIONS[objectNameSingular];

  if (isDefined(toggleObjectPermission)) {
    return isAnyToggleOn(subject.permissions, toggleObjectPermission.create);
  }

  const objectPermissions = subject.permissions.objects[objectNameSingular];

  if (!isDefined(objectPermissions)) {
    return true;
  }

  return objectPermissions.enabled && objectPermissions.create === true;
};

// Merge is its own scope (Merge setting) and needs the object turned on
export const buildRoboostMergeCondition = ({
  subject,
  objectNameSingular,
  alias,
  schemaName,
}: {
  subject: RoboostRecordAccessSubject;
  objectNameSingular: string;
  alias: string;
  schemaName: string;
}): RoboostRecordAccessCondition => {
  const objectPermissions = subject.permissions.objects[objectNameSingular];

  if (!isDefined(objectPermissions)) {
    return OPEN;
  }

  if (!objectPermissions.enabled || !isDefined(objectPermissions.merge)) {
    return DENIED;
  }

  const condition = buildOwnedRecordCondition({
    alias,
    objectNameSingular,
    setting: objectPermissions.merge,
    context: {
      schemaName,
      memberParameter: ROBOOST_RECORD_ACCESS_MEMBER_PARAMETER,
    },
  });

  return condition.kind === 'gated'
    ? {
        ...condition,
        parameters: {
          [ROBOOST_RECORD_ACCESS_MEMBER_PARAMETER]: subject.workspaceMemberId,
        },
      }
    : condition;
};
