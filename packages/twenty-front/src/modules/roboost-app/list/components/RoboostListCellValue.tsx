import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { getRoboostRecordLabel } from '@/roboost-app/fields/getRoboostRecordLabel';
import { formatRoboostFieldValue } from '@/roboost-app/utils/formatRoboostFieldValue';
import { getRoboostDomainLabel } from '@/roboost-app/utils/getRoboostDomainLabel';
import { Avatar } from '@/roboost-ui/components/Avatar';
import { isNonEmptyString, isString } from '@sniptt/guards';
import { isDefined } from 'twenty-shared/utils';
import { FieldMetadataType, RelationType } from '~/generated-metadata/graphql';

type RoboostListCellValueProps = {
  field: FieldMetadataItem;
  record: Record<string, unknown>;
  objectMetadataItems: EnrichedObjectMetadataItem[];
};

const MONO_FIELD_NAMES = new Set(['hubspotId', 'id']);

export const RoboostListCellValue = ({
  field,
  record,
  objectMetadataItems,
}: RoboostListCellValueProps) => {
  const value = record[field.name];

  if (field.type === FieldMetadataType.RELATION) {
    if (field.relation?.type === RelationType.ONE_TO_MANY) {
      const edges = (value as { edges?: unknown[] } | null)?.edges;

      return <span>{Array.isArray(edges) ? edges.length : '—'}</span>;
    }
    const target = objectMetadataItems.find(
      (item) =>
        item.nameSingular === field.relation?.targetObjectMetadata.nameSingular,
    );
    const related = value as (Record<string, unknown> & { id: string }) | null;
    const label = getRoboostRecordLabel(related, target);

    return isNonEmptyString(label) ? (
      <span className="rb-lowner">
        <Avatar
          name={label}
          src={isString(related?.avatarUrl) ? related.avatarUrl : null}
          size="xs"
        />
        <span>{label}</span>
      </span>
    ) : (
      <span className="rb-lt-muted">—</span>
    );
  }

  if (field.type === FieldMetadataType.LINKS) {
    const url = (value as { primaryLinkUrl?: string } | null)?.primaryLinkUrl;
    const label = getRoboostDomainLabel(url);

    return isNonEmptyString(label) && isDefined(url) ? (
      <a
        className="rb-ldomain"
        href={url.startsWith('http') ? url : `https://${url}`}
        target="_blank"
        rel="noreferrer"
        onClick={(event) => event.stopPropagation()}
      >
        {label}
      </a>
    ) : (
      <span className="rb-lt-muted">—</span>
    );
  }

  const text = formatRoboostFieldValue(field, value);
  const isMuted =
    text === '—' ||
    field.type === FieldMetadataType.DATE ||
    field.type === FieldMetadataType.DATE_TIME;

  return (
    <span
      className={
        MONO_FIELD_NAMES.has(field.name)
          ? 'rb-lt-mono'
          : isMuted
            ? 'rb-lt-muted'
            : undefined
      }
    >
      {text}
    </span>
  );
};
