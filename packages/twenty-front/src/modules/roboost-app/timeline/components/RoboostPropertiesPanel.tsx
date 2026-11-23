import { useObjectMetadataItems } from '@/object-metadata/hooks/useObjectMetadataItems';
import { useFindOneRecord } from '@/object-record/hooks/useFindOneRecord';
import { isRoboostListableField } from '@/roboost-app/list/hooks/useRoboostViewColumns';
import { getRoboostListRecordGqlFields } from '@/roboost-app/list/utils/getRoboostListRecordGqlFields';
import { RoboostPropertyRow } from '@/roboost-app/record/components/RoboostPropertyRow';
import {
  roboostPropertiesPanelState,
  type RoboostPropertiesPanelTarget,
} from '@/roboost-app/timeline/states/roboostPropertiesPanelState';
import { Input } from '@/roboost-ui/components/Input';
import { SidePanel } from '@/roboost-ui/components/SidePanel';
import { useAtomState } from '@/ui/utilities/state/jotai/hooks/useAtomState';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { isDefined } from 'twenty-shared/utils';
import { RelationType } from '~/generated-metadata/graphql';

const RoboostPropertiesPanelContent = ({
  target,
  onClose,
}: {
  target: RoboostPropertiesPanelTarget;
  onClose: () => void;
}) => {
  const { t } = useLingui();
  const { objectMetadataItems } = useObjectMetadataItems();
  const [search, setSearch] = useState('');
  const objectMetadataItem = objectMetadataItems.find(
    (item) => item.nameSingular === target.objectNameSingular,
  );
  const fields = (objectMetadataItem?.fields ?? [])
    .filter(
      (field) =>
        isRoboostListableField(field) &&
        (!isDefined(field.relation) ||
          field.relation.type === RelationType.MANY_TO_ONE),
    )
    .sort((first, second) => first.label.localeCompare(second.label));

  const { record, refetch } = useFindOneRecord({
    objectNameSingular: target.objectNameSingular,
    objectRecordId: target.recordId,
    recordGqlFields: isDefined(objectMetadataItem)
      ? getRoboostListRecordGqlFields(
          objectMetadataItem,
          fields,
          objectMetadataItems,
        )
      : undefined,
    skip: !isDefined(objectMetadataItem),
  });

  const searchTerm = search.trim().toLowerCase();
  const visibleFields = fields.filter((field) =>
    field.label.toLowerCase().includes(searchTerm),
  );

  return (
    <SidePanel
      title={t`All properties`}
      onClose={onClose}
      width={520}
      className="rb-props-panel"
    >
      <div className="rb-props-search">
        <Input
          variant="search"
          size="sm"
          value={search}
          placeholder={t`Search properties`}
          aria-label={t`Search properties`}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>
      {!isDefined(record) || !isDefined(objectMetadataItem) ? (
        <div className="rb-history-empty">{t`Loading properties…`}</div>
      ) : (
        <div className="rb-props-list">
          {visibleFields.map((field) => (
            <RoboostPropertyRow
              key={field.id}
              field={field}
              record={record}
              objectMetadataItem={objectMetadataItem}
              objectMetadataItems={objectMetadataItems}
              onSaved={() => refetch()}
            />
          ))}
          {visibleFields.length === 0 && (
            <div className="rb-history-empty">{t`No matching properties.`}</div>
          )}
        </div>
      )}
    </SidePanel>
  );
};

export const RoboostPropertiesPanel = () => {
  const [roboostPropertiesPanel, setRoboostPropertiesPanel] = useAtomState(
    roboostPropertiesPanelState,
  );

  if (!isDefined(roboostPropertiesPanel)) {
    return null;
  }

  return (
    <RoboostPropertiesPanelContent
      key={`${roboostPropertiesPanel.objectNameSingular}-${roboostPropertiesPanel.recordId}`}
      target={roboostPropertiesPanel}
      onClose={() => setRoboostPropertiesPanel(null)}
    />
  );
};
