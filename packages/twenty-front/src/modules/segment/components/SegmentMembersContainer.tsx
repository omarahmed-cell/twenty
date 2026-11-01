import { useApolloCoreClient } from '@/object-metadata/hooks/useApolloCoreClient';
import { useObjectMetadataItems } from '@/object-metadata/hooks/useObjectMetadataItems';
import { useFindOneRecord } from '@/object-record/hooks/useFindOneRecord';
import { SegmentMembersTable } from '@/segment/components/SegmentMembersTable';
import { SegmentMembersTableProvider } from '@/segment/components/SegmentMembersTableProvider';
import { SegmentMembersToolbar } from '@/segment/components/SegmentMembersToolbar';
import { SegmentMembersViewCreateEffect } from '@/segment/components/SegmentMembersViewCreateEffect';
import { SEGMENT_MEMBERSHIP_FIELD_NAME } from '@/segment/constants/SegmentMembershipFieldName';
import { buildSegmentScopeRecordFilter } from '@/segment/utils/buildSegmentScopeRecordFilter';
import { getSegmentMembersViewId } from '@/segment/utils/getSegmentMembersViewId';
import { useAtomFamilySelectorValue } from '@/ui/utilities/state/jotai/hooks/useAtomFamilySelectorValue';
import { viewFromViewIdFamilySelector } from '@/views/states/selectors/viewFromViewIdFamilySelector';
import { styled } from '@linaria/react';
import { t } from '@lingui/core/macro';
import { useMemo, useState } from 'react';
import { SEGMENT_TARGET_OBJECT_NAME_SINGULARS } from 'twenty-shared/constants';
import {
  CoreObjectNameSingular,
  type SegmentTargetObject,
} from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';
import { themeCssVariables } from 'twenty-ui/theme';

const StyledContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
`;

const StyledHint = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  padding: ${themeCssVariables.spacing[4]};
`;

type SegmentRecord = {
  id: string;
  name: string | null;
  targetObject: SegmentTargetObject | null;
  __typename: 'Segment';
};

type SegmentMembersContainerProps = {
  segmentId: string;
};

export const SegmentMembersContainer = ({
  segmentId,
}: SegmentMembersContainerProps) => {
  const [membersVersion, setMembersVersion] = useState(0);

  const apolloCoreClient = useApolloCoreClient();
  const { objectMetadataItems } = useObjectMetadataItems();

  const { record: segment, loading } = useFindOneRecord<SegmentRecord>({
    objectNameSingular: CoreObjectNameSingular.Segment,
    objectRecordId: segmentId,
    recordGqlFields: { id: true, name: true, targetObject: true },
  });

  const targetObject = segment?.targetObject;

  const objectMetadataItem = isDefined(targetObject)
    ? objectMetadataItems.find(
        (item) =>
          item.nameSingular ===
          SEGMENT_TARGET_OBJECT_NAME_SINGULARS[targetObject],
      )
    : undefined;

  const segmentMembershipFieldMetadataItem = objectMetadataItem?.fields.find(
    (field) => field.name === SEGMENT_MEMBERSHIP_FIELD_NAME,
  );

  const segmentName = segment?.name ?? '';

  const scopeRecordFilter = useMemo(
    () =>
      isDefined(segmentMembershipFieldMetadataItem)
        ? buildSegmentScopeRecordFilter({
            segmentId,
            segmentName,
            segmentMembershipFieldMetadataItem,
          })
        : undefined,
    [segmentId, segmentName, segmentMembershipFieldMetadataItem],
  );

  const viewId = isDefined(objectMetadataItem)
    ? getSegmentMembersViewId(objectMetadataItem.id)
    : '';

  const view = useAtomFamilySelectorValue(viewFromViewIdFamilySelector, {
    viewId,
  });

  if (loading || !isDefined(segment)) {
    return null;
  }

  if (!isDefined(objectMetadataItem) || !isDefined(scopeRecordFilter)) {
    return (
      <StyledHint>{t`Pick the segment's target object first.`}</StyledHint>
    );
  }

  if (!isDefined(view)) {
    return (
      <SegmentMembersViewCreateEffect
        objectMetadataItem={objectMetadataItem}
        viewId={viewId}
      />
    );
  }

  // A fresh table instance after a membership change reloads rows and clears the selection.
  const handleMembersChanged = () => {
    apolloCoreClient.cache.evict({ fieldName: objectMetadataItem.namePlural });
    apolloCoreClient.cache.gc();
    setMembersVersion((previous) => previous + 1);
  };

  return (
    <StyledContainer>
      <SegmentMembersTableProvider
        key={membersVersion}
        objectMetadataItem={objectMetadataItem}
        viewId={viewId}
        instanceIdSuffix={`${segmentId}-${membersVersion}`}
        scopeRecordFilter={scopeRecordFilter}
      >
        <SegmentMembersToolbar
          segmentId={segmentId}
          segmentName={segmentName}
          objectMetadataItem={objectMetadataItem}
          onMembersChanged={handleMembersChanged}
        />
        <SegmentMembersTable />
      </SegmentMembersTableProvider>
    </StyledContainer>
  );
};
