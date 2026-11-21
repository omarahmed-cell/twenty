import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { buildRoboostRuleFilter } from '@/roboost-app/list/utils/buildRoboostListFilter';
import { FieldMetadataType } from '~/generated-metadata/graphql';

const makeField = (name: string, type: FieldMetadataType) =>
  ({ id: name, name, label: name, type }) as FieldMetadataItem;

describe('buildRoboostRuleFilter', () => {
  it('matches select values and negates for is none of', () => {
    const field = makeField('stage', FieldMetadataType.SELECT);

    expect(
      buildRoboostRuleFilter(
        { id: '1', fieldName: 'stage', operand: 'isAnyOf', value: ['WON'] },
        field,
      ),
    ).toEqual({ stage: { in: ['WON'] } });
    expect(
      buildRoboostRuleFilter(
        { id: '1', fieldName: 'stage', operand: 'isNoneOf', value: ['WON'] },
        field,
      ),
    ).toEqual({ not: { stage: { in: ['WON'] } } });
  });

  it('ignores a select rule without values', () => {
    expect(
      buildRoboostRuleFilter(
        { id: '1', fieldName: 'stage', operand: 'isAnyOf', value: [] },
        makeField('stage', FieldMetadataType.SELECT),
      ),
    ).toBeUndefined();
  });

  it('checks emptiness on the primary sub field of links', () => {
    expect(
      buildRoboostRuleFilter(
        { id: '1', fieldName: 'domainName', operand: 'isEmpty', value: null },
        makeField('domainName', FieldMetadataType.LINKS),
      ),
    ).toEqual({ domainName: { primaryLinkUrl: { is: 'NULL' } } });
  });

  it('filters a relation by its foreign key', () => {
    expect(
      buildRoboostRuleFilter(
        { id: '1', fieldName: 'company', operand: 'is', value: ['abc'] },
        makeField('company', FieldMetadataType.RELATION),
      ),
    ).toEqual({ companyId: { in: ['abc'] } });
  });
});
