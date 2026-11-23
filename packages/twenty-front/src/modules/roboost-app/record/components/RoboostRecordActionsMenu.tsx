import { useCreateManyNavigationMenuItems } from '@/navigation-menu-item/common/hooks/useCreateManyNavigationMenuItems';
import { useDeleteManyNavigationMenuItems } from '@/navigation-menu-item/common/hooks/useDeleteManyNavigationMenuItems';
import { useNavigationMenuItemsData } from '@/navigation-menu-item/display/hooks/useNavigationMenuItemsData';
import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { useDeleteOneRecord } from '@/object-record/hooks/useDeleteOneRecord';
import { useOpenRoboostCreatePanel } from '@/roboost-app/hooks/useOpenRoboostCreatePanel';
import { roboostPropertiesPanelState } from '@/roboost-app/timeline/states/roboostPropertiesPanelState';
import { useSetAtomState } from '@/ui/utilities/state/jotai/hooks/useSetAtomState';
import { buildRoboostCloneValues } from '@/roboost-app/record/utils/buildRoboostCloneValues';
import { Button } from '@/roboost-ui/components/Button';
import { Icon } from '@/roboost-ui/components/Icon';
import { Menu, type MenuEntry } from '@/roboost-ui/components/Menu';
import { Modal } from '@/roboost-ui/components/Modal';
import { useOpenSegmentMembershipInSidePanel } from '@/side-panel/hooks/useOpenSegmentMembershipInSidePanel';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { AppPath, NavigationMenuItemType } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';
import { v4 } from 'uuid';
import { useNavigateApp } from '~/hooks/useNavigateApp';
import { openUrlInNewTab } from '~/utils/openUrlInNewTab';

type RoboostRecordActionsMenuProps = {
  objectMetadataItem: EnrichedObjectMetadataItem;
  objectMetadataItems: EnrichedObjectMetadataItem[];
  record: Record<string, unknown> & { id: string };
  recordName: string;
  classicPagePath: string;
  onSaved: () => void;
};

export const RoboostRecordActionsMenu = ({
  objectMetadataItem,
  objectMetadataItems,
  record,
  recordName,
  classicPagePath,
}: RoboostRecordActionsMenuProps) => {
  const { t } = useLingui();
  const navigateApp = useNavigateApp();
  const openCreatePanel = useOpenRoboostCreatePanel();
  const { openSegmentMembershipInSidePanel } =
    useOpenSegmentMembershipInSidePanel();
  const { deleteOneRecord } = useDeleteOneRecord({
    objectNameSingular: objectMetadataItem.nameSingular,
  });
  const { navigationMenuItems, currentUserWorkspaceId } =
    useNavigationMenuItemsData();
  const { createManyNavigationMenuItems } = useCreateManyNavigationMenuItems();
  const { deleteManyNavigationMenuItems } = useDeleteManyNavigationMenuItems();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const setRoboostPropertiesPanel = useSetAtomState(
    roboostPropertiesPanelState,
  );
  const [copied, setCopied] = useState(false);

  const favoriteItem = navigationMenuItems.find(
    (item) =>
      item.targetRecordId === record.id &&
      item.targetObjectMetadataId === objectMetadataItem.id,
  );

  const toggleFollow = () => {
    if (isDefined(favoriteItem)) {
      deleteManyNavigationMenuItems([favoriteItem.id]);
      return;
    }
    const maxPosition = Math.max(
      ...navigationMenuItems
        .filter(
          (item) =>
            !isDefined(item.folderId) && isDefined(item.userWorkspaceId),
        )
        .map((item) => item.position),
      0,
    );

    createManyNavigationMenuItems([
      {
        id: v4(),
        type: NavigationMenuItemType.RECORD,
        targetRecordId: record.id,
        targetObjectMetadataId: objectMetadataItem.id,
        userWorkspaceId: currentUserWorkspaceId,
        position: maxPosition + 1,
      },
    ]);
  };

  const clone = () => {
    const { initialValues, initialRelatedRecords } = buildRoboostCloneValues(
      objectMetadataItem,
      record,
      objectMetadataItems,
      t`(copy)`,
    );

    openCreatePanel({
      objectNameSingular: objectMetadataItem.nameSingular,
      initialValues,
      initialRelatedRecords,
    });
  };

  const deleteRecord = async () => {
    await deleteOneRecord(record.id);
    setIsDeleteOpen(false);
    navigateApp(AppPath.RecordIndexPage, {
      objectNamePlural: objectMetadataItem.namePlural,
    });
  };

  // Entries without an action are modules not built yet; they stay visible
  const notBuilt = () => {};

  const entries: MenuEntry[] = [
    {
      id: 'follow',
      label: isDefined(favoriteItem) ? t`Unfollow` : t`Follow`,
      icon: 'star',
      onSelect: toggleFollow,
    },
    { id: 'sep-1', isSeparator: true },
    {
      id: 'all-properties',
      label: t`View all properties`,
      icon: 'list',
      onSelect: () =>
        setRoboostPropertiesPanel({
          objectNameSingular: objectMetadataItem.nameSingular,
          recordId: record.id,
        }),
    },
    {
      id: 'property-history',
      label: t`View property history`,
      icon: 'history',
      onSelect: notBuilt,
    },
    {
      id: 'association-history',
      label: t`View association history`,
      icon: 'history',
      onSelect: notBuilt,
    },
    {
      id: 'review-associations',
      label: t`Review associations`,
      icon: 'link',
      onSelect: notBuilt,
    },
    {
      id: 'summarize',
      label: t`Summarize`,
      icon: 'sparkles',
      onSelect: notBuilt,
    },
    { id: 'sep-2', isSeparator: true },
    {
      id: 'google',
      label: t`Search in Google`,
      icon: 'globe',
      hint: '↗',
      onSelect: () => {
        openUrlInNewTab(
          `https://www.google.com/search?q=${encodeURIComponent(recordName)}`,
        );
      },
    },
    {
      id: 'copy-link',
      label: copied ? t`Link copied` : t`Copy link`,
      icon: 'copy',
      onSelect: () => {
        navigator.clipboard
          .writeText(window.location.href.split('?')[0])
          .then(() => setCopied(true))
          .catch(() => {});
      },
    },
    {
      id: 'segment',
      label: t`Add to segment`,
      icon: 'segment',
      onSelect: () =>
        openSegmentMembershipInSidePanel({
          operation: 'ADD',
          objectNameSingular: objectMetadataItem.nameSingular,
          recordFilter: { id: { in: [record.id] } },
        }),
    },
    { id: 'merge', label: t`Merge`, icon: 'merge', onSelect: notBuilt },
    { id: 'clone', label: t`Clone`, icon: 'copy', onSelect: clone },
    {
      id: 'classic',
      label: t`Open classic record page`,
      icon: 'external-link',
      href: classicPagePath,
    },
    { id: 'sep-3', isSeparator: true },
    {
      id: 'delete',
      label: t`Delete`,
      icon: 'trash',
      isDanger: true,
      onSelect: () => setIsDeleteOpen(true),
    },
  ];

  return (
    <>
      <Menu
        align="right"
        minWidth={236}
        entries={entries}
        trigger={({ toggle, isOpen }) => (
          <button
            type="button"
            className="rb-rc-actbtn"
            aria-expanded={isOpen}
            onClick={() => {
              setCopied(false);
              toggle();
            }}
          >
            {t`Actions`}
            <Icon name="caret" size={12} />
          </button>
        )}
      />
      <Modal
        open={isDeleteOpen}
        tone="danger"
        title={t`Delete ${recordName}?`}
        subtitle={t`It moves to the trash and can be restored from there.`}
        onClose={() => setIsDeleteOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsDeleteOpen(false)}>
              {t`Cancel`}
            </Button>
            <Button variant="primary" tone="danger" onClick={deleteRecord}>
              {t`Delete`}
            </Button>
          </>
        }
      />
    </>
  );
};
