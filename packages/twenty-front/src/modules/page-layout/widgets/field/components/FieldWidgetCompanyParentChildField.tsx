import { getToastOptionsFromError } from '@/error-handler/utils/getToastOptionsFromError';
import { useObjectMetadataItem } from '@/object-metadata/hooks/useObjectMetadataItem';
import { RecordChip } from '@/object-record/components/RecordChip';
import { useLazyFindOneRecord } from '@/object-record/hooks/useLazyFindOneRecord';
import { useUpdateOneRecord } from '@/object-record/hooks/useUpdateOneRecord';
import { useIsRecordFieldReadOnly } from '@/object-record/read-only/hooks/useIsRecordFieldReadOnly';
import { SingleRecordPickerMenuItemsWithSearch } from '@/object-record/record-picker/single-record-picker/components/SingleRecordPickerMenuItemsWithSearch';
import { SingleRecordPickerComponentInstanceContext } from '@/object-record/record-picker/single-record-picker/states/contexts/SingleRecordPickerComponentInstanceContext';
import { singleRecordPickerSearchFilterComponentState } from '@/object-record/record-picker/single-record-picker/states/singleRecordPickerSearchFilterComponentState';
import { type RecordPickerPickableMorphItem } from '@/object-record/record-picker/types/RecordPickerPickableMorphItem';
import { recordStoreFamilySelector } from '@/object-record/record-store/states/selectors/recordStoreFamilySelector';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { useIsPageLayoutInEditMode } from '@/page-layout/hooks/useIsPageLayoutInEditMode';
import { type CompanyParentChildLabel } from '@/page-layout/widgets/field/types/CompanyParentChildLabel';
import { getCompanyParentChildUpdate } from '@/page-layout/widgets/field/utils/getCompanyParentChildUpdate';
import { ConfirmationDialog } from '@/ui/layout/dialog/components/ConfirmationDialog';
import { useDialog } from '@/ui/layout/dialog/hooks/useDialog';
import { Dropdown } from '@/ui/layout/dropdown/components/Dropdown';
import { DropdownMenuHeader } from '@/ui/layout/dropdown/components/DropdownMenuHeader/DropdownMenuHeader';
import { DropdownMenuHeaderLeftComponent } from '@/ui/layout/dropdown/components/DropdownMenuHeader/internal/DropdownMenuHeaderLeftComponent';
import { DropdownMenuItemsContainer } from '@/ui/layout/dropdown/components/DropdownMenuItemsContainer';
import { LegacyDropdownContent } from '@/ui/layout/dropdown/components/LegacyDropdownContent';
import { useCloseDropdown } from '@/ui/layout/dropdown/hooks/useCloseDropdown';
import { SidePanelProvider } from '@/ui/layout/side-panel/contexts/SidePanelContext';
import { useAtomFamilySelectorValue } from '@/ui/utilities/state/jotai/hooks/useAtomFamilySelectorValue';
import { useSetAtomComponentState } from '@/ui/utilities/state/jotai/hooks/useSetAtomComponentState';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { useStore } from 'jotai';
import { useState } from 'react';
import { CoreObjectNameSingular } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';
import { useToast } from 'twenty-ui/components/feedback';
import { IconButton, LightButton } from 'twenty-ui/components/input';
import { MenuItem } from 'twenty-ui/components/navigation';
import { IconChevronLeft, IconPlus, IconUnlink } from 'twenty-ui/icon';
import { themeCssVariables } from 'twenty-ui/theme';

const StyledContainer = styled.div`
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
  padding: ${themeCssVariables.spacing[1]};
  width: 100%;
`;

const StyledSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[1]};
`;

const StyledSectionLabel = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.medium};
`;

const StyledRow = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[1]};
  min-width: 0;
`;

type ParentUpdate = {
  companyIdToUpdate: string;
  newParentCompanyId: string;
  isChildOfCurrentCompany: boolean;
  pickedCompany: ObjectRecord;
};

type PendingParentUpdate = {
  parentUpdate: ParentUpdate;
  confirmationMessage: string;
};

type FieldWidgetCompanyParentChildFieldProps = {
  recordId: string;
  fieldMetadataId: string;
  instanceId: string;
  isInSidePanel: boolean;
};

export const FieldWidgetCompanyParentChildField = ({
  recordId,
  fieldMetadataId,
  instanceId,
  isInSidePanel,
}: FieldWidgetCompanyParentChildFieldProps) => {
  const { t } = useLingui();
  const store = useStore();
  const { enqueueToast } = useToast();
  const { updateOneRecord } = useUpdateOneRecord();
  const { closeDropdown } = useCloseDropdown();
  const { openDialog } = useDialog();
  const isPageLayoutInEditMode = useIsPageLayoutInEditMode();

  const dropdownId = `${instanceId}-add-company`;
  const confirmationDialogId = `${instanceId}-replace-parent-company`;

  const { objectMetadataItem } = useObjectMetadataItem({
    objectNameSingular: CoreObjectNameSingular.Company,
  });

  const parentCompanyFieldMetadataId =
    objectMetadataItem.fields.find((field) => field.name === 'parentCompany')
      ?.id ?? '';

  const isChildCompaniesFieldReadOnly = useIsRecordFieldReadOnly({
    recordId,
    fieldMetadataId,
    objectMetadataId: objectMetadataItem.id,
  });

  const isParentCompanyFieldReadOnly = useIsRecordFieldReadOnly({
    recordId,
    fieldMetadataId: parentCompanyFieldMetadataId,
    objectMetadataId: objectMetadataItem.id,
  });

  const isEditable =
    !isPageLayoutInEditMode &&
    !isChildCompaniesFieldReadOnly &&
    !isParentCompanyFieldReadOnly;

  const currentCompanyName = useAtomFamilySelectorValue(
    recordStoreFamilySelector,
    { recordId, fieldName: 'name' },
  ) as string | null | undefined;

  const parentCompany = useAtomFamilySelectorValue(recordStoreFamilySelector, {
    recordId,
    fieldName: 'parentCompany',
  }) as ObjectRecord | null | undefined;

  const childCompaniesValue = useAtomFamilySelectorValue(
    recordStoreFamilySelector,
    { recordId, fieldName: 'childCompanies' },
  );

  const childCompanies = Array.isArray(childCompaniesValue)
    ? (childCompaniesValue as ObjectRecord[])
    : [];

  const [pickedCompany, setPickedCompany] = useState<ObjectRecord | null>(null);
  const [pendingParentUpdate, setPendingParentUpdate] =
    useState<PendingParentUpdate | null>(null);

  const setSingleRecordPickerSearchFilter = useSetAtomComponentState(
    singleRecordPickerSearchFilterComponentState,
    dropdownId,
  );

  const { findOneRecord: findOneCompany } = useLazyFindOneRecord({
    objectNameSingular: CoreObjectNameSingular.Company,
    fetchPolicy: 'network-only',
  });

  const childCompaniesSelector = recordStoreFamilySelector.selectorFamily({
    recordId,
    fieldName: 'childCompanies',
  });

  // The write lands on the child, so the mutation response does not refresh this company's list
  const syncChildCompaniesInStore = ({
    childCompany,
    isChildOfCurrentCompany,
  }: {
    childCompany: ObjectRecord;
    isChildOfCurrentCompany: boolean;
  }) => {
    const storedChildCompanies = store.get(childCompaniesSelector);
    const otherChildCompanies = (
      Array.isArray(storedChildCompanies) ? storedChildCompanies : []
    ).filter(
      (storedChildCompany: ObjectRecord) =>
        storedChildCompany.id !== childCompany.id,
    );

    store.set(
      childCompaniesSelector,
      isChildOfCurrentCompany
        ? [...otherChildCompanies, childCompany]
        : otherChildCompanies,
    );
  };

  const updateParentCompany = async ({
    companyIdToUpdate,
    newParentCompanyId,
  }: {
    companyIdToUpdate: string;
    newParentCompanyId: string | null;
  }) => {
    try {
      await updateOneRecord({
        objectNameSingular: CoreObjectNameSingular.Company,
        idToUpdate: companyIdToUpdate,
        updateOneRecordInput: { parentCompanyId: newParentCompanyId },
      });

      return true;
    } catch (error) {
      enqueueToast(getToastOptionsFromError({ error }));

      return false;
    }
  };

  const applyParentUpdate = async ({
    companyIdToUpdate,
    newParentCompanyId,
    isChildOfCurrentCompany,
    pickedCompany,
  }: ParentUpdate) => {
    const isUpdated = await updateParentCompany({
      companyIdToUpdate,
      newParentCompanyId,
    });

    if (isUpdated && isChildOfCurrentCompany) {
      syncChildCompaniesInStore({
        childCompany: pickedCompany,
        isChildOfCurrentCompany: true,
      });
    }
  };

  const handleDetachParentCompany = async () => {
    await updateParentCompany({
      companyIdToUpdate: recordId,
      newParentCompanyId: null,
    });
  };

  const handleDetachChildCompany = async (childCompany: ObjectRecord) => {
    const isUpdated = await updateParentCompany({
      companyIdToUpdate: childCompany.id,
      newParentCompanyId: null,
    });

    if (isUpdated) {
      syncChildCompaniesInStore({
        childCompany,
        isChildOfCurrentCompany: false,
      });
    }
  };

  const resetDropdown = () => {
    setSingleRecordPickerSearchFilter('');
    setPickedCompany(null);
  };

  const handleCompanySelected = async (
    selectedMorphItem?: RecordPickerPickableMorphItem,
  ) => {
    setSingleRecordPickerSearchFilter('');

    if (!isDefined(selectedMorphItem?.recordId)) {
      return;
    }

    try {
      await findOneCompany({
        objectRecordId: selectedMorphItem.recordId,
        onCompleted: setPickedCompany,
      });
    } catch (error) {
      closeDropdown(dropdownId);
      enqueueToast(getToastOptionsFromError({ error }));
    }
  };

  const handleLabelSelected = async (label: CompanyParentChildLabel) => {
    closeDropdown(dropdownId);

    if (!isDefined(pickedCompany)) {
      return;
    }

    const { companyToUpdate, newParentCompanyId, replacedParentCompany } =
      getCompanyParentChildUpdate({
        currentCompany: {
          id: recordId,
          name: currentCompanyName,
          parentCompany,
        },
        pickedCompany,
        label,
      });

    const parentUpdate: ParentUpdate = {
      companyIdToUpdate: companyToUpdate.id,
      newParentCompanyId,
      isChildOfCurrentCompany: label === 'child',
      pickedCompany,
    };

    if (!isDefined(replacedParentCompany)) {
      await applyParentUpdate(parentUpdate);
      return;
    }

    const companyName = companyToUpdate.name ?? '';
    const parentName = replacedParentCompany.name ?? '';

    setPendingParentUpdate({
      parentUpdate,
      confirmationMessage: t`${companyName} already has parent ${parentName}. Replace?`,
    });
    openDialog(confirmationDialogId);
  };

  const handleConfirmReplaceParent = async () => {
    if (!isDefined(pendingParentUpdate)) {
      return;
    }

    setPendingParentUpdate(null);
    await applyParentUpdate(pendingParentUpdate.parentUpdate);
  };

  const hasParentCompany = isDefined(parentCompany);
  const hasChildCompanies = childCompanies.length > 0;

  if (!isEditable && !hasParentCompany && !hasChildCompanies) {
    return null;
  }

  return (
    <SidePanelProvider value={{ isInSidePanel }}>
      <StyledContainer>
        {hasParentCompany && (
          <StyledSection>
            <StyledSectionLabel>{t`Parent company`}</StyledSectionLabel>
            <StyledRow>
              <RecordChip
                objectNameSingular={CoreObjectNameSingular.Company}
                record={parentCompany}
              />
              {isEditable && (
                <IconButton
                  variant="ghost"
                  size="sm"
                  aria-label={t`Detach`}
                  onClick={handleDetachParentCompany}
                >
                  <IconUnlink />
                </IconButton>
              )}
            </StyledRow>
          </StyledSection>
        )}
        {hasChildCompanies && (
          <StyledSection>
            <StyledSectionLabel>{t`Child companies`}</StyledSectionLabel>
            {childCompanies.map((childCompany) => (
              <StyledRow key={childCompany.id}>
                <RecordChip
                  objectNameSingular={CoreObjectNameSingular.Company}
                  record={childCompany}
                />
                {isEditable && (
                  <IconButton
                    variant="ghost"
                    size="sm"
                    aria-label={t`Detach`}
                    onClick={() => handleDetachChildCompany(childCompany)}
                  >
                    <IconUnlink />
                  </IconButton>
                )}
              </StyledRow>
            ))}
          </StyledSection>
        )}
        {isEditable && (
          <StyledRow>
            <Dropdown
              dropdownId={dropdownId}
              dropdownPlacement="bottom-start"
              onClose={resetDropdown}
              clickableComponent={
                <LightButton emphasis="subtle" startIcon={<IconPlus />}>
                  {t`Add company`}
                </LightButton>
              }
              dropdownComponents={
                <SingleRecordPickerComponentInstanceContext.Provider
                  value={{ instanceId: dropdownId }}
                >
                  <LegacyDropdownContent>
                    {isDefined(pickedCompany) ? (
                      <>
                        <DropdownMenuHeader
                          StartComponent={
                            <DropdownMenuHeaderLeftComponent
                              onClick={() => setPickedCompany(null)}
                              Icon={IconChevronLeft}
                            />
                          }
                        >
                          {pickedCompany.name}
                        </DropdownMenuHeader>
                        <DropdownMenuItemsContainer>
                          <MenuItem
                            text={t`Parent`}
                            onClick={() => handleLabelSelected('parent')}
                          />
                          <MenuItem
                            text={t`Child`}
                            onClick={() => handleLabelSelected('child')}
                          />
                        </DropdownMenuItemsContainer>
                      </>
                    ) : (
                      <SingleRecordPickerMenuItemsWithSearch
                        focusId={dropdownId}
                        onCancel={() => closeDropdown(dropdownId)}
                        onMorphItemSelected={handleCompanySelected}
                        objectNameSingulars={[CoreObjectNameSingular.Company]}
                        excludedRecordIds={[recordId]}
                      />
                    )}
                  </LegacyDropdownContent>
                </SingleRecordPickerComponentInstanceContext.Provider>
              }
            />
          </StyledRow>
        )}
      </StyledContainer>
      <ConfirmationDialog
        dialogId={confirmationDialogId}
        title={t`Replace parent company`}
        subtitle={pendingParentUpdate?.confirmationMessage ?? ''}
        onConfirmClick={handleConfirmReplaceParent}
        onClose={() => setPendingParentUpdate(null)}
        confirmButtonText={t`Replace`}
      />
    </SidePanelProvider>
  );
};
