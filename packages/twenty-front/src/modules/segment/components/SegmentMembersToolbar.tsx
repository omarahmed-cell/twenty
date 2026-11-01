import { contextStoreAnyFieldFilterValueComponentState } from '@/context-store/states/contextStoreAnyFieldFilterValueComponentState';
import { contextStoreFilterGroupsComponentState } from '@/context-store/states/contextStoreFilterGroupsComponentState';
import { contextStoreFiltersComponentState } from '@/context-store/states/contextStoreFiltersComponentState';
import { contextStoreNumberOfSelectedRecordsComponentState } from '@/context-store/states/contextStoreNumberOfSelectedRecordsComponentState';
import { contextStoreTargetedRecordsRuleComponentState } from '@/context-store/states/contextStoreTargetedRecordsRuleComponentState';
import { computeContextStoreFilters } from '@/context-store/utils/computeContextStoreFilters';
import { flattenedFieldMetadataItemsSelector } from '@/object-metadata/states/flattenedFieldMetadataItemsSelector';
import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { useFilterValueDependencies } from '@/object-record/record-filter/hooks/useFilterValueDependencies';
import { useRecordIndexContextOrThrow } from '@/object-record/record-index/contexts/RecordIndexContext';
import { useRecordIndexExportRecords } from '@/object-record/record-index/export/hooks/useRecordIndexExportRecords';
import { SegmentMembersAddRecordsDropdown } from '@/segment/components/SegmentMembersAddRecordsDropdown';
import { getSegmentRecordsInViewQueryParams } from '@/segment/utils/getSegmentRecordsInViewQueryParams';
import { useOpenRecordInSidePanel } from '@/side-panel/hooks/useOpenRecordInSidePanel';
import { useUpdateSegmentMembership } from '@/side-panel/pages/segment-membership/hooks/useUpdateSegmentMembership';
import { useAtomComponentStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomComponentStateValue';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { styled } from '@linaria/react';
import { t } from '@lingui/core/macro';
import { Link } from 'react-router-dom';
import { AppPath, CoreObjectNameSingular } from 'twenty-shared/types';
import { getAppPath, isDefined } from 'twenty-shared/utils';
import {
  IconAddressBook,
  IconFileExport,
  IconMinus,
  IconTable,
} from 'twenty-ui/icon';
import { Button } from 'twenty-ui/primitives/input';
import { themeCssVariables } from 'twenty-ui/theme';

const StyledToolbar = styled.div`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
  padding: ${themeCssVariables.spacing[3]} ${themeCssVariables.spacing[4]};
`;

const StyledSpacer = styled.div`
  flex: 1;
`;

type SegmentMembersToolbarProps = {
  segmentId: string;
  segmentName: string;
  objectMetadataItem: EnrichedObjectMetadataItem;
  onMembersChanged: () => void;
};

export const SegmentMembersToolbar = ({
  segmentId,
  segmentName,
  objectMetadataItem,
  onMembersChanged,
}: SegmentMembersToolbarProps) => {
  const { recordIndexId } = useRecordIndexContextOrThrow();

  const contextStoreTargetedRecordsRule = useAtomComponentStateValue(
    contextStoreTargetedRecordsRuleComponentState,
  );
  const contextStoreFilters = useAtomComponentStateValue(
    contextStoreFiltersComponentState,
  );
  const contextStoreFilterGroups = useAtomComponentStateValue(
    contextStoreFilterGroupsComponentState,
  );
  const contextStoreAnyFieldFilterValue = useAtomComponentStateValue(
    contextStoreAnyFieldFilterValueComponentState,
  );
  const contextStoreNumberOfSelectedRecords = useAtomComponentStateValue(
    contextStoreNumberOfSelectedRecordsComponentState,
  );

  const { filterValueDependencies } = useFilterValueDependencies();
  const flattenedFieldMetadataItems = useAtomStateValue(
    flattenedFieldMetadataItemsSelector,
  );

  const selectedRecordsFilter = computeContextStoreFilters({
    contextStoreTargetedRecordsRule,
    contextStoreFilters,
    contextStoreFilterGroups,
    objectMetadataItem,
    fieldMetadataItems: flattenedFieldMetadataItems,
    filterValueDependencies,
    contextStoreAnyFieldFilterValue,
  });

  const { updateSegmentMembership, isUpdating } = useUpdateSegmentMembership({
    onCompleted: onMembersChanged,
  });

  const { download } = useRecordIndexExportRecords({
    delayMs: 100,
    objectMetadataItem,
    recordIndexId,
    filename: `${objectMetadataItem.nameSingular}.csv`,
  });

  const { openRecordInSidePanel } = useOpenRecordInSidePanel();

  const useInViewPath = getAppPath(
    AppPath.RecordIndexPage,
    { objectNamePlural: objectMetadataItem.namePlural },
    getSegmentRecordsInViewQueryParams({ segmentId, segmentName }),
  );

  const handleRemoveFromSegment = () => {
    if (!isDefined(selectedRecordsFilter)) {
      return;
    }

    void updateSegmentMembership({
      segmentId,
      request: {
        operation: 'REMOVE',
        objectNameSingular: objectMetadataItem.nameSingular,
        recordFilter: selectedRecordsFilter,
      },
    });
  };

  return (
    <StyledToolbar>
      <SegmentMembersAddRecordsDropdown
        segmentId={segmentId}
        objectMetadataItem={objectMetadataItem}
        onMembersChanged={onMembersChanged}
      />
      <Button
        size="sm"
        variant="outline"
        color="danger"
        startIcon={<IconMinus />}
        loading={isUpdating}
        disabled={isUpdating || contextStoreNumberOfSelectedRecords === 0}
        onClick={handleRemoveFromSegment}
      >
        {contextStoreNumberOfSelectedRecords > 0
          ? t`Remove ${contextStoreNumberOfSelectedRecords} from segment`
          : t`Remove from segment`}
      </Button>
      <StyledSpacer />
      <Button
        size="sm"
        variant="ghost"
        startIcon={<IconFileExport />}
        onClick={download}
      >{t`Export`}</Button>
      <Button
        size="sm"
        variant="ghost"
        startIcon={<IconAddressBook />}
        onClick={() =>
          openRecordInSidePanel({
            recordId: segmentId,
            objectNameSingular: CoreObjectNameSingular.Segment,
          })
        }
      >{t`Details`}</Button>
      <Button
        size="sm"
        variant="outline"
        startIcon={<IconTable />}
        href={useInViewPath}
        nativeButton={false}
        role="link"
        render={<Link to={useInViewPath} />}
      >{t`Use in view`}</Button>
    </StyledToolbar>
  );
};
