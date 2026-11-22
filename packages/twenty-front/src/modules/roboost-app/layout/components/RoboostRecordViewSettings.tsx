import { useObjectMetadataItems } from '@/object-metadata/hooks/useObjectMetadataItems';
import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { RoboostRecordViewEditor } from '@/roboost-app/layout/components/RoboostRecordViewEditor';
import { useRoboostRecordLayoutConfig } from '@/roboost-app/layout/hooks/useRoboostRecordLayoutConfig';
import { getRoboostRecordViewSettingsPath } from '@/roboost-app/layout/utils/getRoboostLayoutSettingsPath';
import { Icon } from '@/roboost-ui/components/Icon';
import { type RoboostIconName } from '@/roboost-ui/types/RoboostIconName';
import { useLingui } from '@lingui/react/macro';
import { Link, useParams } from 'react-router-dom';
import { isDefined } from 'twenty-shared/utils';

const PINNED_OBJECTS: { nameSingular: string; icon: RoboostIconName }[] = [
  { nameSingular: 'company', icon: 'building' },
  { nameSingular: 'person', icon: 'contacts' },
  { nameSingular: 'opportunity', icon: 'deals' },
  { nameSingular: 'service', icon: 'services' },
];

const RoboostRecordViewObjectRow = ({
  objectMetadataItem,
  objectMetadataItems,
  icon,
}: {
  objectMetadataItem: EnrichedObjectMetadataItem;
  objectMetadataItems: EnrichedObjectMetadataItem[];
  icon: RoboostIconName;
}) => {
  const { t } = useLingui();
  const { layout } = useRoboostRecordLayoutConfig(
    objectMetadataItem,
    objectMetadataItems,
  );
  const cardCount = layout.left.length;
  const associationCount = layout.right.filter((card) => !card.isHidden).length;

  return (
    <div className="rb-forms-row rb-rv-object">
      <Icon name={icon} size={17} />
      <span className="rb-forms-name">
        {objectMetadataItem.labelPlural}
        <span className="rb-forms-kind">
          {' · '}
          {t`${cardCount} cards, ${associationCount} association cards`}
        </span>
      </span>
      <Link
        className="rb-btn rb-btn-secondary rb-btn-sm"
        to={getRoboostRecordViewSettingsPath(objectMetadataItem.nameSingular)}
      >
        <Icon name="pencil" size={16} />
        <span>{t`Edit record view`}</span>
      </Link>
    </div>
  );
};

// Settings → Layout → Record view: pick an object, then edit its record page full screen
export const RoboostRecordViewSettings = () => {
  const { t } = useLingui();
  const { objectNameSingular } = useParams<{ objectNameSingular?: string }>();
  const { objectMetadataItems } = useObjectMetadataItems();

  const editableObjects = objectMetadataItems.filter(
    (item) => item.isActive && !item.isSystem && !item.isRemote,
  );
  const pinned = PINNED_OBJECTS.map(({ nameSingular, icon }) => ({
    icon,
    item: editableObjects.find((item) => item.nameSingular === nameSingular),
  })).filter(
    (
      entry,
    ): entry is { icon: RoboostIconName; item: EnrichedObjectMetadataItem } =>
      isDefined(entry.item),
  );
  const others = editableObjects
    .filter(
      (item) =>
        !PINNED_OBJECTS.some(
          ({ nameSingular }) => nameSingular === item.nameSingular,
        ),
    )
    .sort((first, second) =>
      first.labelPlural.localeCompare(second.labelPlural),
    )
    .map((item) => ({ icon: 'segment' as RoboostIconName, item }));

  const editing = editableObjects.find(
    (item) => item.nameSingular === objectNameSingular,
  );

  return (
    <>
      <h2 className="rb-layout-subtitle">{t`Record view`}</h2>
      <p className="rb-forms-sub">
        {t`Choose the cards on each record page, the properties inside them, the association cards and the Overview sections. Changes apply to everyone as soon as you save.`}
      </p>
      <section className="rb-forms-card rb-rv-list">
        <div className="rb-forms-card-body">
          {[...pinned, ...others].map(({ icon, item }) => (
            <RoboostRecordViewObjectRow
              key={item.id}
              objectMetadataItem={item}
              objectMetadataItems={objectMetadataItems}
              icon={icon}
            />
          ))}
        </div>
      </section>
      {isDefined(editing) && (
        <RoboostRecordViewEditor
          key={editing.id}
          objectMetadataItem={editing}
          objectMetadataItems={objectMetadataItems}
        />
      )}
    </>
  );
};
