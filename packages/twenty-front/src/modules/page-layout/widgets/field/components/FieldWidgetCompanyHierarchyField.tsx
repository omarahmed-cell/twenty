import { RecordChip } from '@/object-record/components/RecordChip';
import { recordStoreFamilySelector } from '@/object-record/record-store/states/selectors/recordStoreFamilySelector';
import { getCompanyHierarchyRelatedRecords } from '@/page-layout/widgets/field/utils/getCompanyHierarchyRelatedRecords';
import { SidePanelProvider } from '@/ui/layout/side-panel/contexts/SidePanelContext';
import { useAtomFamilySelectorValue } from '@/ui/utilities/state/jotai/hooks/useAtomFamilySelectorValue';
import { styled } from '@linaria/react';
import { t } from '@lingui/core/macro';
import { CoreObjectNameSingular } from 'twenty-shared/types';
import { Tag } from 'twenty-ui/primitives/data-display';
import { themeCssVariables } from 'twenty-ui/theme';

const StyledContainer = styled.div`
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[1]};
  padding: ${themeCssVariables.spacing[1]};
  width: 100%;
`;

const StyledRow = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
  min-width: 0;
`;

type FieldWidgetCompanyHierarchyFieldProps = {
  recordId: string;
  isInSidePanel: boolean;
};

export const FieldWidgetCompanyHierarchyField = ({
  recordId,
  isInSidePanel,
}: FieldWidgetCompanyHierarchyFieldProps) => {
  const parentCompany = useAtomFamilySelectorValue(recordStoreFamilySelector, {
    recordId,
    fieldName: 'parentCompany',
  });

  const childCompanies = useAtomFamilySelectorValue(recordStoreFamilySelector, {
    recordId,
    fieldName: 'childCompanies',
  });

  const relatedCompanies = getCompanyHierarchyRelatedRecords({
    parentCompany,
    childCompanies,
  });

  if (relatedCompanies.length === 0) {
    return null;
  }

  return (
    <SidePanelProvider value={{ isInSidePanel }}>
      <StyledContainer>
        {relatedCompanies.map(({ record, hierarchyRole }) => (
          <StyledRow key={record.id}>
            <RecordChip
              objectNameSingular={CoreObjectNameSingular.Company}
              record={record}
            />
            {hierarchyRole === 'parent' ? (
              <Tag color="blue">{t`Parent`}</Tag>
            ) : (
              <Tag color="gray">{t`Child`}</Tag>
            )}
          </StyledRow>
        ))}
      </StyledContainer>
    </SidePanelProvider>
  );
};
