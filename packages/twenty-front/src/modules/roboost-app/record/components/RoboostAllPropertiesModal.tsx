import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { useFindOneRecord } from '@/object-record/hooks/useFindOneRecord';
import { RoboostListEditableCell } from '@/roboost-app/list/components/RoboostListEditableCell';
import { isRoboostListableField } from '@/roboost-app/list/hooks/useRoboostViewColumns';
import { getRoboostListRecordGqlFields } from '@/roboost-app/list/utils/getRoboostListRecordGqlFields';
import { Button } from '@/roboost-ui/components/Button';
import { Input } from '@/roboost-ui/components/Input';
import { Modal } from '@/roboost-ui/components/Modal';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { isDefined } from 'twenty-shared/utils';
import { RelationType } from '~/generated-metadata/graphql';

type RoboostAllPropertiesModalProps = {
  objectMetadataItem: EnrichedObjectMetadataItem;
  objectMetadataItems: EnrichedObjectMetadataItem[];
  recordId: string;
  onClose: () => void;
  onSaved: () => void;
};

export const RoboostAllPropertiesModal = ({
  objectMetadataItem,
  objectMetadataItems,
  recordId,
  onClose,
  onSaved,
}: RoboostAllPropertiesModalProps) => {
  const { t } = useLingui();
  const [search, setSearch] = useState('');

  const fields = objectMetadataItem.fields
    .filter(
      (field) =>
        isRoboostListableField(field) &&
        (!isDefined(field.relation) ||
          field.relation.type === RelationType.MANY_TO_ONE),
    )
    .sort((first, second) => first.label.localeCompare(second.label));

  const { record, refetch } = useFindOneRecord({
    objectNameSingular: objectMetadataItem.nameSingular,
    objectRecordId: recordId,
    recordGqlFields: getRoboostListRecordGqlFields(
      objectMetadataItem,
      fields,
      objectMetadataItems,
    ),
  });

  const normalizedSearch = search.trim().toLowerCase();
  const visibleFields = fields.filter((field) =>
    field.label.toLowerCase().includes(normalizedSearch),
  );

  return (
    <Modal
      title={t`All properties`}
      subtitle={t`Every property of this ${objectMetadataItem.labelSingular.toLowerCase()}. Hover a value to edit it.`}
      width={640}
      onClose={onClose}
      footer={
        <Button variant="secondary" onClick={onClose}>
          {t`Close`}
        </Button>
      }
    >
      <div className="rb-allprops">
        <Input
          variant="search"
          value={search}
          placeholder={t`Search properties`}
          aria-label={t`Search properties`}
          onChange={(event) => setSearch(event.target.value)}
        />
        <div className="rb-allprops-list">
          {isDefined(record) &&
            visibleFields.map((field) => (
              <div key={field.id} className="rb-prop rb-allprops-row">
                <div className="rb-prop-label" title={field.label}>
                  {field.label}
                </div>
                <div className="rb-prop-value">
                  <RoboostListEditableCell
                    field={field}
                    record={record as Record<string, unknown> & { id: string }}
                    objectMetadataItem={objectMetadataItem}
                    objectMetadataItems={objectMetadataItems}
                    onSaved={() => {
                      refetch();
                      onSaved();
                    }}
                  />
                </div>
              </div>
            ))}
        </div>
      </div>
    </Modal>
  );
};
