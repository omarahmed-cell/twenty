import { anyFieldFilterValueComponentState } from '@/object-record/record-filter/states/anyFieldFilterValueComponentState';
import { useRecordIndexContextOrThrow } from '@/object-record/record-index/contexts/RecordIndexContext';
import { useAtomComponentState } from '@/ui/utilities/state/jotai/hooks/useAtomComponentState';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { isNonEmptyString } from '@sniptt/guards';
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
