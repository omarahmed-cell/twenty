import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { type RecordGqlFields } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';
import { RelationType } from '~/generated-metadata/graphql';

const RELATED_RECORDS_LIMIT = 60;

// Records on the other side of a one-to-many relation of the shown record
export const useRoboostRelatedRecords = ({
  sourceObjectMetadataItem,
  relationFieldName,
  sourceRecordId,
  recordGqlFields,
  joinColumnNameOverride,
}: {
  sourceObjectMetadataItem: EnrichedObjectMetadataItem;
  relationFieldName: string;
  sourceRecordId: string;
  recordGqlFields: RecordGqlFields;
  joinColumnNameOverride?: string;
}) => {
  const relationField = sourceObjectMetadataItem.fields.find(
    (field) =>
      field.name === relationFieldName &&
      field.isActive &&
      field.relation?.type === RelationType.ONE_TO_MANY,
  );
  const relation = relationField?.relation;
  const targetObjectNameSingular = relation?.targetObjectMetadata.nameSingular;
  const joinColumnName =
    joinColumnNameOverride ??
    (isDefined(relation)
      ? `${relation.targetFieldMetadata.name}Id`
      : undefined);

  const isAvailable =
    isDefined(targetObjectNameSingular) && isDefined(joinColumnName);

  // A missing relation still needs a valid object name for the hook; the read is skipped
  const { records, totalCount, loading } = useFindManyRecords<ObjectRecord>({
    objectNameSingular:
      targetObjectNameSingular ?? sourceObjectMetadataItem.nameSingular,
    filter: isAvailable
      ? { [joinColumnName]: { eq: sourceRecordId } }
      : undefined,
    skip: !isAvailable,
    recordGqlFields,
    orderBy: [{ createdAt: 'DescNullsLast' }],
    limit: RELATED_RECORDS_LIMIT,
  });

  return {
    isAvailable,
    targetObjectNameSingular,
    joinColumnName,
    records: isAvailable ? records : [],
    totalCount: isAvailable ? (totalCount ?? records.length) : 0,
    loading,
  };
};
