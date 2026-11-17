import { isNonEmptyString } from '@sniptt/guards';

import {
  WORKSPACE_MEMBER_STATUS,
  type WorkspaceMemberStatus,
} from 'src/modules/workspace-member/constants/workspace-member-status.constant';
import { normalizeWorkspaceMemberEmail } from 'src/modules/workspace-member/utils/normalize-workspace-member-email.util';
import { splitMemberName } from 'src/modules/workspace-member-pre-create/utils/split-member-name.util';

export type PlannedPreCreatedWorkspaceMember = {
  email: string;
  firstName: string;
  lastName: string;
  memberStatus: WorkspaceMemberStatus;
};

export type WorkspaceMemberPreCreationPlan = {
  toCreate: PlannedPreCreatedWorkspaceMember[];
  existingEmails: string[];
  skippedRowCount: number;
  statusConflictEmails: string[];
  invalidStatusRows: { email: string; status: string }[];
};

const CSV_STATUS_BY_VALUE: Record<string, WorkspaceMemberStatus | 'SKIP'> = {
  active: WORKSPACE_MEMBER_STATUS.ACTIVE,
  deactivated: WORKSPACE_MEMBER_STATUS.DEACTIVATED,
  skip: 'SKIP',
};

const getRowStatusValue = (row: Record<string, string>): string =>
  (isNonEmptyString(row.twenty_status) ? row.twenty_status : (row.status ?? ''))
    .trim()
    .toLowerCase();

export const planWorkspaceMemberPreCreation = ({
  rows,
  existingWorkspaceMemberEmails,
}: {
  rows: Record<string, string>[];
  existingWorkspaceMemberEmails: Set<string>;
}): WorkspaceMemberPreCreationPlan => {
  const plannedByEmail = new Map<string, PlannedPreCreatedWorkspaceMember>();
  const statusConflictEmails = new Set<string>();
  const invalidStatusRows: { email: string; status: string }[] = [];
  let skippedRowCount = 0;

  for (const row of rows) {
    const email = normalizeWorkspaceMemberEmail(row.email ?? '');
    const statusValue = getRowStatusValue(row);
    const status = CSV_STATUS_BY_VALUE[statusValue];

    if (!isNonEmptyString(email) || status === 'SKIP') {
      skippedRowCount++;
      continue;
    }

    if (status === undefined) {
      invalidStatusRows.push({ email, status: statusValue });
      skippedRowCount++;
      continue;
    }

    const planned = plannedByEmail.get(email);

    if (planned === undefined) {
      const { firstName, lastName } = splitMemberName(row.name ?? '');

      plannedByEmail.set(email, {
        email,
        firstName: isNonEmptyString(firstName)
          ? firstName
          : email.split('@')[0],
        lastName,
        memberStatus: status,
      });
      continue;
    }

    if (planned.memberStatus !== status) {
      statusConflictEmails.add(email);
      planned.memberStatus = WORKSPACE_MEMBER_STATUS.ACTIVE;
    }
  }

  const normalizedExistingEmails = new Set(
    [...existingWorkspaceMemberEmails].map(normalizeWorkspaceMemberEmail),
  );

  const planned = [...plannedByEmail.values()];

  return {
    toCreate: planned.filter(
      ({ email }) => !normalizedExistingEmails.has(email),
    ),
    existingEmails: planned
      .filter(({ email }) => normalizedExistingEmails.has(email))
      .map(({ email }) => email),
    skippedRowCount,
    statusConflictEmails: [...statusConflictEmails],
    invalidStatusRows,
  };
};
