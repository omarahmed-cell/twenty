import {
  RECORD_SOURCE_LABELS,
  RECORD_SOURCE_OBJECT_NAMES,
  SERVICE_PIPELINE_SEED,
} from 'twenty-shared/constants';
import {
  SERVICES_BOARD_VIEW_UNIVERSAL_IDENTIFIER,
  STANDARD_OBJECTS,
} from 'twenty-shared/metadata';
import {
  AggregateOperations,
  FieldActorSource,
  FieldMetadataType,
  ViewType,
} from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

import { computeTwentyStandardApplicationAllFlatEntityMaps } from 'src/engine/workspace-manager/twenty-standard-application/utils/twenty-standard-application-all-flat-entity-maps.constant';

type SelectOption = { id: string; value: string; label: string };

const { allFlatEntityMaps } = computeTwentyStandardApplicationAllFlatEntityMaps(
  {
    now: '2024-01-01T00:00:00.000Z',
    workspaceId: '20202020-1111-4111-8111-111111111111',
    twentyStandardApplicationId: '20202020-2222-4222-8222-222222222222',
  },
);

const getField = (universalIdentifier: string) => {
  const flatFieldMetadata =
    allFlatEntityMaps.flatFieldMetadataMaps.byUniversalIdentifier[
      universalIdentifier
    ];

  if (!isDefined(flatFieldMetadata)) {
    throw new Error(`Missing standard field ${universalIdentifier}`);
  }

  return flatFieldMetadata;
};

describe('Record source and services pipeline standard metadata', () => {
  it('includes the forms and document app actor sources', () => {
    expect(Object.values(FieldActorSource)).toEqual(
      expect.arrayContaining(['FORMS', 'DOCUMENT_APP']),
    );
  });

  it.each(RECORD_SOURCE_OBJECT_NAMES)(
    'gives %s a read-only Record source select listing every actor source',
    (objectName) => {
      const recordSourceField = getField(
        STANDARD_OBJECTS[objectName].fields.recordSource.universalIdentifier,
      );
      const options = recordSourceField.options as SelectOption[];

      expect(recordSourceField).toMatchObject({
        name: 'recordSource',
        label: 'Record source',
        type: FieldMetadataType.SELECT,
        isUIEditable: false,
        isNullable: true,
        defaultValue: null,
      });
      expect(options.map(({ value }) => value)).toEqual(
        Object.values(FieldActorSource),
      );
      expect(options.map(({ label }) => label)).toEqual(
        Object.values(FieldActorSource).map(
          (source) => RECORD_SOURCE_LABELS[source],
        ),
      );
      expect(new Set(options.map(({ id }) => id)).size).toBe(options.length);
    },
  );

  it('builds the service Pipeline and Stage options from the seeded Onboarding Pipeline', () => {
    const pipelineField = getField(
      STANDARD_OBJECTS.service.fields.pipeline.universalIdentifier,
    );
    const stageField = getField(
      STANDARD_OBJECTS.service.fields.stage.universalIdentifier,
    );
    const [onboardingPipeline] = SERVICE_PIPELINE_SEED;

    expect(pipelineField.label).toBe('Pipeline');
    expect(stageField.label).toBe('Stage');
    expect(
      (pipelineField.options as SelectOption[]).map(({ value }) => value),
    ).toEqual([onboardingPipeline.key]);
    expect(
      (stageField.options as SelectOption[]).map(({ value }) => value),
    ).toEqual(onboardingPipeline.stages.map(({ value }) => value));
    expect(stageField.defaultValue).toBe(
      `'${onboardingPipeline.stages[0].value}'`,
    );
  });

  it('adds a Services board that counts services per stage and comes before the index view', () => {
    const servicesBoard =
      allFlatEntityMaps.flatViewMaps.byUniversalIdentifier[
        SERVICES_BOARD_VIEW_UNIVERSAL_IDENTIFIER
      ];
    const indexView =
      allFlatEntityMaps.flatViewMaps.byUniversalIdentifier[
        STANDARD_OBJECTS.service.views.allServices.universalIdentifier
      ];
    const servicesBoardGroups = Object.values(
      allFlatEntityMaps.flatViewGroupMaps.byUniversalIdentifier,
    ).filter((flatViewGroup) => flatViewGroup?.viewId === servicesBoard?.id);

    expect(servicesBoard).toMatchObject({
      name: 'Services board',
      type: ViewType.KANBAN,
      icon: 'IconLayoutKanban',
      kanbanAggregateOperation: AggregateOperations.COUNT,
      mainGroupByFieldMetadataId: getField(
        STANDARD_OBJECTS.service.fields.stage.universalIdentifier,
      ).id,
    });
    expect(servicesBoard?.position).toBeLessThan(indexView?.position ?? 0);
    expect(servicesBoardGroups).toHaveLength(
      SERVICE_PIPELINE_SEED[0].stages.length,
    );
  });
});
