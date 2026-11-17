import {
  getStageFieldPipelineObjectNameSingular,
  isDealPipelineField,
  isDealStageField,
  isDealStageFieldMetadataItem,
} from '@/pipeline/stage-picker/utils/dealStageFields';
import { STANDARD_OBJECTS } from 'twenty-shared/metadata';

describe('deal stage field detection', () => {
  it('only matches the stage and pipeline fields of deals', () => {
    expect(
      isDealStageField({
        objectNameSingular: 'opportunity',
        fieldName: 'stage',
      }),
    ).toBe(true);
    expect(
      isDealStageField({ objectNameSingular: 'company', fieldName: 'stage' }),
    ).toBe(false);
    expect(
      isDealPipelineField({
        objectNameSingular: 'opportunity',
        fieldName: 'pipeline',
      }),
    ).toBe(true);
    expect(
      isDealPipelineField({
        objectNameSingular: 'opportunity',
        fieldName: 'stage',
      }),
    ).toBe(false);
  });

  it('recognises the Deal Stage field metadata by its universal identifier', () => {
    expect(
      isDealStageFieldMetadataItem({
        universalIdentifier:
          STANDARD_OBJECTS.opportunity.fields.stage.universalIdentifier,
      }),
    ).toBe(true);
    expect(isDealStageFieldMetadataItem({ universalIdentifier: 'other' })).toBe(
      false,
    );
    expect(isDealStageFieldMetadataItem(undefined)).toBe(false);
  });

  it('also matches the service Stage and Pipeline fields', () => {
    expect(
      isDealStageField({ objectNameSingular: 'service', fieldName: 'stage' }),
    ).toBe(true);
    expect(
      isDealPipelineField({
        objectNameSingular: 'service',
        fieldName: 'pipeline',
      }),
    ).toBe(true);
    expect(
      getStageFieldPipelineObjectNameSingular({
        universalIdentifier:
          STANDARD_OBJECTS.service.fields.stage.universalIdentifier,
      }),
    ).toBe('service');
    expect(
      getStageFieldPipelineObjectNameSingular({
        universalIdentifier:
          STANDARD_OBJECTS.opportunity.fields.stage.universalIdentifier,
      }),
    ).toBe('opportunity');
  });
});
