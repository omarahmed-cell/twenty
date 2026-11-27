import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { getRoboostRecordLabel } from '@/roboost-app/fields/getRoboostRecordLabel';
import { RoboostDomainLink } from '@/roboost-app/fields/RoboostDomainLink';
import { RoboostEmailLink } from '@/roboost-app/fields/RoboostEmailLink';
import { RoboostExtraValueChips } from '@/roboost-app/fields/RoboostExtraValueChips';
import { isRoboostMultiDomainField } from '@/roboost-app/fields/isRoboostMultiDomainField';
import { formatRoboostFieldValue } from '@/roboost-app/utils/formatRoboostFieldValue';
import { getRoboostDomainLabel } from '@/roboost-app/utils/getRoboostDomainLabel';
import { getRoboostOptionTone } from '@/roboost-app/utils/getRoboostOptionTone';
import { Avatar } from '@/roboost-ui/components/Avatar';
import { Tag } from '@/roboost-ui/components/Tag';
import { isNonEmptyString, isString } from '@sniptt/guards';
import { isDefined } from 'twenty-shared/utils';
import { FieldMetadataType, RelationType } from '~/generated-metadata/graphql';

type RoboostListCellValueProps = {
  field: FieldMetadataItem;
  record: Record<string, unknown>;
  objectMetadataItems: EnrichedObjectMetadataItem[];
  // Header lines show select values as coloured chips, like HubSpot's deal stage
  selectAsTag?: boolean;
  // Lets an email open the composer with this record's associations
  objectNameSingular?: string;
};

const MONO_FIELD_NAMES = new Set(['hubspotId', 'id']);

export const RoboostListCellValue = ({
  field,
  record,
  objectMetadataItems,
  selectAsTag = false,
  objectNameSingular,
}: RoboostListCellValueProps) => {
  const value = record[field.name];

  if (
    selectAsTag &&
    field.type === FieldMetadataType.SELECT &&
    isNonEmptyString(value)
  ) {
    const option = field.options?.find(
      (candidate) => candidate.value === value,
    );

    const { tone, dot } = getRoboostOptionTone({ value, color: option?.color });

    return (
      <Tag tone={tone} dot={dot}>
        {option?.label ?? value}
      </Tag>
    );
  }

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
    const links = value as {
      primaryLinkUrl?: string;
      secondaryLinks?: { url?: string }[] | null;
    } | null;
    const url = links?.primaryLinkUrl;
    const label = getRoboostDomainLabel(url);
    const extras = isRoboostMultiDomainField(field)
      ? (links?.secondaryLinks ?? [])
          .map((link) => getRoboostDomainLabel(link?.url))
          .filter(isNonEmptyString)
      : [];

    return isNonEmptyString(label) && isDefined(url) ? (
      <span className="rb-mv-display">
        <RoboostDomainLink url={url} label={label} />
        <RoboostExtraValueChips values={extras} />
      </span>
    ) : (
      <span className="rb-lt-muted">—</span>
    );
  }

  if (field.type === FieldMetadataType.EMAILS) {
    const emails = value as {
      primaryEmail?: string;
      additionalEmails?: unknown[] | null;
    } | null;
    const extras = (emails?.additionalEmails ?? []).filter(isNonEmptyString);

    return isNonEmptyString(emails?.primaryEmail) ? (
      <span className="rb-mv-display">
        <RoboostEmailLink
          email={emails.primaryEmail}
          className="rb-truncate"
          record={
            isNonEmptyString(objectNameSingular) && isString(record.id)
              ? { objectNameSingular, recordId: record.id }
              : undefined
          }
        />
        <RoboostExtraValueChips values={extras} />
      </span>
    ) : (
      <span className="rb-lt-muted">—</span>
    );
  }

  const text = formatRoboostFieldValue(field, value, record);
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
