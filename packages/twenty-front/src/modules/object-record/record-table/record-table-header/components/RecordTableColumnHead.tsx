import { styled } from '@linaria/react';
import { FieldDescriptionTooltip } from '@/object-record/record-field/ui/components/FieldDescriptionTooltip';

import { fieldMetadataItemByIdSelector } from '@/object-metadata/states/fieldMetadataItemByIdSelector';
import { type RecordField } from '@/object-record/record-field/types/RecordField';
import { RECORD_TABLE_CELL_CONTENT_CLASS_NAME } from '@/object-record/record-table/constants/RecordTableCellContentClassName';
import { useAtomFamilySelectorValue } from '@/ui/utilities/state/jotai/hooks/useAtomFamilySelectorValue';
import { IconArrowDown, IconArrowUp, useIcons } from 'twenty-ui/icon';
import { ViewSortDirection } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';
import { currentRecordSortsComponentState } from '@/object-record/record-sort/states/currentRecordSortsComponentState';
import { useAtomComponentStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomComponentStateValue';
import { useTheme, themeCssVariables } from 'twenty-ui/theme';

const StyledTitle = styled.div`
  align-items: center;
  display: flex;
  flex-direction: row;
  font-weight: ${themeCssVariables.font.weight.medium};
  gap: ${themeCssVariables.spacing[1]};
  height: ${themeCssVariables.spacing[8]};
  padding-left: ${themeCssVariables.spacing[2]};
  padding-right: ${themeCssVariables.spacing[2]};
`;

const StyledIcon = styled.div`
  display: flex;
  flex-shrink: 0;
`;

const StyledSortIcon = styled.div`
  color: ${themeCssVariables.accent.accent9};
  display: flex;
  flex-shrink: 0;
`;

type RecordTableColumnHeadProps = {
  recordField: RecordField;
};

export const RecordTableColumnHead = ({
  recordField,
}: RecordTableColumnHeadProps) => {
  const theme = useTheme();

  const correspondingFieldMetadataItem = useAtomFamilySelectorValue(
    fieldMetadataItemByIdSelector,
    { fieldMetadataItemId: recordField.fieldMetadataItemId },
  );

  const { getIcon } = useIcons();
  const Icon = getIcon(
    correspondingFieldMetadataItem.foundFieldMetadataItem?.icon,
  );
  const fieldMetadataItem =
    correspondingFieldMetadataItem.foundFieldMetadataItem;

  const currentRecordSorts = useAtomComponentStateValue(
    currentRecordSortsComponentState,
  );
  const sortDirection = currentRecordSorts.find(
    (recordSort) =>
      recordSort.fieldMetadataId === recordField.fieldMetadataItemId,
  )?.direction;

  return (
    <StyledTitle className={RECORD_TABLE_CELL_CONTENT_CLASS_NAME}>
      <StyledIcon>
        <Icon size={theme.icon.size.md} />
      </StyledIcon>
      <FieldDescriptionTooltip
        label={fieldMetadataItem?.label}
        description={fieldMetadataItem?.description}
      />
      {isDefined(sortDirection) && (
        <StyledSortIcon>
          {sortDirection === ViewSortDirection.ASC ? (
            <IconArrowUp size={theme.icon.size.sm} />
          ) : (
            <IconArrowDown size={theme.icon.size.sm} />
          )}
        </StyledSortIcon>
      )}
    </StyledTitle>
  );
};
