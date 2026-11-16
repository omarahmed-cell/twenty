import { Injectable } from '@nestjs/common';

import { msg } from '@lingui/core/macro';
import { isNonEmptyString } from '@sniptt/guards';
import { FieldMetadataType, RelationType } from 'twenty-shared/types';
import { type ConditionalLogicField, isDefined } from 'twenty-shared/utils';
import { In } from 'typeorm';

import { getFlatFieldsFromFlatObjectMetadata } from 'src/engine/api/graphql/workspace-schema-builder/utils/get-flat-fields-for-flat-object-metadata.util';
import {
  CommonQueryRunnerException,
  CommonQueryRunnerExceptionCode,
} from 'src/engine/api/common/common-query-runners/errors/common-query-runner.exception';
import { computeMorphOrRelationFieldJoinColumnName } from 'src/engine/metadata-modules/field-metadata/utils/compute-morph-or-relation-field-join-column-name.util';
import { findFlatEntityByIdInFlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/utils/find-flat-entity-by-id-in-flat-entity-maps.util';
import { isMorphOrRelationFlatFieldMetadata } from 'src/engine/metadata-modules/flat-field-metadata/utils/is-morph-or-relation-flat-field-metadata.util';
import { getWorkspaceContext } from 'src/engine/twenty-orm/storage/orm-workspace-context.storage';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';
import { WorkspaceOrmManager } from 'src/engine/twenty-orm/workspace-orm.manager';
import { type PipelineConfig } from 'src/modules/pipeline/types/pipeline-config.type';
import { type DealRuleActorKind } from 'src/modules/pipeline/utils/evaluate-deal-pipeline-rules.util';
import {
  type DealStageEntryViolation,
  evaluateDealStageEntry,
  findEnteredDealStage,
} from 'src/modules/pipeline/utils/evaluate-deal-stage-entry.util';

type DealStageValues = { pipeline: string | null; stage: string | null };

export type DealStageEntry = {
  recordId?: string;
  current?: DealStageValues;
  next: DealStageValues;
  data: Record<string, unknown>;
};

const toRefusal = ({
  operation,
  stageLabel,
  missingFieldLabels,
}: DealStageEntryViolation) => {
  const fieldLabels = missingFieldLabels.join(', ');

  return operation === 'create'
    ? {
        message: `To create a deal in ${stageLabel}, fill: ${fieldLabels}.`,
        userFriendlyMessage: msg`To create a deal in ${stageLabel}, fill: ${fieldLabels}.`,
      }
    : {
        message: `To move to ${stageLabel}, fill: ${fieldLabels}.`,
        userFriendlyMessage: msg`To move to ${stageLabel}, fill: ${fieldLabels}.`,
      };
};

@Injectable()
export class DealStageEntryRulesService {
  constructor(private readonly workspaceOrmManager: WorkspaceOrmManager) {}

  async enforce({
    workspaceId,
    actorKind,
    operation,
    pipelines,
    entries,
  }: {
    workspaceId: string;
    actorKind: DealRuleActorKind;
    operation: 'create' | 'update';
    pipelines: PipelineConfig[];
    entries: DealStageEntry[];
  }): Promise<void> {
    if (actorKind !== 'ADMIN' && actorKind !== 'MEMBER') {
      return;
    }

    // Most writes don't enter a stage with rules, so nothing else is loaded for them
    const checkedEntries = entries.filter((entry) =>
      isDefined(
        findEnteredDealStage({
          operation,
          pipelines,
          current: entry.current,
          next: entry.next,
        }),
      ),
    );

    if (checkedEntries.length === 0) {
      return;
    }

    await this.workspaceOrmManager.executeInWorkspaceContext(async () => {
      const fields = this.getDealFields();
      const storedById = await this.findStoredDeals(
        operation === 'update'
          ? checkedEntries
              .map(({ recordId }) => recordId)
              .filter(isNonEmptyString)
          : [],
      );

      for (const entry of checkedEntries) {
        const stored = isNonEmptyString(entry.recordId)
          ? storedById.get(entry.recordId)
          : undefined;
        const violation = evaluateDealStageEntry({
          operation,
          actorKind,
          pipelines,
          current: entry.current,
          next: entry.next,
          record: { ...stored, ...entry.data, ...entry.next },
          fields,
        });

        if (isDefined(violation)) {
          const { message, userFriendlyMessage } = toRefusal(violation);

          throw new CommonQueryRunnerException(
            message,
            CommonQueryRunnerExceptionCode.BAD_REQUEST,
            { userFriendlyMessage },
          );
        }
      }
    }, buildSystemAuthContext(workspaceId));
  }

  private getDealFields(): ConditionalLogicField[] {
    const {
      flatObjectMetadataMaps,
      flatFieldMetadataMaps,
      objectIdByNameSingular,
    } = getWorkspaceContext();
    const dealObjectMetadata = findFlatEntityByIdInFlatEntityMaps({
      flatEntityId: objectIdByNameSingular['opportunity'],
      flatEntityMaps: flatObjectMetadataMaps,
    });

    if (!isDefined(dealObjectMetadata)) {
      return [];
    }

    return getFlatFieldsFromFlatObjectMetadata(
      dealObjectMetadata,
      flatFieldMetadataMaps,
    ).flatMap((field): ConditionalLogicField[] => {
      if (!isMorphOrRelationFlatFieldMetadata(field)) {
        return [{ name: field.name, label: field.label, type: field.type }];
      }

      if (
        field.type !== FieldMetadataType.RELATION ||
        field.settings.relationType !== RelationType.MANY_TO_ONE
      ) {
        return [];
      }

      return [
        {
          name: field.name,
          label: field.label,
          type: field.type,
          joinColumnName:
            field.settings.joinColumnName ??
            computeMorphOrRelationFieldJoinColumnName({ name: field.name }),
        },
      ];
    });
  }

  private async findStoredDeals(ids: string[]) {
    if (ids.length === 0) {
      return new Map<string, Record<string, unknown>>();
    }

    const dealRepository = this.workspaceOrmManager.getRepository<
      Record<string, unknown> & { id: string }
    >('opportunity', { shouldBypassPermissionChecks: true });
    const deals = await dealRepository.find({ where: { id: In(ids) } });

    return new Map(deals.map((deal) => [deal.id, deal]));
  }
}
