import { Injectable } from '@nestjs/common';

import { msg } from '@lingui/core/macro';
import { isNonEmptyString } from '@sniptt/guards';
import {
  type ConditionalLogicField,
  type ConditionalLogicRule,
  describePropertyLogicTrigger,
  findPropertyLogicRuleViolations,
  getPropertyLogicConditionFieldNames,
  isDefined,
  resolveConditionalLogicProperties,
  resolveHiddenPropertyFieldNames,
} from 'twenty-shared/utils';
import { In } from 'typeorm';

import {
  CommonQueryRunnerException,
  CommonQueryRunnerExceptionCode,
} from 'src/engine/api/common/common-query-runners/errors/common-query-runner.exception';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { findFlatEntityByIdInFlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/utils/find-flat-entity-by-id-in-flat-entity-maps.util';
import { getWorkspaceContext } from 'src/engine/twenty-orm/storage/orm-workspace-context.storage';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';
import { WorkspaceOrmManager } from 'src/engine/twenty-orm/workspace-orm.manager';
import { isWorkflowRecordWrite } from 'src/modules/workflow/workflow-executor/workflow-actions/record-crud/utils/workflow-record-write-context.storage';
import {
  PROPERTY_CREATION_OBJECT_NAME,
  PROPERTY_SETTINGS_OBJECT_NAMES,
} from 'src/modules/properties/constants/property-object-names.constant';
import { PropertyLogicConfigService } from 'src/modules/properties/services/property-logic-config.service';
import { buildConditionalLogicFieldsForObject } from 'src/modules/properties/utils/build-conditional-logic-fields-for-object.util';

type RecordData = Record<string, unknown>;

type ObjectRules = {
  rules: ConditionalLogicRule[];
  fields: ConditionalLogicField[];
};

export type PropertyLogicVisibility = {
  hiddenFieldNames: string[];
  requiredFieldNames: string[];
};

const isImportWrite = (data: RecordData) =>
  (data.createdBy as { source?: string } | undefined)?.source === 'IMPORT';

const toRefusal = ({
  trigger,
  missingLabels,
  isBulk,
}: {
  trigger: string;
  missingLabels: string;
  isBulk: boolean;
}) => {
  if (isBulk) {
    return {
      message: `Change these one by one: ${trigger} needs ${missingLabels}.`,
      userFriendlyMessage: msg`Change these one by one: ${trigger} needs ${missingLabels}.`,
    };
  }

  return {
    message: `${trigger} needs: ${missingLabels}.`,
    userFriendlyMessage: msg`${trigger} needs: ${missingLabels}.`,
  };
};

// Conditional logic binds everyone who writes by hand, Admins included; workflows, imports and the server skip it
@Injectable()
export class PropertyLogicEnforcementService {
  constructor(
    private readonly workspaceOrmManager: WorkspaceOrmManager,
    private readonly propertyLogicConfigService: PropertyLogicConfigService,
  ) {}

  async enforceCreate({
    authContext,
    objectName,
    records,
  }: {
    authContext: WorkspaceAuthContext;
    objectName: string;
    records: RecordData[];
  }): Promise<void> {
    if (this.isBypassed(authContext, objectName)) {
      return;
    }

    const checkedRecords = records.filter((record) => !isImportWrite(record));

    if (checkedRecords.length === 0) {
      return;
    }

    await this.inWorkspace(authContext, async () => {
      const objectRules = await this.getObjectRules(
        authContext.workspace.id,
        objectName,
      );

      if (!isDefined(objectRules)) {
        return;
      }

      for (const record of checkedRecords) {
        this.assertNoViolation({
          objectRules,
          previousRecord: null,
          nextRecord: record,
          isBulk: false,
        });
      }
    });
  }

  async enforceUpdate({
    authContext,
    objectName,
    recordIds,
    data,
  }: {
    authContext: WorkspaceAuthContext;
    objectName: string;
    recordIds: string[] | undefined;
    data: RecordData;
  }): Promise<void> {
    if (this.isBypassed(authContext, objectName) || isImportWrite(data)) {
      return;
    }

    await this.inWorkspace(authContext, async () => {
      const objectRules = await this.getObjectRules(
        authContext.workspace.id,
        objectName,
      );

      if (
        !isDefined(objectRules) ||
        !this.touchesConditionField(objectRules, data)
      ) {
        return;
      }

      if (!isDefined(recordIds)) {
        throw new CommonQueryRunnerException(
          'Change these one by one: records changing a controlling property must be selected by id',
          CommonQueryRunnerExceptionCode.BAD_REQUEST,
          { userFriendlyMessage: msg`Change these one by one.` },
        );
      }

      const storedRecords = await this.findRecords(objectName, recordIds);
      const isBulk = storedRecords.length > 1;

      for (const storedRecord of storedRecords) {
        this.assertNoViolation({
          objectRules,
          previousRecord: storedRecord,
          nextRecord: { ...storedRecord, ...data },
          isBulk,
        });
      }
    });
  }

  async getVisibility({
    workspaceId,
    objectName,
    recordId,
  }: {
    workspaceId: string;
    objectName: string;
    recordId: string;
  }): Promise<PropertyLogicVisibility> {
    return this.workspaceOrmManager.executeInWorkspaceContext(async () => {
      const objectRules = await this.getObjectRules(workspaceId, objectName);

      if (!isDefined(objectRules)) {
        return { hiddenFieldNames: [], requiredFieldNames: [] };
      }

      const [record] = await this.findRecords(objectName, [recordId]);
      const shownRequiredFieldNames = resolveConditionalLogicProperties({
        rules: objectRules.rules,
        record: record ?? {},
        fields: objectRules.fields,
      })
        .filter(({ isRequired }) => isRequired)
        .map(({ fieldName }) => fieldName);

      return {
        hiddenFieldNames: [
          ...resolveHiddenPropertyFieldNames({
            expandedRules: objectRules.rules,
            record: record ?? {},
            fields: objectRules.fields,
          }),
        ],
        requiredFieldNames: shownRequiredFieldNames,
      };
    }, buildSystemAuthContext(workspaceId));
  }

  private isBypassed(authContext: WorkspaceAuthContext, objectName: string) {
    return (
      authContext.type === 'system' ||
      isWorkflowRecordWrite() ||
      PROPERTY_SETTINGS_OBJECT_NAMES.has(objectName) ||
      objectName === PROPERTY_CREATION_OBJECT_NAME
    );
  }

  private inWorkspace(
    authContext: WorkspaceAuthContext,
    run: () => Promise<void>,
  ) {
    return this.workspaceOrmManager.executeInWorkspaceContext(
      run,
      buildSystemAuthContext(authContext.workspace.id),
    );
  }

  private async getObjectRules(
    workspaceId: string,
    objectName: string,
  ): Promise<ObjectRules | null> {
    const {
      objectIdByNameSingular,
      flatObjectMetadataMaps,
      flatFieldMetadataMaps,
    } = getWorkspaceContext();
    const objectMetadataId = objectIdByNameSingular[objectName];

    if (!isNonEmptyString(objectMetadataId)) {
      return null;
    }

    const rules = await this.propertyLogicConfigService.getRules({
      workspaceId,
      objectMetadataId,
    });

    if (rules.length === 0) {
      return null;
    }

    const flatObjectMetadata = findFlatEntityByIdInFlatEntityMaps({
      flatEntityId: objectMetadataId,
      flatEntityMaps: flatObjectMetadataMaps,
    });

    if (!isDefined(flatObjectMetadata)) {
      return null;
    }

    return {
      rules,
      fields: buildConditionalLogicFieldsForObject({
        flatObjectMetadata,
        flatFieldMetadataMaps,
      }),
    };
  }

  private touchesConditionField(
    { rules, fields }: ObjectRules,
    data: RecordData,
  ) {
    const fieldByName = new Map(fields.map((field) => [field.name, field]));

    return rules.some((rule) =>
      [...getPropertyLogicConditionFieldNames(rule)].some((fieldName) => {
        const joinColumnName = fieldByName.get(fieldName)?.joinColumnName;

        return (
          fieldName in data ||
          (isDefined(joinColumnName) && joinColumnName in data)
        );
      }),
    );
  }

  private async findRecords(
    objectName: string,
    recordIds: string[],
  ): Promise<RecordData[]> {
    if (recordIds.length === 0) {
      return [];
    }

    const repository = this.workspaceOrmManager.getRepository<
      RecordData & { id: string }
    >(objectName, { shouldBypassPermissionChecks: true });

    return repository.find({ where: { id: In(recordIds) } });
  }

  private assertNoViolation({
    objectRules,
    previousRecord,
    nextRecord,
    isBulk,
  }: {
    objectRules: ObjectRules;
    previousRecord: RecordData | null;
    nextRecord: RecordData;
    isBulk: boolean;
  }) {
    const [violation] = findPropertyLogicRuleViolations({
      expandedRules: objectRules.rules,
      previousRecord,
      nextRecord,
      fields: objectRules.fields,
    });

    if (!isDefined(violation)) {
      return;
    }

    const { message, userFriendlyMessage } = toRefusal({
      trigger: describePropertyLogicTrigger({
        rule: violation.rule,
        record: nextRecord,
        fields: objectRules.fields,
      }),
      missingLabels: violation.missingFields
        .map(({ label }) => label)
        .join(', '),
      isBulk,
    });

    throw new CommonQueryRunnerException(
      message,
      CommonQueryRunnerExceptionCode.BAD_REQUEST,
      { userFriendlyMessage },
    );
  }
}
