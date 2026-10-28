import { HeadlessEngineCommandWrapperEffect } from '@/command-menu-item/engine-command/components/HeadlessEngineCommandWrapperEffect';
import { useHeadlessCommandContextApi } from '@/command-menu-item/engine-command/hooks/useHeadlessCommandContextApi';
import { useObjectMetadataItems } from '@/object-metadata/hooks/useObjectMetadataItems';
import { useFindOneRecord } from '@/object-record/hooks/useFindOneRecord';
import { t } from '@lingui/core/macro';
import { SEGMENT_TARGET_OBJECT_NAME_SINGULARS } from 'twenty-shared/constants';
import { doNotTranslate } from 'twenty-shared/i18n';
import {
  AppPath,
  CoreObjectNameSingular,
  type SegmentTargetObject,
  ViewFilterOperand,
} from 'twenty-shared/types';
import {
  getSegmentMembershipOptionValue,
  isDefined,
} from 'twenty-shared/utils';
import { useNavigateApp } from '~/hooks/useNavigateApp';

type SegmentRecord = {
  id: string;
  name: string | null;
  targetObject: SegmentTargetObject | null;
  __typename: 'Segment';
};

export const OpenSegmentRecordsSingleRecordCommand = () => {
  const { selectedRecords } = useHeadlessCommandContextApi();
  const segmentId = selectedRecords[0]?.id;

  const navigate = useNavigateApp();
  const { objectMetadataItems } = useObjectMetadataItems();

  const { record: segment, loading } = useFindOneRecord<SegmentRecord>({
    objectNameSingular: CoreObjectNameSingular.Segment,
    objectRecordId: segmentId,
    recordGqlFields: { id: true, name: true, targetObject: true },
    skip: !isDefined(segmentId),
  });

  if (!isDefined(segmentId)) {
    throw new Error(doNotTranslate('Segment ID is required to open records'));
  }

  const handleExecute = () => {
    const targetObject = segment?.targetObject;

    if (!isDefined(segment) || !isDefined(targetObject)) {
      throw new Error(t`Pick the segment's target object first.`);
    }

    const objectNamePlural = objectMetadataItems.find(
      (objectMetadataItem) =>
        objectMetadataItem.nameSingular ===
        SEGMENT_TARGET_OBJECT_NAME_SINGULARS[targetObject],
    )?.namePlural;

    if (!isDefined(objectNamePlural)) {
      throw new Error(doNotTranslate('Segment target object not found'));
    }

    navigate(
      AppPath.RecordIndexPage,
      { objectNamePlural },
      {
        filter: {
          segmentMembership: {
            [ViewFilterOperand.CONTAINS]: [
              getSegmentMembershipOptionValue(segment.id),
            ],
          },
        },
        filterDisplayValue: {
          segmentMembership: {
            [ViewFilterOperand.CONTAINS]: segment.name ?? '',
          },
        },
      },
    );
  };

  return (
    <HeadlessEngineCommandWrapperEffect
      execute={handleExecute}
      ready={!loading}
    />
  );
};
