import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';

import { msg } from '@lingui/core/macro';
import { isDefined } from 'twenty-shared/utils';
import { DataSource } from 'typeorm';

import {
  CommonQueryRunnerException,
  CommonQueryRunnerExceptionCode,
} from 'src/engine/api/common/common-query-runners/errors/common-query-runner.exception';
import { getWorkspaceSchemaName } from 'src/engine/workspace-datasource/utils/get-workspace-schema-name.util';
import { findCompanyParentAssignmentViolation } from 'src/modules/company-hierarchy/utils/find-company-parent-assignment-violation.util';

export type CompanyParentAssignment = {
  companyId?: string;
  domainPrimaryLinkUrl?: string;
  parentCompanyId: string;
};

@Injectable()
export class CompanyHierarchyValidationService {
  constructor(
    @InjectDataSource()
    private readonly coreDataSource: DataSource,
  ) {}

  async assertValidParentAssignments({
    workspaceId,
    assignments,
  }: {
    workspaceId: string;
    assignments: CompanyParentAssignment[];
  }): Promise<void> {
    if (assignments.length === 0) {
      return;
    }

    const companyTable = `"${getWorkspaceSchemaName(workspaceId)}"."company"`;

    const resolvedAssignments = await Promise.all(
      assignments.map(async (assignment) => ({
        ...assignment,
        companyId:
          assignment.companyId ??
          (await this.findCompanyIdByDomain({
            companyTable,
            domainPrimaryLinkUrl: assignment.domainPrimaryLinkUrl,
          })),
      })),
    );

    // Parents set in the same write count before the stored ones
    const pendingParentByCompanyId = new Map<string, string>();

    for (const { companyId, parentCompanyId } of resolvedAssignments) {
      if (isDefined(companyId)) {
        pendingParentByCompanyId.set(companyId, parentCompanyId);
      }
    }

    const getParentCompanyId = async (
      companyId: string,
    ): Promise<string | null> => {
      const pendingParentCompanyId = pendingParentByCompanyId.get(companyId);

      if (isDefined(pendingParentCompanyId)) {
        return pendingParentCompanyId;
      }

      const [row] = await this.coreDataSource.query(
        `SELECT "parentCompanyId" FROM ${companyTable} WHERE "id" = $1`,
        [companyId],
      );

      return row?.parentCompanyId ?? null;
    };

    for (const { companyId, parentCompanyId } of resolvedAssignments) {
      // A company that does not exist yet has no descendants to loop through
      if (!isDefined(companyId)) {
        continue;
      }

      const violation = await findCompanyParentAssignmentViolation({
        companyId,
        newParentCompanyId: parentCompanyId,
        getParentCompanyId,
      });

      if (violation === 'SELF_PARENT') {
        throw new CommonQueryRunnerException(
          'A company cannot be its own parent company',
          CommonQueryRunnerExceptionCode.BAD_REQUEST,
          {
            userFriendlyMessage: msg`A company can't be its own parent company.`,
          },
        );
      }

      if (violation === 'CYCLE') {
        throw new CommonQueryRunnerException(
          'The new parent company is the company itself or one of its child companies',
          CommonQueryRunnerExceptionCode.BAD_REQUEST,
          {
            userFriendlyMessage: msg`This parent company is already one of this company's child companies (directly or further down), so linking them would create a loop.`,
          },
        );
      }
    }
  }

  private async findCompanyIdByDomain({
    companyTable,
    domainPrimaryLinkUrl,
  }: {
    companyTable: string;
    domainPrimaryLinkUrl?: string;
  }): Promise<string | undefined> {
    if (!isDefined(domainPrimaryLinkUrl) || domainPrimaryLinkUrl === '') {
      return undefined;
    }

    const [row] = await this.coreDataSource.query(
      `SELECT "id" FROM ${companyTable} WHERE "domainNamePrimaryLinkUrl" = $1 AND "deletedAt" IS NULL LIMIT 1`,
      [domainPrimaryLinkUrl],
    );

    return row?.id;
  }
}
