import { useObjectMetadataItems } from '@/object-metadata/hooks/useObjectMetadataItems';
import { useOpenRoboostCreatePanel } from '@/roboost-app/hooks/useOpenRoboostCreatePanel';
import { useRoboostAccess } from '@/roboost-app/users-and-teams/hooks/useRoboostAccess';
import { canRoboostWriteObject } from '@/roboost-app/users-and-teams/utils/canRoboostWriteObject';
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
  const roboostAccess = useRoboostAccess();

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
              isNoPermission: !canRoboostWriteObject(
                roboostAccess,
                nameSingular,
                'create',
              ),
              onSelect: () =>
                openCreatePanel({ objectNameSingular: nameSingular }),
            },
          ]
        : [];
    },
  );

  const hasPerson = objectMetadataItems.some(
    (item) => item.nameSingular === 'person' && item.isActive,
  );
  const quickLeadEntries: MenuEntry[] = hasPerson
    ? [
        { id: 'quick-lead-separator', isSeparator: true },
        {
          id: 'quick-lead',
          label: t`Quick lead`,
          icon: 'user',
          hint: t`Contact and company`,
          isNoPermission: !canRoboostWriteObject(
            roboostAccess,
            'person',
            'create',
          ),
          onSelect: () => openCreatePanel({ objectNameSingular: 'person' }),
        },
      ]
    : [];

  return (
    <Menu
      align="right"
      entries={[...entries, ...quickLeadEntries]}
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
