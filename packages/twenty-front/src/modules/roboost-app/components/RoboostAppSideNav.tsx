import { useObjectMetadataItems } from '@/object-metadata/hooks/useObjectMetadataItems';
import { ROBOOST_NAV_DEFINITION } from '@/roboost-app/constants/RoboostNavDefinition';
import { roboostNavCollapsedState } from '@/roboost-app/states/roboostNavCollapsedState';
import { type NavGroup, SideNav } from '@/roboost-ui/components/SideNav';
import { useAtomState } from '@/ui/utilities/state/jotai/hooks/useAtomState';
import { useLingui } from '@lingui/react/macro';
import { useLocation } from 'react-router-dom';
import { isDefined } from 'twenty-shared/utils';

export const RoboostAppSideNav = () => {
  const { t } = useLingui();
  const { pathname } = useLocation();
  const { objectMetadataItems } = useObjectMetadataItems();
  const [roboostNavCollapsed, setRoboostNavCollapsed] = useAtomState(
    roboostNavCollapsedState,
  );

  const groupLabels: Record<string, string | undefined> = {
    main: undefined,
    workspace: t`Workspace`,
    system: t`System`,
  };

  const staticLabels: Record<string, string> = {
    home: t`Home`,
    settings: t`Settings`,
  };

  const groups: NavGroup[] = ROBOOST_NAV_DEFINITION.map((group) => ({
    label: groupLabels[group.groupId],
    items: group.entries.flatMap((entry) => {
      if (isDefined(entry.path)) {
        const isActive =
          entry.id === 'settings'
            ? pathname.startsWith('/settings')
            : pathname === entry.path;

        return [
          {
            id: entry.id,
            label: staticLabels[entry.id] ?? entry.id,
            icon: entry.icon,
            href: entry.path,
            active: isActive,
          },
        ];
      }

      const objectMetadataItem = objectMetadataItems.find(
        (item) => item.namePlural === entry.objectNamePlural && item.isActive,
      );

      if (!isDefined(objectMetadataItem)) {
        return [];
      }

      const indexPath = `/objects/${objectMetadataItem.namePlural}`;
      const showPathPrefix = `/object/${objectMetadataItem.nameSingular}/`;

      return [
        {
          id: entry.id,
          label: objectMetadataItem.labelPlural,
          icon: entry.icon,
          href: indexPath,
          active:
            pathname.startsWith(indexPath) ||
            pathname.startsWith(showPathPrefix),
        },
      ];
    }),
  })).filter((group) => group.items.length > 0);

  return (
    <SideNav
      groups={groups}
      collapsed={roboostNavCollapsed}
      onToggle={setRoboostNavCollapsed}
    />
  );
};
