import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { ROBOOST_FILTER_OPERATOR_LABELS } from '@/roboost-app/filters/constants/RoboostFilterOperatorLabels';
import { ROBOOST_FILTER_OPERATORS_BY_KIND } from '@/roboost-app/filters/constants/RoboostFilterOperatorsByKind';
import { buildRoboostFilterRule } from '@/roboost-app/filters/utils/buildRoboostFilterRule';
import { FieldMetadataType, RelationType } from '~/generated-metadata/graphql';

const field = (
  name: string,
  type: FieldMetadataType,
  extra: Partial<FieldMetadataItem> = {},
) => ({ name, type, ...extra }) as FieldMetadataItem;

const now = new Date(2026, 10, 18, 12, 0);

describe('buildRoboostFilterRule', () => {
  const city = field('city', FieldMetadataType.TEXT);

  it('matches any of several text values', () => {
    expect(
      buildRoboostFilterRule({
        field: city,
        operator: 'startsWithAnyOf',
        value: ['Cai', 'Riy'],
      }),
    ).toEqual({
      or: [{ city: { ilike: 'Cai%' } }, { city: { ilike: 'Riy%' } }],
    });
    expect(
      buildRoboostFilterRule({
        field: city,
        operator: 'doesNotContainAnyOf',
        value: ['x'],
      }),
    ).toEqual({ not: { city: { ilike: '%x%' } } });
  });

  it('treats empty text as unknown', () => {
    expect(
      buildRoboostFilterRule({
        field: city,
        operator: 'isUnknown',
        value: null,
      }),
    ).toEqual({ or: [{ city: { is: 'NULL' } }, { city: { eq: '' } }] });
  });

  it('builds currency ranges in micros', () => {
    const amount = field('amount', FieldMetadataType.CURRENCY);

    expect(
      buildRoboostFilterRule({
        field: amount,
        operator: 'isBetween',
        value: ['10', '5'],
      }),
    ).toEqual({
      amount: { amountMicros: { gte: 5_000_000, lte: 10_000_000 } },
    });
    expect(
      buildRoboostFilterRule({
        field: amount,
        operator: 'isNotBetween',
        value: ['5', '10'],
      }),
    ).toEqual({
      or: [
        { amount: { amountMicros: { lt: 5_000_000 } } },
        { amount: { amountMicros: { gt: 10_000_000 } } },
      ],
    });
  });

  it('turns days-ago and presets into date ranges', () => {
    const createdAt = field('createdAt', FieldMetadataType.DATE_TIME);

    expect(
      buildRoboostFilterRule({
        field: createdAt,
        operator: 'isMoreThanDaysAgo',
        value: ['30'],
        now,
      }),
    ).toEqual({
      createdAt: { lt: new Date(2026, 9, 19, 12, 0).toISOString() },
    });
    expect(
      buildRoboostFilterRule({
        field: createdAt,
        operator: 'isThisMonth',
        value: null,
        now,
      }),
    ).toEqual({
      createdAt: {
        gte: new Date(2026, 10, 1).toISOString(),
        lt: new Date(2026, 11, 1).toISOString(),
      },
    });
  });

  it('matches multi-select exactly by excluding the other options', () => {
    const tags = field('tags', FieldMetadataType.MULTI_SELECT);

    expect(
      buildRoboostFilterRule({
        field: tags,
        operator: 'isExactly',
        value: ['A'],
        selectOptionValues: ['A', 'B', 'C'],
      }),
    ).toEqual({
      and: [
        { tags: { containsAny: ['A'] } },
        { not: { tags: { containsAny: ['B', 'C'] } } },
      ],
    });
  });

  it('filters relations by their join column', () => {
    const owner = field('accountOwner', FieldMetadataType.RELATION, {
      relation: { type: RelationType.MANY_TO_ONE },
    } as Partial<FieldMetadataItem>);

    expect(
      buildRoboostFilterRule({
        field: owner,
        operator: 'isAnyOf',
        value: ['member-1'],
      }),
    ).toEqual({ accountOwnerId: { in: ['member-1'] } });
  });

  it('ignores a rule until it has a value', () => {
    expect(
      buildRoboostFilterRule({
        field: city,
        operator: 'containsAnyOf',
        value: [],
      }),
    ).toBeUndefined();
  });
});

describe('Roboost filter operators', () => {
  it('labels every operator and offers known/unknown for every field type', () => {
    for (const operators of Object.values(ROBOOST_FILTER_OPERATORS_BY_KIND)) {
      expect(operators).toEqual(
        expect.arrayContaining(['isKnown', 'isUnknown']),
      );
      operators.forEach((operator) =>
        expect(ROBOOST_FILTER_OPERATOR_LABELS[operator]).toBeDefined(),
      );
    }
  });
});
