import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import {
  type RoboostLayoutAssociationCard,
  type RoboostLayoutOverviewSection,
  type RoboostLayoutPropertyCard,
  type RoboostOverviewSectionId,
  type RoboostRecordLayoutConfig,
} from '@/roboost-app/layout/types/RoboostRecordLayout';
import { getRoboostAssociationCardFields } from '@/roboost-app/record/components/RoboostAssociationCards';
import { type RoboostAssociation } from '@/roboost-app/record/utils/getRoboostAssociations';
import { isPlainObject } from 'twenty-shared/utils';

// Deals open on their money and stage, like HubSpot; other objects start with no header lines
const ROBOOST_DEFAULT_HEADER_FIELD_NAMES: Record<string, string[]> = {
  opportunity: ['dealAmount', 'closeDate', 'pipeline', 'stage'],
};

export const getRoboostDefaultHeaderFieldNames = (
  objectMetadataItem: Pick<
    EnrichedObjectMetadataItem,
    'nameSingular' | 'fields'
  >,
): string[] =>
  (
    ROBOOST_DEFAULT_HEADER_FIELD_NAMES[objectMetadataItem.nameSingular] ?? []
  ).filter((fieldName) =>
    objectMetadataItem.fields.some(
      (field) => field.name === fieldName && field.isActive,
    ),
  );

export const ROBOOST_OVERVIEW_SECTION_IDS: RoboostOverviewSectionId[] = [
  'openTasks',
  'pinnedActivities',
  'latestActivity',
];

export type RoboostOverviewSectionTitles = Record<
  RoboostOverviewSectionId,
  string
>;

export const getRoboostDefaultAssociationFieldNames = (
  association: RoboostAssociation,
): string[] => {
  if (association.kind === 'attachments') {
    return [];
  }
  const { tagField, lineFields } = getRoboostAssociationCardFields(
    association.targetObjectMetadataItem,
  );

  return [...(tagField !== undefined ? [tagField] : []), ...lineFields].map(
    (field) => field.name,
  );
};

const buildDefaultOverview = (
  titles: RoboostOverviewSectionTitles,
): RoboostLayoutOverviewSection[] =>
  ROBOOST_OVERVIEW_SECTION_IDS.map((id) => ({
    id,
    title: titles[id],
    // Pinning is new, so the section starts hidden and today's Overview is unchanged
    isHidden: id === 'pinnedActivities',
  }));

// What the record page showed before layouts existed: one card per property group, every association
export const buildRoboostDefaultRecordLayout = ({
  sections,
  associations,
  overviewTitles,
  headerFieldNames = [],
}: {
  sections: { id: string; title: string; fields: { name: string }[] }[];
  associations: RoboostAssociation[];
  overviewTitles: RoboostOverviewSectionTitles;
  headerFieldNames?: string[];
}): RoboostRecordLayoutConfig => ({
  version: 1,
  header: { fieldNames: headerFieldNames },
  left: sections.map((section) => ({
    id: section.id,
    title: section.title,
    fieldNames: section.fields.map((field) => field.name),
  })),
  right: associations.map((association) => ({
    id: association.id,
    isHidden: false,
    fieldNames: getRoboostDefaultAssociationFieldNames(association),
  })),
  removedRightIds: [],
  overview: buildDefaultOverview(overviewTitles),
});

const isStoredLayout = (value: unknown): value is RoboostRecordLayoutConfig =>
  isPlainObject(value) &&
  Array.isArray(value.left) &&
  Array.isArray(value.right) &&
  Array.isArray(value.overview);

// Drops properties and associations that no longer exist; a relation added later shows at the end
export const resolveRoboostRecordLayout = ({
  stored,
  fallback,
  objectMetadataItem,
  associations,
  overviewTitles,
}: {
  stored: unknown;
  fallback: RoboostRecordLayoutConfig;
  objectMetadataItem: EnrichedObjectMetadataItem;
  associations: RoboostAssociation[];
  overviewTitles: RoboostOverviewSectionTitles;
}): RoboostRecordLayoutConfig => {
  if (!isStoredLayout(stored)) {
    return fallback;
  }
  const activeFieldNames = new Set(
    objectMetadataItem.fields
      .filter((field) => field.isActive)
      .map((field) => field.name),
  );
  const associationById = new Map(
    associations.map((association) => [association.id, association]),
  );
  const removedRightIds = Array.isArray(stored.removedRightIds)
    ? stored.removedRightIds.filter((id) => associationById.has(id))
    : [];

  const left: RoboostLayoutPropertyCard[] = stored.left.map((card) => ({
    ...card,
    fieldNames: card.fieldNames.filter((name) => activeFieldNames.has(name)),
  }));

  const listedRight: RoboostLayoutAssociationCard[] = stored.right
    .filter((card) => associationById.has(card.id))
    .map((card) => {
      const association = associationById.get(card.id);
      const targetFieldNames = new Set(
        association?.kind === 'attachments'
          ? []
          : (association?.targetObjectMetadataItem.fields ?? [])
              .filter((field) => field.isActive)
              .map((field) => field.name),
      );

      return {
        ...card,
        fieldNames: card.fieldNames.filter((name) =>
          targetFieldNames.has(name),
        ),
      };
    });
  const unlistedRight: RoboostLayoutAssociationCard[] = associations
    .filter(
      (association) =>
        !listedRight.some((card) => card.id === association.id) &&
        !removedRightIds.includes(association.id),
    )
    .map((association) => ({
      id: association.id,
      isHidden: false,
      fieldNames: getRoboostDefaultAssociationFieldNames(association),
    }));

  const storedOverview = stored.overview.filter((section) =>
    ROBOOST_OVERVIEW_SECTION_IDS.includes(section.id),
  );
  const overview = [
    ...storedOverview,
    ...buildDefaultOverview(overviewTitles).filter(
      (section) => !storedOverview.some(({ id }) => id === section.id),
    ),
  ];

  // Layouts saved before header lines existed get the object's default lines
  const header =
    isPlainObject(stored.header) && Array.isArray(stored.header.fieldNames)
      ? {
          fieldNames: stored.header.fieldNames.filter(
            (name): name is string =>
              typeof name === 'string' && activeFieldNames.has(name),
          ),
        }
      : fallback.header;

  return {
    version: 1,
    header,
    left,
    right: [...listedRight, ...unlistedRight],
    removedRightIds,
    overview,
  };
};
