import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';

import { isDefined } from 'twenty-shared/utils';
import { DataSource } from 'typeorm';

import { UserVarsService } from 'src/engine/core-modules/user/user-vars/services/user-vars.service';
import { getWorkspaceSchemaName } from 'src/engine/workspace-datasource/utils/get-workspace-schema-name.util';
import {
  RoboostDataTransferService,
  type RoboostExportRow,
  type RoboostImportRow,
} from 'src/modules/roboost-notification/services/roboost-data-transfer.service';
import { RoboostNotificationService } from 'src/modules/roboost-notification/services/roboost-notification.service';

export const LARGE_EXPORT_THRESHOLD_USER_VAR = 'roboost.largeExportThreshold';
export const DEFAULT_LARGE_EXPORT_THRESHOLD = 10_000;
export const IMPORT_EXPORT_SETTINGS_PATH =
  '/settings/data-management/import-export';

@Injectable()
export class RoboostDataTransferNotificationService {
  constructor(
    @InjectDataSource()
    private readonly coreDataSource: DataSource,
    private readonly userVarsService: UserVarsService,
    private readonly roboostNotificationService: RoboostNotificationService,
    private readonly roboostDataTransferService: RoboostDataTransferService,
  ) {}

  // Each admin sets their own threshold, so the same export can alert one admin and not another
  private async getThreshold(workspaceId: string, workspaceMemberId: string) {
    const [member]: { userId: string | null }[] =
      await this.coreDataSource.query(
        `SELECT "userId" FROM "${getWorkspaceSchemaName(workspaceId)}"."workspaceMember" WHERE id = $1`,
        [workspaceMemberId],
      );

    if (!isDefined(member?.userId)) {
      return DEFAULT_LARGE_EXPORT_THRESHOLD;
    }

    const saved = await this.userVarsService.get({
      userId: member.userId,
      workspaceId,
      key: LARGE_EXPORT_THRESHOLD_USER_VAR,
    });

    return typeof saved === 'number' && saved > 0
      ? saved
      : DEFAULT_LARGE_EXPORT_THRESHOLD;
  }

  async notifyExport({
    workspaceId,
    exportRow,
  }: {
    workspaceId: string;
    exportRow: RoboostExportRow;
  }) {
    if (isDefined(exportRow.workspaceMemberId)) {
      await this.roboostNotificationService.notify({
        workspaceId,
        recipientWorkspaceMemberId: exportRow.workspaceMemberId,
        type: 'export',
        subtype: 'export_ready',
        title: `Your export "${exportRow.name}" has been delivered`,
        body: 'Your file is ready to download.',
        actorWorkspaceMemberId: exportRow.workspaceMemberId,
        actorName: exportRow.userName,
        target: {
          path: `${IMPORT_EXPORT_SETTINGS_PATH}?export=${exportRow.id}`,
          downloadUrl: `roboost-export:${exportRow.id}`,
          actionLabel: 'View export audit',
        },
      });
    }

    const adminIds =
      await this.roboostDataTransferService.getAdminMemberIds(workspaceId);
    const exporterName = exportRow.userName || 'Someone';

    for (const adminId of adminIds) {
      if (
        adminId === exportRow.workspaceMemberId ||
        exportRow.recordCount <= (await this.getThreshold(workspaceId, adminId))
      ) {
        continue;
      }

      await this.roboostNotificationService.notify({
        workspaceId,
        recipientWorkspaceMemberId: adminId,
        type: 'export',
        subtype: 'export_large',
        title: `${exporterName} exported ${exportRow.recordCount.toLocaleString('en-US')} records`,
        body: `${exporterName} exported ${exportRow.recordCount.toLocaleString('en-US')} records in "${exportRow.name}".`,
        actorWorkspaceMemberId: exportRow.workspaceMemberId,
        actorName: exporterName,
        target: {
          path: `${IMPORT_EXPORT_SETTINGS_PATH}?export=${exportRow.id}`,
          actionLabel: 'View export audit',
        },
      });
    }
  }

  async notifyImport({
    workspaceId,
    importRow,
  }: {
    workspaceId: string;
    importRow: RoboostImportRow;
  }) {
    if (!isDefined(importRow.workspaceMemberId)) {
      return;
    }

    const title =
      importRow.state === 'FAILED'
        ? `Your import "${importRow.name}" failed`
        : importRow.state === 'DONE_WITH_ERRORS'
          ? `Your import "${importRow.name}" finished with ${importRow.errorCount} errors`
          : `Your import "${importRow.name}" is ready`;
    const body =
      importRow.state === 'FAILED'
        ? 'No records were saved. Open the import for details.'
        : `${importRow.newCount} new and ${importRow.updatedCount} updated records.`;

    await this.roboostNotificationService.notify({
      workspaceId,
      recipientWorkspaceMemberId: importRow.workspaceMemberId,
      type: 'import',
      subtype: importRow.state === 'FAILED' ? 'import_failed' : 'import_done',
      title,
      body,
      actorWorkspaceMemberId: importRow.workspaceMemberId,
      actorName: importRow.createdByName,
      target: {
        path: `${IMPORT_EXPORT_SETTINGS_PATH}?import=${importRow.id}`,
        actionLabel: 'View import',
      },
    });
  }
}
