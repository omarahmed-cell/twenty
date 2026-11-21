import { useObjectMetadataItems } from '@/object-metadata/hooks/useObjectMetadataItems';
import { useOpenRoboostCreatePanel } from '@/roboost-app/hooks/useOpenRoboostCreatePanel';
import { Button } from '@/roboost-ui/components/Button';
import { Menu, type MenuEntry } from '@/roboost-ui/components/Menu';
import { type RoboostIconName } from '@/roboost-ui/types/RoboostIconName';
import { useLingui } from '@lingui/react/macro';
import { isDefined } from 'twenty-shared/utils';

const CREATE_MENU_OBJECTS: { nameSingular: string; icon: RoboostIconName }[] = [
  { nameSingular: 'company', icon: 'building' },
  { nameSingular: 'person', icon: 'contacts' },
  { nameSingular: 'opportunity', icon: 'deals' },
  { nameSingular: 'service', icon: 'services' },
  { nameSingular: 'task', icon: 'tasks' },
  { nameSingular: 'note', icon: 'note' },
];

export const RoboostNewRecordMenu = () => {
  const { t } = useLingui();
  const { objectMetadataItems } = useObjectMetadataItems();
  const openCreatePanel = useOpenRoboostCreatePanel();

  const entries: MenuEntry[] = CREATE_MENU_OBJECTS.flatMap(
    ({ nameSingular, icon }) => {
      const objectMetadataItem = objectMetadataItems.find(
        (item) => item.nameSingular === nameSingular && item.isActive,
      );

      return isDefined(objectMetadataItem)
        ? [
            {
              id: nameSingular,
              label: objectMetadataItem.labelSingular,
              icon,
              onSelect: () =>
                openCreatePanel({ objectNameSingular: nameSingular }),
            },
          ]
        : [];
    },
  );

  return (
    <Menu
      align="right"
      entries={entries}
      trigger={({ toggle, isOpen }) => (
        <Button
          variant="primary"
          icon="plus"
          aria-expanded={isOpen}
          aria-haspopup="menu"
          onClick={toggle}
        >
          {t`New`}
        </Button>
      )}
    />
  );
};
