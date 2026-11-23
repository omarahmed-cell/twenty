import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { useRoboostFieldGroups } from '@/roboost-app/list/hooks/useRoboostFieldGroups';
import { Icon } from '@/roboost-ui/components/Icon';
import { Menu, type MenuEntry } from '@/roboost-ui/components/Menu';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';

type RoboostColumnHeaderMenuProps = {
  objectMetadataItem: EnrichedObjectMetadataItem;
  columnLabel: string;
  shownFieldIds: string[];
  isFrozen: boolean;
  canRemove: boolean;
  onFreeze: () => void;
  onUnfreeze: () => void;
  onAddColumnRight: (fieldId: string) => void;
  onRemove: () => void;
};

export const RoboostColumnHeaderMenu = ({
  objectMetadataItem,
  columnLabel,
  shownFieldIds,
  isFrozen,
  canRemove,
  onFreeze,
  onUnfreeze,
  onAddColumnRight,
  onRemove,
}: RoboostColumnHeaderMenuProps) => {
  const { t } = useLingui();
  const [isChoosingField, setIsChoosingField] = useState(false);
  const groups = useRoboostFieldGroups(objectMetadataItem);

  const fieldEntries: MenuEntry[] = groups.flatMap((group) => {
    const fields = group.fields.filter(
      (field) => !shownFieldIds.includes(field.id),
    );

    return fields.length === 0
      ? []
      : [
          { id: `heading-${group.id}`, heading: group.title },
          ...fields.map((field) => ({
            id: field.id,
            label: field.label,
            onSelect: () => onAddColumnRight(field.id),
          })),
        ];
  });

  const actionEntries: MenuEntry[] = [
    isFrozen
      ? {
          id: 'unfreeze',
          label: t`Unfreeze column`,
          icon: 'pin',
          onSelect: onUnfreeze,
        }
      : {
          id: 'freeze',
          label: t`Freeze column`,
          icon: 'pin',
          onSelect: onFreeze,
        },
    {
      id: 'add',
      label: t`Add column`,
      icon: 'plus',
      keepMenuOpen: true,
      onSelect: () => setIsChoosingField(true),
    },
    ...(canRemove
      ? [
          {
            id: 'remove',
            label: t`Remove column`,
            icon: 'trash' as const,
            isDanger: true,
            onSelect: onRemove,
          },
        ]
      : []),
  ];

  return (
    <span
      className="rb-th-menu"
      onClick={(event) => event.stopPropagation()}
      onPointerDown={(event) => event.stopPropagation()}
      onDragStart={(event) => {
        event.preventDefault();
        event.stopPropagation();
      }}
    >
      <Menu
        minWidth={isChoosingField ? 260 : 200}
        isSearchable={isChoosingField}
        searchPlaceholder={t`Search properties`}
        entries={isChoosingField ? fieldEntries : actionEntries}
        onClose={() => setIsChoosingField(false)}
        trigger={({ isOpen, toggle }) => (
          <button
            type="button"
            className="rb-th-menu-btn"
            aria-label={t`${columnLabel} column options`}
            aria-expanded={isOpen}
            draggable={false}
            onClick={toggle}
          >
            <Icon name="more" size={14} />
          </button>
        )}
      />
    </span>
  );
};
