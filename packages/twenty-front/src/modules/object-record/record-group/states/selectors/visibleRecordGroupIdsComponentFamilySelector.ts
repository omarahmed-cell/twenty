import { visibleRecordGroupIdsIncludingEmptyComponentSelector } from '@/object-record/record-group/states/selectors/visibleRecordGroupIdsIncludingEmptyComponentSelector';
import { type RecordGroupDefinition } from '@/object-record/record-group/types/RecordGroupDefinition';
import { recordIndexRecordIdsByGroupComponentFamilyState } from '@/object-record/record-index/states/recordIndexRecordIdsByGroupComponentFamilyState';
import { recordIndexShouldHideEmptyRecordGroupsComponentState } from '@/object-record/record-index/states/recordIndexShouldHideEmptyRecordGroupsComponentState';
import { createAtomComponentFamilySelector } from '@/ui/utilities/state/jotai/utils/createAtomComponentFamilySelector';
import { ViewComponentInstanceContext } from '@/views/states/contexts/ViewComponentInstanceContext';
import { recordGroupDefinitionFamilyState } from '@/object-record/record-group/states/recordGroupDefinitionFamilyState';
import { recordGroupIdsComponentState } from '@/object-record/record-group/states/recordGroupIdsComponentState';
import { pipelineBoardScopeComponentState } from '@/pipeline/board/states/pipelineBoardScopeComponentState';
import { orderRecordGroupsForPipelineBoardScope } from '@/pipeline/board/utils/orderRecordGroupsForPipelineBoardScope';
import { ViewType } from '@/views/types/ViewType';
import { isDefined } from 'twenty-shared/utils';

export const visibleRecordGroupIdsComponentFamilySelector =
  createAtomComponentFamilySelector<RecordGroupDefinition['id'][], ViewType>({
    key: 'visibleRecordGroupIdsComponentFamilySelector',
    componentInstanceContext: ViewComponentInstanceContext,
    get:
      ({ instanceId, familyKey: viewType }) =>
      ({ get }) => {
        const pipelineBoardScope =
          viewType === ViewType.KANBAN
            ? get(pipelineBoardScopeComponentState, { instanceId })
            : null;

        const visibleRecordGroupIds = isDefined(pipelineBoardScope)
          ? orderRecordGroupsForPipelineBoardScope({
              recordGroups: get(recordGroupIdsComponentState, { instanceId })
                .map((recordGroupId) =>
                  get(recordGroupDefinitionFamilyState, recordGroupId),
                )
                .filter(isDefined),
              scope: pipelineBoardScope,
            }).map(({ id }) => id)
          : get(visibleRecordGroupIdsIncludingEmptyComponentSelector, {
              instanceId,
            });

        const shouldHideEmptyRecordGroups = get(
          recordIndexShouldHideEmptyRecordGroupsComponentState,
          { instanceId },
        );

        if (!shouldHideEmptyRecordGroups) {
          return visibleRecordGroupIds;
        }

        return visibleRecordGroupIds.filter(
          (recordGroupId) =>
            get(recordIndexRecordIdsByGroupComponentFamilyState, {
              instanceId,
              familyKey: recordGroupId,
            }).length > 0,
        );
      },
  });
