import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { usePropertyLogicRules } from '@/properties/hooks/usePropertyLogicRules';
import { RoboostDependentPropertiesBox } from '@/roboost-app/record/components/RoboostDependentPropertiesBox';
import { RoboostPropertyRow } from '@/roboost-app/record/components/RoboostPropertyRow';
import { getRoboostDependentPropertyLayout } from '@/roboost-app/record/utils/getRoboostDependentPropertyLayout';
import { RoboostRecordContainer } from '@/roboost-app/record/components/RoboostRecordContainer';
import { Icon } from '@/roboost-ui/components/Icon';
import { Menu, type MenuEntry } from '@/roboost-ui/components/Menu';
import { useLingui } from '@lingui/react/macro';
import { Fragment, type ReactNode } from 'react';
import { isDefined } from 'twenty-shared/utils';

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
  const { rules, fields: logicFields } =
    usePropertyLogicRules(objectMetadataItem);
  const dependentLayout = getRoboostDependentPropertyLayout({
    fieldNames: fields.map((field) => field.name),
    rules,
    record,
    fields: logicFields,
  });
  const fieldByName = new Map(
    objectMetadataItem.fields
      .filter((field) => field.isActive)
      .map((field) => [field.name, field]),
  );

  const renderProperty = (
    field: FieldMetadataItem,
    isRequired = false,
  ): ReactNode => {
    const dependents =
      dependentLayout.dependentsByTriggerFieldName.get(field.name) ?? [];

    return (
      <Fragment key={field.id}>
        <RoboostPropertyRow
          field={field}
          record={record}
          objectMetadataItem={objectMetadataItem}
          objectMetadataItems={objectMetadataItems}
          onSaved={onSaved}
          isRequired={isRequired}
        />
        {dependents.length > 0 && (
          <RoboostDependentPropertiesBox>
            {dependents.map((dependent) => {
              const dependentField = fieldByName.get(dependent.fieldName);

              return isDefined(dependentField)
                ? renderProperty(dependentField, dependent.isRequired)
                : null;
            })}
          </RoboostDependentPropertiesBox>
        )}
      </Fragment>
    );
  };

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
        {dependentLayout.fieldNames
          .map((fieldName) => fieldByName.get(fieldName))
          .filter(isDefined)
          .map((field) => renderProperty(field))}
      </div>
    </RoboostRecordContainer>
  );
};
