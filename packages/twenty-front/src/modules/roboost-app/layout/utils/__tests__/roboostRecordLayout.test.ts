import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { type RoboostRecordLayoutConfig } from '@/roboost-app/layout/types/RoboostRecordLayout';
import { moveRoboostLayoutItem } from '@/roboost-app/layout/utils/moveRoboostLayoutItem';
import {
  buildRoboostDefaultRecordLayout,
  resolveRoboostRecordLayout,
} from '@/roboost-app/layout/utils/resolveRoboostRecordLayout';
import {
  describeRoboostCardLogic,
  isRoboostCardVisible,
} from '@/roboost-app/layout/utils/roboostCardLogic';
import { type RoboostAssociation } from '@/roboost-app/record/utils/getRoboostAssociations';
import { type ConditionalLogicField } from 'twenty-shared/utils';
import { FieldMetadataType } from '~/generated-metadata/graphql';

const person = {
  id: 'person',
  nameSingular: 'person',
  fields: [
    { name: 'jobTitle', type: FieldMetadataType.TEXT, isActive: true },
    { name: 'city', type: FieldMetadataType.TEXT, isActive: true },
  ],
} as unknown as EnrichedObjectMetadataItem;

const company = {
  id: 'company',
  nameSingular: 'company',
  fields: [
    { name: 'name', type: FieldMetadataType.TEXT, isActive: true },
    { name: 'leadStatus', type: FieldMetadataType.SELECT, isActive: true },
    { name: 'employees', type: FieldMetadataType.NUMBER, isActive: true },
    { name: 'oldField', type: FieldMetadataType.TEXT, isActive: false },
  ],
} as unknown as EnrichedObjectMetadataItem;

const associations = [
  {
    id: 'people',
    kind: 'many',
    title: 'People',
    targetObjectMetadataItem: person,
  },
  { id: 'attachments', kind: 'attachments', title: 'Attachments' },
] as unknown as RoboostAssociation[];

const overviewTitles = {
  openTasks: 'Open tasks',
  pinnedActivities: 'Pinned activities',
  latestActivity: 'Latest activity',
};

const leadStatusField: ConditionalLogicField = {
  name: 'leadStatus',
  label: 'Lead status',
  type: FieldMetadataType.SELECT,
  options: [
    { value: 'NEW', label: 'New' },
    { value: 'OPEN', label: 'Open' },
  ],
};
const fieldByName = new Map([['leadStatus', leadStatusField]]);

describe('record layout defaults', () => {
  it("turns today's groups into cards and shows every association", () => {
    const layout = buildRoboostDefaultRecordLayout({
      sections: [
        { id: 'general', title: 'General', fields: [{ name: 'employees' }] },
      ],
      associations,
      overviewTitles,
    });

    expect(layout.left).toEqual([
      { id: 'general', title: 'General', fieldNames: ['employees'] },
    ]);
    expect(layout.right.map(({ id, isHidden }) => [id, isHidden])).toEqual([
      ['people', false],
      ['attachments', false],
    ]);
    expect(layout.right[0].fieldNames).toEqual(['jobTitle']);
    expect(
      layout.overview.filter(({ isHidden }) => !isHidden).map(({ id }) => id),
    ).toEqual(['openTasks', 'latestActivity']);
  });
});

describe('resolveRoboostRecordLayout', () => {
  const fallback = buildRoboostDefaultRecordLayout({
    sections: [],
    associations,
    overviewTitles,
  });

  it('keeps the saved cards, drops inactive properties and appends a new relation', () => {
    const stored: RoboostRecordLayoutConfig = {
      version: 1,
      left: [
        { id: 'card', title: 'Test card', fieldNames: ['oldField', 'name'] },
      ],
      right: [{ id: 'attachments', isHidden: true, fieldNames: [] }],
      removedRightIds: [],
      overview: [],
    };

    const layout = resolveRoboostRecordLayout({
      stored,
      fallback,
      objectMetadataItem: company,
      associations,
      overviewTitles,
    });

    expect(layout.left[0].fieldNames).toEqual(['name']);
    expect(layout.right.map(({ id }) => id)).toEqual(['attachments', 'people']);
    expect(layout.overview).toHaveLength(3);
  });

  it('does not bring back a removed association', () => {
    const layout = resolveRoboostRecordLayout({
      stored: { ...fallback, right: [], removedRightIds: ['people'] },
      fallback,
      objectMetadataItem: company,
      associations,
      overviewTitles,
    });

    expect(layout.right.map(({ id }) => id)).toEqual(['attachments']);
  });

  it('falls back to the defaults when nothing is saved', () => {
    expect(
      resolveRoboostRecordLayout({
        stored: undefined,
        fallback,
        objectMetadataItem: company,
        associations,
        overviewTitles,
      }),
    ).toBe(fallback);
  });
});

describe('card conditional logic', () => {
  const hideWhenNew = {
    action: 'hide' as const,
    conditionGroups: [
      {
        id: 'group',
        conditions: [
          {
            id: 'condition',
            fieldName: 'leadStatus',
            operator: 'IS_ANY_OF' as const,
            value: ['NEW'],
          },
        ],
      },
    ],
  };

  it('hides the card when the condition matches and shows it otherwise', () => {
    expect(
      isRoboostCardVisible({
        logic: hideWhenNew,
        record: { leadStatus: 'NEW' },
        fieldByName,
      }),
    ).toBe(false);
    expect(
      isRoboostCardVisible({
        logic: hideWhenNew,
        record: { leadStatus: 'OPEN' },
        fieldByName,
      }),
    ).toBe(true);
  });

  it('treats a Show rule as hidden until it matches', () => {
    const showWhenNew = { ...hideWhenNew, action: 'show' as const };

    expect(
      isRoboostCardVisible({
        logic: showWhenNew,
        record: { leadStatus: 'OPEN' },
        fieldByName,
      }),
    ).toBe(false);
  });

  it('ignores conditions on properties that no longer exist', () => {
    expect(
      isRoboostCardVisible({
        logic: hideWhenNew,
        record: { leadStatus: 'NEW' },
        fieldByName: new Map(),
      }),
    ).toBe(true);
  });

  it('describes the rule in plain language', () => {
    const text = describeRoboostCardLogic({
      cardTitle: 'Sales information',
      logic: { ...hideWhenNew, action: 'show' },
      fieldByName,
    })
      .map(({ text: part }) => part)
      .join('');

    expect(text).toBe(
      'Sales information will be Shown in this view, if Lead status is any of New',
    );
  });
});

describe('moveRoboostLayoutItem', () => {
  it('moves an item onto the target slot', () => {
    const identity = (id: string) => id;

    expect(moveRoboostLayoutItem(['a', 'b', 'c'], identity, 'a', 'c')).toEqual([
      'b',
      'c',
      'a',
    ]);
    expect(moveRoboostLayoutItem(['a', 'b', 'c'], identity, 'c', 'a')).toEqual([
      'c',
      'a',
      'b',
    ]);
  });
});
