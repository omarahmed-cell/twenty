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

const RoboostColumnHeaderMenuContent = ({
  objectMetadataItem,
  columnLabel,
  shownFieldIds,
  isFrozen,
  canRemove,
  onFreeze,
  onUnfreeze,
  onAddColumnRight,
  onRemove,
  onDismiss,
}: RoboostColumnHeaderMenuProps & { onDismiss: () => void }) => {
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
    <Menu
      initiallyOpen
      minWidth={isChoosingField ? 260 : 200}
      isSearchable={isChoosingField}
      searchPlaceholder={t`Search properties`}
      entries={isChoosingField ? fieldEntries : actionEntries}
      onClose={() => {
        setIsChoosingField(false);
        onDismiss();
      }}
      trigger={({ isOpen, toggle }) => (
        <RoboostColumnHeaderMenuButton
          columnLabel={columnLabel}
          isOpen={isOpen}
          onClick={toggle}
        />
      )}
    />
  );
};

const RoboostColumnHeaderMenuButton = ({
  columnLabel,
  isOpen,
  onClick,
}: {
  columnLabel: string;
  isOpen: boolean;
  onClick: () => void;
}) => {
  const { t } = useLingui();

  return (
    <button
      type="button"
      className="rb-th-menu-btn"
      aria-label={t`${columnLabel} column options`}
      aria-expanded={isOpen}
      draggable={false}
      onClick={onClick}
    >
      <Icon name="more-vertical" size={14} />
    </button>
  );
};

// Headers render only the button; the menu and its field list mount on click
export const RoboostColumnHeaderMenu = (
  props: RoboostColumnHeaderMenuProps,
) => {
  const [isActive, setIsActive] = useState(false);

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
      {isActive ? (
        <RoboostColumnHeaderMenuContent
          objectMetadataItem={props.objectMetadataItem}
          columnLabel={props.columnLabel}
          shownFieldIds={props.shownFieldIds}
          isFrozen={props.isFrozen}
          canRemove={props.canRemove}
          onFreeze={props.onFreeze}
          onUnfreeze={props.onUnfreeze}
          onAddColumnRight={props.onAddColumnRight}
          onRemove={props.onRemove}
          onDismiss={() => setIsActive(false)}
        />
      ) : (
        <RoboostColumnHeaderMenuButton
          columnLabel={props.columnLabel}
          isOpen={false}
          onClick={() => setIsActive(true)}
        />
      )}
    </span>
  );
};
