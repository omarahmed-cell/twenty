import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  createDefaultRoboostScoreCriteria,
  isDefined,
  parseRoboostScoreCriteria,
  ROBOOST_SCORE_OBJECT_NAMES,
  type RoboostScoreBreakdown,
  type RoboostScoreCriteria,
  type RoboostScoreObjectName,
  validateRoboostScoreCriteria,
} from 'twenty-shared/utils';

import { InjectMessageQueue } from 'src/engine/core-modules/message-queue/decorators/message-queue.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { MessageQueueService } from 'src/engine/core-modules/message-queue/services/message-queue.service';
import {
  RoboostScoreRecalcJob,
  type RoboostScoreRecalcJobData,
} from 'src/modules/roboost-scoring/jobs/roboost-score-recalc.job';
import { RoboostScoreEngineService } from 'src/modules/roboost-scoring/services/roboost-score-engine.service';
import { RoboostScorePropertyService } from 'src/modules/roboost-scoring/services/roboost-score-property.service';
import { RoboostScoreRecalcService } from 'src/modules/roboost-scoring/services/roboost-score-recalc.service';
import { RoboostScoreStoreService } from 'src/modules/roboost-scoring/services/roboost-score-store.service';
import { type RoboostScoreRow } from 'src/modules/roboost-scoring/types/roboost-score.type';

export type RoboostScorePropertyChoice =
  | { mode: 'new'; label: string }
  | { mode: 'existing'; fieldMetadataId: string };

type Scope = { workspaceId: string; workspaceMemberId: string };

export type RoboostScoreTestResult = {
  breakdown: RoboostScoreBreakdown;
  record: Record<string, unknown>;
  publishedValue: number | null;
  publishedVersionNumber: number | null;
  frozen: boolean;
  frozenAt: string | null;
  frozenVersionNumber: number | null;
  resultSource: string | null;
};

@Injectable()
export class RoboostScoreService {
  constructor(
    private readonly roboostScoreStoreService: RoboostScoreStoreService,
    private readonly roboostScorePropertyService: RoboostScorePropertyService,
    private readonly roboostScoreEngineService: RoboostScoreEngineService,
    private readonly roboostScoreRecalcService: RoboostScoreRecalcService,
    @InjectMessageQueue(MessageQueue.workspaceQueue)
    private readonly messageQueueService: MessageQueueService,
  ) {}

  async assertAdmin({ workspaceId, workspaceMemberId }: Scope) {
    if (
      !(await this.roboostScoreStoreService.canEditScores(
        workspaceId,
        workspaceMemberId,
      ))
    ) {
      throw new ForbiddenException(
        'Creating and editing scores is turned off for this user',
      );
    }

    return this.roboostScoreStoreService.getMemberActor(
      workspaceId,
      workspaceMemberId,
    );
  }

  async getScoreOrThrow(workspaceId: string, scoreId: string) {
    const score = await this.roboostScoreStoreService.getScore(
      workspaceId,
      scoreId,
    );

    if (!isDefined(score)) {
      throw new NotFoundException('Score not found');
    }

    return score;
  }

  private assertObjectName(objectName: string): RoboostScoreObjectName {
    if (
      !ROBOOST_SCORE_OBJECT_NAMES.includes(objectName as RoboostScoreObjectName)
    ) {
      throw new BadRequestException(
        'Scores can be made for contacts, companies or deals',
      );
    }

    return objectName as RoboostScoreObjectName;
  }

  private async attachProperty({
    workspaceId,
    score,
    property,
  }: {
    workspaceId: string;
    score: RoboostScoreRow;
    property: RoboostScorePropertyChoice;
  }): Promise<string> {
    if (property.mode === 'new') {
      const field = await this.roboostScorePropertyService.createProperty({
        workspaceId,
        objectName: score.objectName,
        label: property.label,
        scoreId: score.id,
        scoreName: score.name,
      });

      return field.id;
    }
    const linkedFieldIds =
      await this.roboostScoreStoreService.listLinkedFieldIds(workspaceId);
    const eligible = await this.roboostScorePropertyService.listEligibleFields(
      workspaceId,
      score.objectName,
      linkedFieldIds,
    );
    const field = await this.roboostScorePropertyService.getField(
      workspaceId,
      score.objectName,
      property.fieldMetadataId,
    );

    if (
      !isDefined(field) ||
      !eligible.some(({ id }) => id === property.fieldMetadataId)
    ) {
      throw new BadRequestException(
        'This property cannot be used: pick a Number property that no other score uses',
      );
    }
    await this.roboostScorePropertyService.linkExistingField({
      workspaceId,
      field,
      scoreId: score.id,
      objectMetadataId:
        await this.roboostScorePropertyService.getObjectMetadataId(
          workspaceId,
          score.objectName,
        ),
    });
    await this.roboostScoreStoreService.updateScore(workspaceId, score.id, {
      linkedFieldMetadataId: field.id,
    });
    await this.roboostScoreRecalcService.freezeImportedClosedWon(
      workspaceId,
      score.id,
    );

    return field.id;
  }

  async createScore({
    scope,
    name,
    objectName,
    property,
    cloneFromScoreId,
    defaultGroupName,
  }: {
    scope: Scope;
    name: string;
    objectName: string;
    property: RoboostScorePropertyChoice;
    cloneFromScoreId?: string | null;
    defaultGroupName: string;
  }): Promise<RoboostScoreRow> {
    const actor = await this.assertAdmin(scope);
    const trimmedName = name.trim();

    if (trimmedName === '') {
      throw new BadRequestException('A score name is required');
    }
    const source = isDefined(cloneFromScoreId)
      ? await this.getScoreOrThrow(scope.workspaceId, cloneFromScoreId)
      : null;
    const score = await this.roboostScoreStoreService.createScore({
      workspaceId: scope.workspaceId,
      name: trimmedName.slice(0, 200),
      objectName: isDefined(source)
        ? source.objectName
        : this.assertObjectName(objectName),
      linkedFieldMetadataId: null,
      draft:
        source?.draft ?? createDefaultRoboostScoreCriteria(defaultGroupName),
      actor,
    });

    try {
      const linkedFieldMetadataId = await this.attachProperty({
        workspaceId: scope.workspaceId,
        score,
        property,
      });

      await this.roboostScoreStoreService.updateScore(
        scope.workspaceId,
        score.id,
        {
          linkedFieldMetadataId,
          ...(isDefined(source)
            ? {
                description: source.description,
                freezeOnClosedWon: source.freezeOnClosedWon,
              }
            : {}),
        },
      );
    } catch (error) {
      await this.roboostScoreStoreService.deleteScore(
        scope.workspaceId,
        score.id,
      );
      throw error;
    }

    return this.getScoreOrThrow(scope.workspaceId, score.id);
  }

  async saveDraft({
    scope,
    scoreId,
    draft,
    name,
    description,
    freezeOnClosedWon,
  }: {
    scope: Scope;
    scoreId: string;
    draft?: unknown;
    name?: string | null;
    description?: string | null;
    freezeOnClosedWon?: boolean | null;
  }) {
    const actor = await this.assertAdmin(scope);
    const score = await this.getScoreOrThrow(scope.workspaceId, scoreId);
    const trimmedName = name?.trim();

    if (trimmedName === '') {
      throw new BadRequestException('A score name is required');
    }
    await this.roboostScoreStoreService.updateScore(
      scope.workspaceId,
      scoreId,
      {
        ...(isDefined(draft)
          ? {
              draft: parseRoboostScoreCriteria(draft),
              hasDraftChanges:
                !isDefined(score.publishedVersionId) ||
                JSON.stringify(parseRoboostScoreCriteria(draft)) !==
                  JSON.stringify(
                    (
                      await this.roboostScoreStoreService.getVersion(
                        scope.workspaceId,
                        score.publishedVersionId,
                      )
                    )?.criteria,
                  ),
            }
          : {}),
        ...(isDefined(trimmedName) ? { name: trimmedName.slice(0, 200) } : {}),
        ...(description !== undefined
          ? { description: description?.trim() || null }
          : {}),
        ...(isDefined(freezeOnClosedWon) && score.objectName === 'opportunity'
          ? { freezeOnClosedWon }
          : {}),
      },
      actor,
    );

    return this.getScoreOrThrow(scope.workspaceId, scoreId);
  }

  async queueFullRecalc(
    workspaceId: string,
    scoreId: string,
    mode: 'full' | 'verify' = 'full',
  ) {
    await this.roboostScoreStoreService.setRecalcProgress(
      workspaceId,
      scoreId,
      {
        status: 'RUNNING',
        total: 0,
      },
    );
    await this.messageQueueService.add<RoboostScoreRecalcJobData>(
      RoboostScoreRecalcJob.name,
      { workspaceId, scoreId, mode },
    );
  }

  async publish({
    scope,
    scoreId,
    draft,
    note,
  }: {
    scope: Scope;
    scoreId: string;
    draft: unknown;
    note?: string | null;
  }) {
    const actor = await this.assertAdmin(scope);
    const score = await this.getScoreOrThrow(scope.workspaceId, scoreId);

    if (!isDefined(score.linkedFieldMetadataId)) {
      throw new BadRequestException('Pick a score property before publishing');
    }
    const criteria = parseRoboostScoreCriteria(draft ?? score.draft);
    const fields = await this.roboostScoreEngineService.runInWorkspace(
      scope.workspaceId,
      async () =>
        this.roboostScoreEngineService.getObjectFields(score.objectName),
    );
    const validation = validateRoboostScoreCriteria(
      criteria,
      (fieldName) => fields.get(fieldName)?.type === 'MULTI_SELECT',
    );

    if (!validation.isValid) {
      throw new BadRequestException(
        'The criteria have incomplete rules or group limits that are exceeded',
      );
    }
    const version = await this.roboostScoreStoreService.publishVersion({
      workspaceId: scope.workspaceId,
      scoreId,
      criteria,
      note: note?.trim() || null,
      actor,
    });

    await this.queueFullRecalc(scope.workspaceId, scoreId);

    return {
      score: await this.getScoreOrThrow(scope.workspaceId, scoreId),
      version,
    };
  }

  async setActive({
    scope,
    scoreId,
    isActive,
  }: {
    scope: Scope;
    scoreId: string;
    isActive: boolean;
  }) {
    const actor = await this.assertAdmin(scope);
    const score = await this.getScoreOrThrow(scope.workspaceId, scoreId);

    if (isActive && !isDefined(score.publishedVersionId)) {
      throw new BadRequestException(
        'Create the score first: it has no published version yet',
      );
    }
    await this.roboostScoreStoreService.updateScore(
      scope.workspaceId,
      scoreId,
      { isActive },
      actor,
    );
    if (isActive) {
      await this.queueFullRecalc(scope.workspaceId, scoreId);
    }

    return this.getScoreOrThrow(scope.workspaceId, scoreId);
  }

  async recalculateNow(scope: Scope, scoreId: string) {
    await this.assertAdmin(scope);
    const score = await this.getScoreOrThrow(scope.workspaceId, scoreId);

    if (!score.isActive || !isDefined(score.publishedVersionId)) {
      throw new BadRequestException(
        'Only a score that is on can be recalculated',
      );
    }
    await this.queueFullRecalc(scope.workspaceId, scoreId);

    return this.getScoreOrThrow(scope.workspaceId, scoreId);
  }

  async deleteScore({
    scope,
    scoreId,
    deleteProperty,
  }: {
    scope: Scope;
    scoreId: string;
    deleteProperty: boolean;
  }) {
    await this.assertAdmin(scope);
    const score = await this.getScoreOrThrow(scope.workspaceId, scoreId);

    await this.roboostScoreStoreService.deleteScore(scope.workspaceId, scoreId);
    if (isDefined(score.linkedFieldMetadataId)) {
      if (deleteProperty) {
        await this.roboostScorePropertyService.deleteField(
          scope.workspaceId,
          score.objectName,
          score.linkedFieldMetadataId,
        );
      } else {
        await this.roboostScorePropertyService.unlinkField(
          scope.workspaceId,
          score.objectName,
          score.linkedFieldMetadataId,
        );
      }
    }

    return true;
  }

  async changeProperty({
    scope,
    scoreId,
    property,
  }: {
    scope: Scope;
    scoreId: string;
    property: RoboostScorePropertyChoice;
  }) {
    const actor = await this.assertAdmin(scope);
    const score = await this.getScoreOrThrow(scope.workspaceId, scoreId);
    const previousFieldId = score.linkedFieldMetadataId;
    const linkedFieldMetadataId = await this.attachProperty({
      workspaceId: scope.workspaceId,
      score,
      property,
    });

    await this.roboostScoreStoreService.updateScore(
      scope.workspaceId,
      scoreId,
      { linkedFieldMetadataId, hasDraftChanges: true },
      actor,
    );
    if (
      isDefined(previousFieldId) &&
      previousFieldId !== linkedFieldMetadataId
    ) {
      await this.roboostScorePropertyService.unlinkField(
        scope.workspaceId,
        score.objectName,
        previousFieldId,
      );
    }

    return this.getScoreOrThrow(scope.workspaceId, scoreId);
  }

  async restoreVersionAsDraft(
    scope: Scope,
    scoreId: string,
    versionId: string,
  ) {
    const actor = await this.assertAdmin(scope);
    const version = await this.roboostScoreStoreService.getVersion(
      scope.workspaceId,
      versionId,
    );

    if (!isDefined(version) || version.scoreId !== scoreId) {
      throw new NotFoundException('Version not found');
    }
    await this.roboostScoreStoreService.updateScore(
      scope.workspaceId,
      scoreId,
      { draft: version.criteria, hasDraftChanges: true },
      actor,
    );

    return this.getScoreOrThrow(scope.workspaceId, scoreId);
  }

  async eligibleFields(workspaceId: string, objectName: string) {
    return this.roboostScorePropertyService.listEligibleFields(
      workspaceId,
      this.assertObjectName(objectName),
      await this.roboostScoreStoreService.listLinkedFieldIds(workspaceId),
    );
  }

  // Uses the editor's criteria as they are, unsaved changes included; nothing is written
  async testRecord({
    workspaceId,
    scoreId,
    criteria,
    recordId,
  }: {
    workspaceId: string;
    scoreId: string;
    criteria: unknown;
    recordId: string;
  }): Promise<RoboostScoreTestResult> {
    const score = await this.getScoreOrThrow(workspaceId, scoreId);
    const parsedCriteria: RoboostScoreCriteria =
      parseRoboostScoreCriteria(criteria);
    const breakdown = (
      await this.roboostScoreEngineService.evaluate(
        workspaceId,
        score.objectName,
        parsedCriteria,
        [recordId],
      )
    ).get(recordId);
    const record = await this.roboostScoreEngineService.readRecord(
      workspaceId,
      score.objectName,
      recordId,
    );

    if (!isDefined(breakdown) || !isDefined(record)) {
      throw new NotFoundException('Record not found');
    }
    const published = (
      await this.roboostScoreStoreService.getResults(workspaceId, scoreId, [
        recordId,
      ])
    ).get(recordId);
    const isClosedWon =
      score.objectName === 'opportunity' &&
      (
        await this.roboostScoreRecalcService.findClosedWonIds(workspaceId, [
          recordId,
        ])
      ).has(recordId);

    return {
      breakdown,
      record,
      publishedValue: published?.value ?? null,
      publishedVersionNumber: published?.versionNumber ?? null,
      frozen: published?.frozen === true && isClosedWon,
      frozenAt: published?.frozenAt ?? null,
      frozenVersionNumber: published?.frozen ? published.versionNumber : null,
      resultSource: published?.source ?? null,
    };
  }

  async explainRecord(
    workspaceId: string,
    fieldMetadataId: string,
    recordId: string,
  ) {
    const score = await this.roboostScoreStoreService.findScoreByLinkedField(
      workspaceId,
      fieldMetadataId,
    );

    if (!isDefined(score)) {
      return null;
    }
    const result = (
      await this.roboostScoreStoreService.getResults(workspaceId, score.id, [
        recordId,
      ])
    ).get(recordId);
    const version = isDefined(result?.versionId)
      ? await this.roboostScoreStoreService.getVersion(
          workspaceId,
          result.versionId,
        )
      : null;

    return { score, result: result ?? null, version };
  }
}
