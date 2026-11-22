import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { getRoboostRecordLabel } from '@/roboost-app/fields/getRoboostRecordLabel';
import { formatRoboostFieldValue } from '@/roboost-app/utils/formatRoboostFieldValue';
import { getRoboostAvatarTone } from '@/roboost-app/utils/getRoboostAvatarTone';
import { getRoboostOptionTone } from '@/roboost-app/utils/getRoboostOptionTone';
import { Avatar } from '@/roboost-ui/components/Avatar';
import { Icon } from '@/roboost-ui/components/Icon';
import { Tag } from '@/roboost-ui/components/Tag';
import { useLingui } from '@lingui/react/macro';
import { isNonEmptyString } from '@sniptt/guards';
import { Link } from 'react-router-dom';
import { AppPath } from 'twenty-shared/types';
import { getAppPath, isDefined } from 'twenty-shared/utils';

export type RoboostAssociationRecord = Record<string, unknown> & { id: string };

const TAG_FIELD_NAMES = ['stage', 'status', 'leadStatus', 'lifecycleStage'];

const LINE_FIELD_NAMES_BY_OBJECT: Record<string, string[]> = {
  person: ['jobTitle', 'emails', 'phones'],
  company: ['domainName', 'address'],
  opportunity: ['amount', 'closeDate'],
  service: ['pipeline', 'createdAt'],
};

export const getRoboostAssociationCardFields = (
  objectMetadataItem: EnrichedObjectMetadataItem,
) => {
  const activeFields = objectMetadataItem.fields.filter(
    (field) => field.isActive,
  );
  const findField = (name: string) =>
    activeFields.find((field) => field.name === name);

  const tagField = TAG_FIELD_NAMES.map(findField).find(isDefined);
  const lineFields = (
    LINE_FIELD_NAMES_BY_OBJECT[objectMetadataItem.nameSingular] ?? ['createdAt']
  )
    .map(findField)
    .filter(isDefined);

  return { tagField, lineFields };
};

type RoboostAssociationCardProps = {
  record: RoboostAssociationRecord;
  objectMetadataItem: EnrichedObjectMetadataItem;
  tagField: FieldMetadataItem | undefined;
  lineFields: FieldMetadataItem[];
  onRemove?: () => void;
};

export const RoboostAssociationCard = ({
  record,
  objectMetadataItem,
  tagField,
  lineFields,
  onRemove,
}: RoboostAssociationCardProps) => {
  const { t } = useLingui();
  const name =
    getRoboostRecordLabel(record, objectMetadataItem) ||
    t`Untitled ${objectMetadataItem.labelSingular.toLowerCase()}`;
  const tagOption = isDefined(tagField)
    ? tagField.options?.find((option) => option.value === record[tagField.name])
    : undefined;
  const avatarUrl = record.avatarUrl;
  const lines = lineFields
    .map((field) => ({
      label: field.label,
      value: formatRoboostFieldValue(field, record[field.name]),
    }))
    .filter((line) => isNonEmptyString(line.value) && line.value !== '—');

  return (
    <div className="rb-mini">
      <div className="rb-mini-top">
        <Avatar
          name={name}
          size="xs"
          src={isNonEmptyString(avatarUrl) ? avatarUrl : undefined}
          tone={getRoboostAvatarTone(name)}
        />
        <Link
          className="rb-mini-name"
          to={getAppPath(AppPath.RecordShowPage, {
            objectNameSingular: objectMetadataItem.nameSingular,
            objectRecordId: record.id,
          })}
          title={name}
        >
          {name}
        </Link>
        {isDefined(tagOption) && (
          <Tag
            tone={
              getRoboostOptionTone({
                value: tagOption.value,
                color: tagOption.color,
              }).tone
            }
          >
            {tagOption.label}
          </Tag>
        )}
        {isDefined(onRemove) && (
          <button
            type="button"
            className="rb-rc-iconbtn"
            aria-label={t`Remove association`}
            title={t`Remove association`}
            onClick={onRemove}
          >
            <Icon name="x" size={13} />
          </button>
        )}
      </div>
      {lines.length > 0 && (
        <div className="rb-mini-fields">
          {lines.map((line) => (
            <div key={line.label} className="rb-mini-line" title={line.value}>
              <span className="rb-mini-key">{line.label} · </span>
              {line.value}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
