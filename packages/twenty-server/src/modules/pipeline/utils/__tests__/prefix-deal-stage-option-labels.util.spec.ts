import { STANDARD_OBJECTS } from 'twenty-shared/metadata';
import { DEFAULT_PIPELINE_RULES } from 'twenty-shared/utils';

import { type FlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/types/flat-entity-maps.type';
import { type FlatFieldMetadata } from 'src/engine/metadata-modules/flat-field-metadata/types/flat-field-metadata.type';
import { type PipelineConfig } from 'src/modules/pipeline/types/pipeline-config.type';
import { prefixDealStageOptionLabels } from 'src/modules/pipeline/utils/prefix-deal-stage-option-labels.util';

const STAGE_UNIVERSAL_IDENTIFIER =
  STANDARD_OBJECTS.opportunity.fields.stage.universalIdentifier;

const pipeline = (
  key: string,
  name: string,
  value: string,
): PipelineConfig => ({
  id: key,
  key,
  name,
  description: null,
  position: 0,
  objectNameSingular: 'opportunity',
  hubspotPipelineId: null,
  rules: DEFAULT_PIPELINE_RULES,
  stages: [
    {
      id: value,
      pipelineId: key,
      label: 'Closed Lost',
      value,
      position: 0,
      color: null,
      probability: 0,
      hubspotStageId: null,
      calcPropsEnabled: false,
      conditionalRules: [],
    },
  ],
});

describe('prefixDealStageOptionLabels', () => {
  it('puts the pipeline name in front of each stage label', () => {
    const maps = {
      byUniversalIdentifier: {
        [STAGE_UNIVERSAL_IDENTIFIER]: {
          universalIdentifier: STAGE_UNIVERSAL_IDENTIFIER,
          options: [
            {
              id: '1',
              value: 'PILOT_CLOSED_LOST',
              label: 'Closed Lost',
              position: 0,
              color: 'gray',
            },
            {
              id: '2',
              value: 'PARTNERSHIPS_CLOSED_LOST',
              label: 'Closed Lost',
              position: 1,
              color: 'gray',
            },
          ],
        },
      },
      universalIdentifierById: {},
      universalIdentifiersByApplicationId: {},
    } as unknown as FlatEntityMaps<FlatFieldMetadata>;

    const result = prefixDealStageOptionLabels({
      flatFieldMetadataMaps: maps,
      pipelines: [
        pipeline('PILOT_PIPELINE', 'Pilot', 'PILOT_CLOSED_LOST'),
        pipeline(
          'PARTNERSHIPS_PIPELINE',
          'Partnerships',
          'PARTNERSHIPS_CLOSED_LOST',
        ),
      ],
    });

    expect(
      result.byUniversalIdentifier[STAGE_UNIVERSAL_IDENTIFIER]?.options?.map(
        ({ label }) => label,
      ),
    ).toEqual(['Pilot › Closed Lost', 'Partnerships › Closed Lost']);
    expect(
      maps.byUniversalIdentifier[STAGE_UNIVERSAL_IDENTIFIER]?.options?.[0]
        .label,
    ).toBe('Closed Lost');
  });
});
