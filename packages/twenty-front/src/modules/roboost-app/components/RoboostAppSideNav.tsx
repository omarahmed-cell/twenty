import { currentWorkspaceMemberState } from '@/auth/states/currentWorkspaceMemberState';
import { useObjectMetadataItems } from '@/object-metadata/hooks/useObjectMetadataItems';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { CoreObjectNameSingular } from 'twenty-shared/types';
import { ROBOOST_NAV_DEFINITION } from '@/roboost-app/constants/RoboostNavDefinition';
import { ROBOOST_USER_VAR_KEYS } from '@/roboost-app/constants/RoboostUserVarKeys';
import { useRoboostUserVars } from '@/roboost-app/hooks/useRoboostUserVars';
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
  const currentWorkspaceMember = useAtomStateValue(currentWorkspaceMemberState);
  const { setUserVar } = useRoboostUserVars();

  // Totals only: one row each, the count comes from totalCount
  const { totalCount: contactCount } = useFindManyRecords({
    objectNameSingular: CoreObjectNameSingular.Person,
    recordGqlFields: { id: true },
    limit: 1,
  });
  const { totalCount: dealCount } = useFindManyRecords({
    objectNameSingular: CoreObjectNameSingular.Opportunity,
    recordGqlFields: { id: true },
    limit: 1,
  });
  const { totalCount: myOpenTaskCount } = useFindManyRecords({
    objectNameSingular: CoreObjectNameSingular.Task,
    recordGqlFields: { id: true },
    filter: {
      assigneeId: { eq: currentWorkspaceMember?.id },
      status: { neq: 'DONE' },
    },
    skip: !isDefined(currentWorkspaceMember?.id),
    limit: 1,
  });

  const countsByEntryId: Record<string, number | undefined> = {
    people: contactCount,
    opportunities: dealCount,
    tasks: myOpenTaskCount,
  };

  const groupLabels: Record<string, string | undefined> = {
    main: undefined,
    workspace: t`Workspace`,
    system: t`System`,
  };

  const staticLabels: Record<string, string> = {
    home: t`Home`,
    settings: t`Settings`,
    meetings: t`Meetings`,
    scoring: t`Scoring`,
  };

  const groups: NavGroup[] = ROBOOST_NAV_DEFINITION.map((group) => ({
    label: groupLabels[group.groupId],
    items: group.entries.flatMap((entry) => {
      if (isDefined(entry.path)) {
        const isActive =
          entry.id === 'settings'
            ? pathname.startsWith('/settings')
            : entry.id === 'scoring'
              ? pathname.startsWith('/scoring')
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
          label: staticLabels[entry.id] ?? objectMetadataItem.labelPlural,
          icon: entry.icon,
          href: indexPath,
          count: countsByEntryId[entry.id] || undefined,
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
      hideBrand
      onToggle={(collapsed) => {
        setRoboostNavCollapsed(collapsed);
        setUserVar(ROBOOST_USER_VAR_KEYS.navCollapsed, collapsed);
      }}
    />
  );
};
