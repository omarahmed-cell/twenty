import { FieldMetadataType } from 'twenty-shared/types';
import {
  type ConditionalLogicField,
  type ConditionalLogicRule,
  expandPropertyLogicRule,
  toPropertyGroupReference,
} from 'twenty-shared/utils';

import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { type WorkspaceOrmManager } from 'src/engine/twenty-orm/workspace-orm.manager';
import { isWorkflowRecordWrite } from 'src/modules/workflow/workflow-executor/workflow-actions/record-crud/utils/workflow-record-write-context.storage';
import { type PropertyLogicConfigService } from 'src/modules/properties/services/property-logic-config.service';
import { PropertyLogicEnforcementService } from 'src/modules/properties/services/property-logic-enforcement.service';

const COMPANY_OBJECT_ID = 'company-object-id';

const FIELDS: ConditionalLogicField[] = [
  {
    name: 'products',
    label: 'Products',
    type: FieldMetadataType.MULTI_SELECT,
    options: [
      { value: 'DMS', label: 'DMS' },
      { value: 'SIRA', label: 'Sira' },
    ],
  },
  {
    name: 'usesAggregators',
    label: 'Uses Aggregators',
    type: FieldMetadataType.MULTI_SELECT,
  },
  { name: 'uses3pls', label: 'Uses 3PLs', type: FieldMetadataType.SELECT },
];

const DMS_RULE: ConditionalLogicRule = expandPropertyLogicRule(
  {
    id: 'dms-rule',
    conditionGroups: [
      {
        id: 'group',
        conditions: [
          {
            id: 'condition',
            fieldName: 'products',
            operator: 'CONTAINS_ANY_OF',
            value: ['DMS'],
          },
        ],
      },
    ],
    properties: [
      { fieldName: toPropertyGroupReference('dms-group'), isRequired: true },
    ],
  },
  new Map([['dms-group', ['usesAggregators', 'uses3pls']]]),
);

jest.mock(
  'src/engine/twenty-orm/storage/orm-workspace-context.storage',
  () => ({
    getWorkspaceContext: () => ({
      objectIdByNameSingular: { company: 'company-object-id' },
      flatObjectMetadataMaps: {},
      flatFieldMetadataMaps: {},
    }),
  }),
);

jest.mock(
  'src/engine/metadata-modules/flat-entity/utils/find-flat-entity-by-id-in-flat-entity-maps.util',
  () => ({ findFlatEntityByIdInFlatEntityMaps: () => ({ id: 'company' }) }),
);

jest.mock(
  'src/modules/properties/utils/build-conditional-logic-fields-for-object.util',
  () => ({ buildConditionalLogicFieldsForObject: () => FIELDS }),
);

jest.mock(
  'src/modules/workflow/workflow-executor/workflow-actions/record-crud/utils/workflow-record-write-context.storage',
  () => ({ isWorkflowRecordWrite: jest.fn(() => false) }),
);

const MEMBER_CONTEXT = {
  type: 'user',
  workspace: { id: 'workspace-id' },
} as unknown as WorkspaceAuthContext;

const buildService = (storedRecords: Record<string, unknown>[] = []) => {
  const find = jest.fn().mockResolvedValue(storedRecords);
  const getRules = jest.fn(async ({ objectMetadataId }) =>
    objectMetadataId === COMPANY_OBJECT_ID ? [DMS_RULE] : [],
  );

  return {
    service: new PropertyLogicEnforcementService(
      {
        executeInWorkspaceContext: (run: () => Promise<unknown>) => run(),
        getRepository: () => ({ find }),
      } as unknown as WorkspaceOrmManager,
      { getRules } as unknown as PropertyLogicConfigService,
    ),
    find,
  };
};

describe('PropertyLogicEnforcementService', () => {
  beforeEach(() => {
    jest.mocked(isWorkflowRecordWrite).mockReturnValue(false);
  });

  it('refuses a controlling change that leaves required dependents empty, naming them', async () => {
    const { service } = buildService([{ id: 'acme', products: ['SIRA'] }]);

    await expect(
      service.enforceUpdate({
        authContext: MEMBER_CONTEXT,
        objectName: 'company',
        recordIds: ['acme'],
        data: { products: ['DMS'] },
      }),
    ).rejects.toThrow('Products -> DMS needs: Uses Aggregators, Uses 3PLs.');
  });

  it('allows the change with every required dependent filled', async () => {
    const { service } = buildService([{ id: 'acme', products: ['SIRA'] }]);

    await expect(
      service.enforceUpdate({
        authContext: MEMBER_CONTEXT,
        objectName: 'company',
        recordIds: ['acme'],
        data: {
          products: ['DMS'],
          usesAggregators: ['TALABAT'],
          uses3pls: 'CERVO_DELIVERY',
        },
      }),
    ).resolves.toBeUndefined();
  });

  it('does not load anything for edits that leave the controlling properties alone', async () => {
    const { service, find } = buildService([
      { id: 'acme', products: ['DMS'], usesAggregators: ['TALABAT'] },
    ]);

    await service.enforceUpdate({
      authContext: MEMBER_CONTEXT,
      objectName: 'company',
      recordIds: ['acme'],
      data: { usesAggregators: [] },
    });

    expect(find).not.toHaveBeenCalled();
  });

  it('applies to Admins and API keys as well as members', async () => {
    const { service } = buildService([{ id: 'acme', products: [] }]);

    await expect(
      service.enforceUpdate({
        authContext: {
          type: 'apiKey',
          workspace: { id: 'workspace-id' },
        } as unknown as WorkspaceAuthContext,
        objectName: 'company',
        recordIds: ['acme'],
        data: { products: ['DMS'] },
      }),
    ).rejects.toThrow('needs: Uses Aggregators, Uses 3PLs');
  });

  it('lets workflows through', async () => {
    jest.mocked(isWorkflowRecordWrite).mockReturnValue(true);
    const { service } = buildService([{ id: 'acme', products: [] }]);

    await expect(
      service.enforceUpdate({
        authContext: MEMBER_CONTEXT,
        objectName: 'company',
        recordIds: ['acme'],
        data: { products: ['DMS'] },
      }),
    ).resolves.toBeUndefined();
  });

  it('lets imports through', async () => {
    const { service } = buildService();

    await expect(
      service.enforceCreate({
        authContext: MEMBER_CONTEXT,
        objectName: 'company',
        records: [{ products: ['DMS'], createdBy: { source: 'IMPORT' } }],
      }),
    ).resolves.toBeUndefined();
  });

  it('checks a create like a change from nothing', async () => {
    const { service } = buildService();

    await expect(
      service.enforceCreate({
        authContext: MEMBER_CONTEXT,
        objectName: 'company',
        records: [{ products: ['DMS'], uses3pls: 'CERVO_DELIVERY' }],
      }),
    ).rejects.toThrow('Products -> DMS needs: Uses Aggregators.');
  });

  it('asks a bulk edit that triggers required properties to go one by one', async () => {
    const { service } = buildService([
      { id: 'acme', products: [] },
      { id: 'globex', products: [] },
    ]);

    await expect(
      service.enforceUpdate({
        authContext: MEMBER_CONTEXT,
        objectName: 'company',
        recordIds: ['acme', 'globex'],
        data: { products: ['DMS'] },
      }),
    ).rejects.toThrow('Change these one by one');
  });

  it('reports the dependents hidden for a record', async () => {
    const { service } = buildService([
      { id: 'acme', products: [], usesAggregators: ['TALABAT'] },
    ]);

    await expect(
      service.getVisibility({
        workspaceId: 'workspace-id',
        objectName: 'company',
        recordId: 'acme',
      }),
    ).resolves.toEqual({
      hiddenFieldNames: ['usesAggregators', 'uses3pls'],
      requiredFieldNames: [],
    });
  });

  it('leaves objects without rules alone', async () => {
    const { service, find } = buildService();

    await service.enforceUpdate({
      authContext: MEMBER_CONTEXT,
      objectName: 'person',
      recordIds: ['jane'],
      data: { products: ['DMS'] },
    });

    expect(find).not.toHaveBeenCalled();
  });
});
