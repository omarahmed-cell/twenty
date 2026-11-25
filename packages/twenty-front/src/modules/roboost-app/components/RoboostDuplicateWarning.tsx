import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { getRoboostDomainLabel } from '@/roboost-app/utils/getRoboostDomainLabel';
import { Icon } from '@/roboost-ui/components/Icon';
import { useLingui } from '@lingui/react/macro';
import { isNonEmptyString, isString } from '@sniptt/guards';
import { Link } from 'react-router-dom';
import { AppPath } from 'twenty-shared/types';
import { getAppPath } from 'twenty-shared/utils';
import { useDebounce } from 'use-debounce';

type RoboostDuplicateWarningProps = {
  objectMetadataItem: EnrichedObjectMetadataItem;
  field: FieldMetadataItem;
  value: unknown;
  onOpen: () => void;
};

const getDuplicateCheck = (
  objectNameSingular: string,
  fieldName: string,
  value: unknown,
) => {
  const composite = value as Record<string, unknown> | null | undefined;

  if (objectNameSingular === 'company' && fieldName === 'domainName') {
    const domain = getRoboostDomainLabel(
      isString(composite?.primaryLinkUrl) ? composite.primaryLinkUrl : '',
    ).toLowerCase();

    return domain.length > 3 && domain.includes('.')
      ? {
          or: [
            { domainName: { primaryLinkUrl: { ilike: `%${domain}%` } } },
            { domainName: { secondaryLinks: { ilike: `%"${domain}"%` } } },
          ],
        }
      : undefined;
  }

  if (objectNameSingular === 'person' && fieldName === 'emails') {
    const email = isString(composite?.primaryEmail)
      ? composite.primaryEmail.trim().toLowerCase()
      : '';

    return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)
      ? {
          or: [
            { emails: { primaryEmail: { ilike: email } } },
            { emails: { additionalEmails: { ilike: `%"${email}"%` } } },
          ],
        }
      : undefined;
  }

  return undefined;
};

// Companies are unique by domain and contacts by email; warn before a second one is created
export const RoboostDuplicateWarning = ({
  objectMetadataItem,
  field,
  value,
  onOpen,
}: RoboostDuplicateWarningProps) => {
  const { t } = useLingui();
  const [debouncedValue] = useDebounce(value, 400);
  const filter = getDuplicateCheck(
    objectMetadataItem.nameSingular,
    field.name,
    debouncedValue,
  );

  const { records } = useFindManyRecords({
    objectNameSingular: objectMetadataItem.nameSingular,
    filter,
    skip: filter === undefined,
    recordGqlFields: { id: true },
    limit: 1,
  });

  const duplicate = filter !== undefined ? records[0] : undefined;

  if (duplicate === undefined || !isNonEmptyString(duplicate.id)) {
    return null;
  }

  const message =
    objectMetadataItem.nameSingular === 'company'
      ? t`A company with this domain already exists`
      : t`A contact with this email already exists`;

  return (
    <div className="rb-dupe">
      <Icon name="alert-triangle" size={15} />
      <span>
        {message} ·{' '}
        <Link
          className="rb-link"
          onClick={onOpen}
          to={getAppPath(AppPath.RecordShowPage, {
            objectNameSingular: objectMetadataItem.nameSingular,
            objectRecordId: duplicate.id,
          })}
        >
          {t`Open it`}
        </Link>
      </span>
    </div>
  );
};
