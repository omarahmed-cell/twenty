import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { RoboostListEditableCell } from '@/roboost-app/list/components/RoboostListEditableCell';
import { RoboostRecordContainer } from '@/roboost-app/record/components/RoboostRecordContainer';
import { Icon } from '@/roboost-ui/components/Icon';
import { Menu, type MenuEntry } from '@/roboost-ui/components/Menu';
import { useLingui } from '@lingui/react/macro';

type RoboostPropertyGroupContainerProps = {
  id: string;
  title: string;
  fields: FieldMetadataItem[];
  record: Record<string, unknown> & { id: string };
  objectMetadataItem: EnrichedObjectMetadataItem;
  objectMetadataItems: EnrichedObjectMetadataItem[];
  defaultOpen: boolean;
  settingsEntries: MenuEntry[];
  propertiesSettingsPath: string;
  isDropTarget: boolean;
  onDragStart: (id: string) => void;
  onDragOver: (id: string) => void;
  onDrop: (id: string) => void;
  onDragEnd: () => void;
  onSaved: () => void;
};

export const RoboostPropertyGroupContainer = ({
  id,
  title,
  fields,
  record,
  objectMetadataItem,
  objectMetadataItems,
  defaultOpen,
  settingsEntries,
  propertiesSettingsPath,
  isDropTarget,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onSaved,
}: RoboostPropertyGroupContainerProps) => {
  const { t } = useLingui();

  return (
    <RoboostRecordContainer
      id={id}
      title={title}
      defaultOpen={defaultOpen}
      settingsEntries={settingsEntries}
      isDropTarget={isDropTarget}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      actions={
        <Menu
          align="right"
          minWidth={220}
          entries={[
            {
              id: 'edit-group',
              label: t`Edit this group`,
              icon: 'pencil',
              href: propertiesSettingsPath,
            },
            // Property history is not built yet; the entry stays visible
            {
              id: 'history',
              label: t`View property history`,
              icon: 'history',
              onSelect: () => {},
            },
          ]}
          trigger={({ toggle, isOpen }) => (
            <button
              type="button"
              className="rb-rc-actbtn"
              aria-expanded={isOpen}
              onClick={toggle}
            >
              {t`Actions`}
              <Icon name="caret" size={12} />
            </button>
          )}
        />
      }
    >
      <div className="rb-prop1">
        {fields.map((field) => (
          <div key={field.id} className="rb-prop">
            <div className="rb-prop-label" title={field.label}>
              {field.label}
            </div>
            <div className="rb-prop-value">
              <RoboostListEditableCell
                field={field}
                record={record}
                objectMetadataItem={objectMetadataItem}
                objectMetadataItems={objectMetadataItems}
                onSaved={onSaved}
              />
            </div>
          </div>
        ))}
      </div>
    </RoboostRecordContainer>
  );
};
