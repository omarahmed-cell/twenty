import { anyFieldFilterValueComponentState } from '@/object-record/record-filter/states/anyFieldFilterValueComponentState';
import { useRecordIndexContextOrThrow } from '@/object-record/record-index/contexts/RecordIndexContext';
import { usePushFocusItemToFocusStack } from '@/ui/utilities/focus/hooks/usePushFocusItemToFocusStack';
import { useRemoveFocusItemFromFocusStackById } from '@/ui/utilities/focus/hooks/useRemoveFocusItemFromFocusStackById';
import { useRemoveFocusItemFromFocusStackOnUnmount } from '@/ui/utilities/focus/hooks/useRemoveFocusItemFromFocusStackOnUnmount';
import { FocusComponentType } from '@/ui/utilities/focus/types/FocusComponentType';
import { useAtomComponentState } from '@/ui/utilities/state/jotai/hooks/useAtomComponentState';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { isNonEmptyString } from '@sniptt/guards';
import { useId } from 'react';
import { LightIconButton, SearchInput } from 'twenty-ui/components/input';
import { IconX } from 'twenty-ui/icon';

const StyledContainer = styled.div`
  width: 240px;
`;

export const RecordIndexSearchInput = () => {
  const { t } = useLingui();
  const { objectMetadataItem } = useRecordIndexContextOrThrow();

  const [anyFieldFilterValue, setAnyFieldFilterValue] = useAtomComponentState(
    anyFieldFilterValueComponentState,
  );

  const instanceId = useId();
  const focusId = `record-index-search-input-${instanceId}`;
  const { pushFocusItemToFocusStack } = usePushFocusItemToFocusStack();
  const { removeFocusItemFromFocusStackById } =
    useRemoveFocusItemFromFocusStackById();

  useRemoveFocusItemFromFocusStackOnUnmount({ focusId, isEnabled: true });

  const handleFocus = () => {
    pushFocusItemToFocusStack({
      focusId,
      component: {
        type: FocusComponentType.TEXT_INPUT,
        instanceId: focusId,
      },
      globalHotkeysConfig: {
        enableGlobalHotkeysConflictingWithKeyboard: false,
      },
    });
  };

  const handleBlur = () => {
    removeFocusItemFromFocusStackById({ focusId });
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAnyFieldFilterValue(event.target.value);
  };

  const objectLabelPlural = objectMetadataItem.labelPlural;

  return (
    <StyledContainer>
      <SearchInput
        size="sm"
        type="text"
        value={anyFieldFilterValue}
        placeholder={t`Search ${objectLabelPlural}`}
        onChange={handleSearchChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        actions={
          isNonEmptyString(anyFieldFilterValue) && (
            <LightIconButton
              emphasis="subtle"
              size="sm"
              aria-label={t`Clear search`}
              onClick={() => setAnyFieldFilterValue('')}
            >
              <IconX />
            </LightIconButton>
          )
        }
      />
    </StyledContainer>
  );
};
