import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { useGetInitialFilterValue } from '@/object-record/object-filter-dropdown/hooks/useGetInitialFilterValue';
import { useUpsertObjectFilterDropdownCurrentFilter } from '@/object-record/object-filter-dropdown/hooks/useUpsertObjectFilterDropdownCurrentFilter';
import { fieldMetadataItemIdUsedInDropdownComponentState } from '@/object-record/object-filter-dropdown/states/fieldMetadataItemIdUsedInDropdownComponentState';
import { objectFilterDropdownCurrentRecordFilterComponentState } from '@/object-record/object-filter-dropdown/states/objectFilterDropdownCurrentRecordFilterComponentState';
import { objectFilterDropdownFilterIsSelectedComponentState } from '@/object-record/object-filter-dropdown/states/objectFilterDropdownFilterIsSelectedComponentState';
import { objectFilterDropdownSearchInputComponentState } from '@/object-record/object-filter-dropdown/states/objectFilterDropdownSearchInputComponentState';
import { objectFilterDropdownIsSelectingSubFieldComponentState } from '@/object-record/object-filter-dropdown/states/objectFilterDropdownIsSelectingSubFieldComponentState';
import { selectedOperandInDropdownComponentState } from '@/object-record/object-filter-dropdown/states/selectedOperandInDropdownComponentState';
import { subFieldNameUsedInDropdownComponentState } from '@/object-record/object-filter-dropdown/states/subFieldNameUsedInDropdownComponentState';
import { isFilterOnActorWorkspaceMemberSubField } from '@/object-record/object-filter-dropdown/utils/isFilterOnActorWorkspaceMemberSubField';
import { currentRecordFiltersComponentState } from '@/object-record/record-filter/states/currentRecordFiltersComponentState';
import { type RecordFilter } from '@/object-record/record-filter/types/RecordFilter';
import { findDuplicateRecordFilterInNonAdvancedRecordFilters } from '@/object-record/record-filter/utils/findDuplicateRecordFilterInNonAdvancedRecordFilters';

import { getRecordFilterOperands } from '@/object-record/record-filter/utils/getRecordFilterOperands';
import { type CompositeFieldSubFieldName } from '@/settings/data-model/types/CompositeFieldSubFieldName';
import { usePushFocusItemToFocusStack } from '@/ui/utilities/focus/hooks/usePushFocusItemToFocusStack';
import { FocusComponentType } from '@/ui/utilities/focus/types/FocusComponentType';
import { useAtomComponentStateCallbackState } from '@/ui/utilities/state/jotai/hooks/useAtomComponentStateCallbackState';
import { ObjectFilterDropdownComponentInstanceContext } from '@/object-record/object-filter-dropdown/states/contexts/ObjectFilterDropdownComponentInstanceContext';
import { useAvailableComponentInstanceIdOrThrow } from '@/ui/utilities/state/component-state/hooks/useAvailableComponentInstanceIdOrThrow';

import { useStore } from 'jotai';
import { useCallback } from 'react';
import { getFilterTypeFromFieldType, isDefined } from 'twenty-shared/utils';
import { v4 } from 'uuid';

export const useInitializeFilterOnFieldMetadataItemFromViewBarFilterDropdown =
  () => {
    const selectedOperandInDropdownCallbackState =
      useAtomComponentStateCallbackState(
        selectedOperandInDropdownComponentState,
      );

    const currentRecordFiltersCallbackState =
      useAtomComponentStateCallbackState(currentRecordFiltersComponentState);

    const objectFilterDropdownCurrentRecordFilterCallbackState =
      useAtomComponentStateCallbackState(
        objectFilterDropdownCurrentRecordFilterComponentState,
      );

    const fieldMetadataItemUsedInDropdownCallbackState =
      useAtomComponentStateCallbackState(
        fieldMetadataItemIdUsedInDropdownComponentState,
      );

    const objectFilterDropdownFilterIsSelectedCallbackState =
      useAtomComponentStateCallbackState(
        objectFilterDropdownFilterIsSelectedComponentState,
      );

    const objectFilterDropdownSearchInputCallbackState =
      useAtomComponentStateCallbackState(
        objectFilterDropdownSearchInputComponentState,
      );

    const subFieldNameUsedInDropdownCallbackState =
      useAtomComponentStateCallbackState(
        subFieldNameUsedInDropdownComponentState,
      );

    const objectFilterDropdownIsSelectingSubFieldCallbackState =
      useAtomComponentStateCallbackState(
        objectFilterDropdownIsSelectingSubFieldComponentState,
      );

    const { upsertObjectFilterDropdownCurrentFilter } =
      useUpsertObjectFilterDropdownCurrentFilter();

    const { pushFocusItemToFocusStack } = usePushFocusItemToFocusStack();
    const filterDropdownId = useAvailableComponentInstanceIdOrThrow(
      ObjectFilterDropdownComponentInstanceContext,
    );
    const { getInitialFilterValue } = useGetInitialFilterValue();

    const store = useStore();

    const initializeFilterOnFieldMetataItemFromViewBarFilterDropdown =
      useCallback(
        (
          fieldMetadataItem: FieldMetadataItem,
          subFieldName?: CompositeFieldSubFieldName | null,
        ) => {
          store.set(
            fieldMetadataItemUsedInDropdownCallbackState,
            fieldMetadataItem.id,
          );

          store.set(subFieldNameUsedInDropdownCallbackState, subFieldName);
          store.set(
            objectFilterDropdownIsSelectingSubFieldCallbackState,
            false,
          );

          const currentRecordFilters = store.get(
            currentRecordFiltersCallbackState,
          );

          const filterType = getFilterTypeFromFieldType(fieldMetadataItem.type);

          const isActorWorkspaceMemberFilter =
            filterType === 'ACTOR' &&
            isFilterOnActorWorkspaceMemberSubField(subFieldName);

          if (
            filterType === 'RELATION' ||
            filterType === 'SELECT' ||
            isActorWorkspaceMemberFilter
          ) {
            pushFocusItemToFocusStack({
              focusId: filterDropdownId,
              component: {
                type: FocusComponentType.DROPDOWN,
                instanceId: fieldMetadataItem.id,
              },
              globalHotkeysConfig: {
                enableGlobalHotkeysConflictingWithKeyboard: false,
              },
            });
          }

          store.set(objectFilterDropdownFilterIsSelectedCallbackState, true);

          store.set(objectFilterDropdownSearchInputCallbackState, '');

          const defaultOperand = getRecordFilterOperands({
            filterType,
            subFieldName,
          })[0];

          const duplicateFilterInCurrentRecordFilters =
            findDuplicateRecordFilterInNonAdvancedRecordFilters({
              recordFilters: currentRecordFilters,
              fieldMetadataItemId: fieldMetadataItem.id,
              subFieldName,
            });

          const filterIsAlreadyInCurrentRecordFilters = isDefined(
            duplicateFilterInCurrentRecordFilters,
          );

          if (filterIsAlreadyInCurrentRecordFilters) {
            store.set(
              objectFilterDropdownCurrentRecordFilterCallbackState,
              duplicateFilterInCurrentRecordFilters,
            );

            store.set(
              selectedOperandInDropdownCallbackState,
              duplicateFilterInCurrentRecordFilters.operand,
            );
          } else {
            store.set(selectedOperandInDropdownCallbackState, defaultOperand);

            if (filterType === 'DATE' || filterType === 'DATE_TIME') {
              const { displayValue, value } = getInitialFilterValue(
                filterType,
                defaultOperand,
              );

              const initialDateRecordFilter: RecordFilter = {
                id: v4(),
                fieldMetadataId: fieldMetadataItem.id,
                operand: defaultOperand,
                displayValue,
                label: fieldMetadataItem.label,
                type: filterType,
                value,
              };

              upsertObjectFilterDropdownCurrentFilter(initialDateRecordFilter);

              store.set(
                objectFilterDropdownCurrentRecordFilterCallbackState,
                initialDateRecordFilter,
              );
            }
          }
        },
        [
          store,
          filterDropdownId,
          fieldMetadataItemUsedInDropdownCallbackState,
          subFieldNameUsedInDropdownCallbackState,
          objectFilterDropdownIsSelectingSubFieldCallbackState,
          currentRecordFiltersCallbackState,
          objectFilterDropdownFilterIsSelectedCallbackState,
          objectFilterDropdownSearchInputCallbackState,
          pushFocusItemToFocusStack,
          objectFilterDropdownCurrentRecordFilterCallbackState,
          selectedOperandInDropdownCallbackState,
          upsertObjectFilterDropdownCurrentFilter,
          getInitialFilterValue,
        ],
      );

    return {
      initializeFilterOnFieldMetataItemFromViewBarFilterDropdown,
    };
  };
