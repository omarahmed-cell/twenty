import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';

import { isDefined } from 'twenty-shared/utils';
import { DataSource } from 'typeorm';

import { getWorkspaceSchemaName } from 'src/engine/workspace-datasource/utils/get-workspace-schema-name.util';
import { type RoboostMergeActor } from 'src/modules/roboost-merge/types/roboost-merge.type';

@Injectable()
export class RoboostMergeActorService {
  constructor(
    @InjectDataSource()
    private readonly coreDataSource: DataSource,
  ) {}

  async resolve(
    workspaceId: string,
    workspaceMemberId: string | undefined,
  ): Promise<RoboostMergeActor> {
    if (!isDefined(workspaceMemberId)) {
      return { workspaceMemberId: null, name: null };
    }

    const rows: { name: string }[] = await this.coreDataSource.query(
      `SELECT trim(concat_ws(' ', "nameFirstName", "nameLastName")) AS name FROM "${getWorkspaceSchemaName(workspaceId)}"."workspaceMember" WHERE id = $1`,
      [workspaceMemberId],
    );

    return { workspaceMemberId, name: rows[0]?.name || null };
  }
}
