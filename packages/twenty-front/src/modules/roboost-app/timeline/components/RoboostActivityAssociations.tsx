import { useObjectMetadataItems } from '@/object-metadata/hooks/useObjectMetadataItems';
import { useCreateOneRecord } from '@/object-record/hooks/useCreateOneRecord';
import { useDeleteOneRecord } from '@/object-record/hooks/useDeleteOneRecord';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { getRoboostRecordLabel } from '@/roboost-app/fields/getRoboostRecordLabel';
import { RoboostRecordPicker } from '@/roboost-app/fields/RoboostRecordPicker';
import { Icon } from '@/roboost-ui/components/Icon';
import { Popover } from '@/roboost-ui/components/Popover';
import { Select } from '@/roboost-ui/components/Select';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CoreObjectNameSingular } from 'twenty-shared/types';
import { capitalize, isDefined } from 'twenty-shared/utils';
import { RelationType } from '~/generated-metadata/graphql';

type JunctionRecord = Record<string, unknown> & {
  id: string;
  __typename: string;
};

type RoboostActivityAssociationsProps = {
  objectNameSingular: string;
  recordId: string;
  canEdit: boolean;
};

export const RoboostActivityAssociations = ({
  objectNameSingular,
  recordId,
  canEdit,
}: RoboostActivityAssociationsProps) => {
  const { t } = useLingui();
  const { objectMetadataItems } = useObjectMetadataItems();
  const [pickerObject, setPickerObject] = useState('company');
  const junctionName = `${objectNameSingular}Target`;
  const junctionMetadataItem = objectMetadataItems.find(
    (item) => item.nameSingular === junctionName,
  );
  const targetFields = (junctionMetadataItem?.fields ?? []).filter(
    (field) =>
      field.isActive &&
      field.name.startsWith('target') &&
      field.relation?.type === RelationType.MANY_TO_ONE,
  );
  const targetObjectNames = targetFields
    .map((field) => field.relation?.targetObjectMetadata.nameSingular)
    .filter(isDefined);

  // Record hooks throw for an unknown object even when skipped, so fall back to a junction that always exists
  const queriedJunctionName = isDefined(junctionMetadataItem)
    ? junctionName
    : CoreObjectNameSingular.NoteTarget;

  const { records, refetch } = useFindManyRecords<JunctionRecord>({
    objectNameSingular: queriedJunctionName,
    filter: { [`${objectNameSingular}Id`]: { eq: recordId } },
    recordGqlFields: {
      id: true,
      ...Object.fromEntries(
        targetFields.map((field) => [field.name, { id: true, name: true }]),
      ),
    },
    skip: !isDefined(junctionMetadataItem),
  });
  const { createOneRecord } = useCreateOneRecord({
    objectNameSingular: queriedJunctionName,
  });
  const { deleteOneRecord } = useDeleteOneRecord({
    objectNameSingular: queriedJunctionName,
  });

  const links = records.flatMap((record) =>
    targetFields.flatMap((field) => {
      const target = record[field.name] as
        | (Record<string, unknown> & { id: string })
        | null
        | undefined;
      const targetObjectNameSingular =
        field.relation?.targetObjectMetadata.nameSingular;

      if (!isDefined(target) || !isDefined(targetObjectNameSingular)) {
        return [];
      }
      const targetMetadataItem = objectMetadataItems.find(
        (item) => item.nameSingular === targetObjectNameSingular,
      );

      return [
        {
          junctionId: record.id,
          targetId: target.id,
          objectNameSingular: targetObjectNameSingular,
          objectLabel: targetMetadataItem?.labelSingular ?? '',
          label: getRoboostRecordLabel(target, targetMetadataItem),
        },
      ];
    }),
  );

  const pickerOptions = objectMetadataItems
    .filter((item) => targetObjectNames.includes(item.nameSingular))
    .map((item) => ({ value: item.nameSingular, label: item.labelSingular }));

  if (!isDefined(junctionMetadataItem)) {
    return null;
  }

  return (
    <Popover
      align="right"
      ariaLabel={t`Associations`}
      className="rb-assoc-pop"
      trigger={({ toggle, isOpen }) => (
        <button
          type="button"
          className="rb-act-assoc-btn"
          aria-expanded={isOpen}
          onClick={toggle}
        >
          {links.length === 1
            ? t`1 association`
            : t`${links.length} associations`}
          <Icon name="caret" size={12} />
        </button>
      )}
    >
      {() => (
        <div className="rb-assoc-body">
          {links.length === 0 && (
            <div className="rb-menu-empty">{t`Not associated with any record.`}</div>
          )}
          {links.map((link) => (
            <div key={link.junctionId} className="rb-assoc-row">
              <span className="rb-assoc-type">{link.objectLabel}</span>
              <Link
                className="rb-assoc-name"
                to={`/object/${link.objectNameSingular}/${link.targetId}`}
              >
                {link.label}
              </Link>
              {canEdit && (
                <button
                  type="button"
                  className="rb-rc-iconbtn"
                  aria-label={t`Remove ${link.label}`}
                  onClick={async () => {
                    await deleteOneRecord(link.junctionId);
                    await refetch();
                  }}
                >
                  <Icon name="x" size={13} />
                </button>
              )}
            </div>
          ))}
          {canEdit && pickerOptions.length > 0 && (
            <div className="rb-assoc-add">
              <Select
                aria-label={t`Record type`}
                value={pickerObject}
                options={pickerOptions}
                onChange={setPickerObject}
              />
              <RoboostRecordPicker
                key={pickerObject}
                objectNameSingular={pickerObject}
                selectedLabel=""
                placeholder={t`Add association…`}
                isClearable={false}
                onSelect={async (record) => {
                  if (!isDefined(record)) {
                    return;
                  }
                  await createOneRecord({
                    [`${objectNameSingular}Id`]: recordId,
                    [`target${capitalize(pickerObject)}Id`]: record.id,
                  });
                  await refetch();
                }}
              />
            </div>
          )}
        </div>
      )}
    </Popover>
  );
};
