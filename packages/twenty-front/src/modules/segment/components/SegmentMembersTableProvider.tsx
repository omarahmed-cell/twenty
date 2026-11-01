import { ContextStoreComponentInstanceContext } from '@/context-store/states/contexts/ContextStoreComponentInstanceContext';
import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { RecordComponentInstanceContextsWrapper } from '@/object-record/components/RecordComponentInstanceContextsWrapper';
import { useObjectPermissions } from '@/object-record/hooks/useObjectPermissions';
import { type RecordFilter } from '@/object-record/record-filter/types/RecordFilter';
import { RecordIndexContextProvider } from '@/object-record/record-index/contexts/RecordIndexContext';
import { useRecordIndexFieldMetadataDerivedStates } from '@/object-record/record-index/hooks/useRecordIndexFieldMetadataDerivedStates';
import { RecordTableWidgetContextStoreInitEffect } from '@/object-record/record-table-widget/components/RecordTableWidgetContextStoreInitEffect';
import { getRecordIndexIdFromObjectNamePluralAndViewId } from '@/object-record/utils/getRecordIndexIdFromObjectNamePluralAndViewId';
import { SegmentMembersScopeEffect } from '@/segment/components/SegmentMembersScopeEffect';
import { SegmentMembersViewLoadEffect } from '@/segment/components/SegmentMembersViewLoadEffect';
import { ViewComponentInstanceContext } from '@/views/states/contexts/ViewComponentInstanceContext';
import { type PropsWithChildren, useCallback } from 'react';
import { AppPath } from 'twenty-shared/types';
import { getAppPath } from 'twenty-shared/utils';

type SegmentMembersTableProviderProps = PropsWithChildren<{
  objectMetadataItem: EnrichedObjectMetadataItem;
  viewId: string;
  instanceIdSuffix: string;
  scopeRecordFilter: RecordFilter;
}>;

// Same contexts as RecordTableWidgetProvider, minus the widget context, so view changes persist to the hidden view.
export const SegmentMembersTableProvider = ({
  objectMetadataItem,
  viewId,
  instanceIdSuffix,
  scopeRecordFilter,
  children,
}: SegmentMembersTableProviderProps) => {
  const recordIndexId = `${getRecordIndexIdFromObjectNamePluralAndViewId(
    objectMetadataItem.namePlural,
    viewId,
  )}-${instanceIdSuffix}`;

  const { objectPermissionsByObjectMetadataId } = useObjectPermissions();

  const {
    fieldDefinitionByFieldMetadataItemId,
    fieldMetadataItemByFieldMetadataItemId,
    labelIdentifierFieldMetadataItem,
    recordFieldByFieldMetadataItemId,
  } = useRecordIndexFieldMetadataDerivedStates(
    objectMetadataItem,
    recordIndexId,
  );

  const indexIdentifierUrl = useCallback(
    (recordId: string) =>
      getAppPath(AppPath.RecordShowPage, {
        objectNameSingular: objectMetadataItem.nameSingular,
        objectRecordId: recordId,
      }),
    [objectMetadataItem.nameSingular],
  );

  const handleIndexRecordsLoaded = useCallback(() => {}, []);

  return (
    <ContextStoreComponentInstanceContext.Provider
      value={{ instanceId: `segment-members-${instanceIdSuffix}` }}
    >
      <RecordTableWidgetContextStoreInitEffect
        objectMetadataItemId={objectMetadataItem.id}
        viewId={viewId}
      />
      <RecordIndexContextProvider
        value={{
          objectPermissionsByObjectMetadataId,
          recordIndexId,
          viewBarInstanceId: recordIndexId,
          objectNamePlural: objectMetadataItem.namePlural,
          objectNameSingular: objectMetadataItem.nameSingular,
          objectMetadataItem,
          onIndexRecordsLoaded: handleIndexRecordsLoaded,
          indexIdentifierUrl,
          recordFieldByFieldMetadataItemId,
          labelIdentifierFieldMetadataItem,
          fieldMetadataItemByFieldMetadataItemId,
          fieldDefinitionByFieldMetadataItemId,
        }}
      >
        <ViewComponentInstanceContext.Provider
          value={{ instanceId: recordIndexId }}
        >
          <RecordComponentInstanceContextsWrapper
            componentInstanceId={recordIndexId}
          >
            <SegmentMembersScopeEffect scopeRecordFilter={scopeRecordFilter} />
            <SegmentMembersViewLoadEffect
              viewId={viewId}
              objectMetadataItem={objectMetadataItem}
            />
            {children}
          </RecordComponentInstanceContextsWrapper>
        </ViewComponentInstanceContext.Provider>
      </RecordIndexContextProvider>
    </ContextStoreComponentInstanceContext.Provider>
  );
};
