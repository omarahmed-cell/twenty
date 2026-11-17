import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { useMemo, useState } from 'react';
import { isDefined } from 'twenty-shared/utils';
import { LightIconButton } from 'twenty-ui/components/input';
import { Section } from 'twenty-ui/components/layout';
import { Dropdown } from 'twenty-ui/components/navigation';
import {
  IconDotsVertical,
  IconPencil,
  IconPlus,
  IconTrash,
} from 'twenty-ui/icon';
import { Button } from 'twenty-ui/primitives/input';
import { OverflowingTextWithTooltip } from 'twenty-ui/primitives/typography';
import { themeCssVariables } from 'twenty-ui/theme';

import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { usePropertySettings } from '@/properties/hooks/usePropertySettings';
import { type PropertyGroupRecord } from '@/properties/types/PropertySettings';
import { useSettingsPropertyActions } from '@/settings/data-model/properties/hooks/useSettingsPropertyActions';
import { SettingsTextInput } from '@/ui/input/components/SettingsTextInput';
import { ConfirmationDialog } from '@/ui/layout/dialog/components/ConfirmationDialog';
import { useDialog } from '@/ui/layout/dialog/hooks/useDialog';
import { DropdownContent } from '@/ui/layout/dropdown/components/DropdownContent';
import { DropdownRoot } from '@/ui/layout/dropdown/components/DropdownRoot';
import { GenericDropdownContentWidth } from '@/ui/layout/dropdown/constants/GenericDropdownContentWidth';
import { Table } from '@/ui/layout/table/components/Table';
import { TableCell } from '@/ui/layout/table/components/TableCell';
import { TableHeader } from '@/ui/layout/table/components/TableHeader';
import { TableRow } from '@/ui/layout/table/components/TableRow';

const GRID_TEMPLATE_COLUMNS = 'minmax(200px, 1fr) 180px 36px';

const DELETE_PROPERTY_GROUP_DIALOG_ID = 'settings-delete-property-group-dialog';

const StyledToolbar = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
  justify-content: flex-end;
  padding-bottom: ${themeCssVariables.spacing[2]};
`;

const StyledNameInput = styled.div`
  flex: 1;
`;

const StyledClickableCell = styled.div`
  cursor: pointer;
  min-width: 0;
`;

const StyledEmptyState = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  padding: ${themeCssVariables.spacing[4]} 0;
`;

type SettingsPropertyGroupsTabProps = {
  objectMetadataItem: EnrichedObjectMetadataItem;
  highlightedGroupId: string | null;
  onOpenGroup: (propertyGroupId: string) => void;
};

export const SettingsPropertyGroupsTab = ({
  objectMetadataItem,
  highlightedGroupId,
  onOpenGroup,
}: SettingsPropertyGroupsTabProps) => {
  const { t } = useLingui();
  const { openDialog } = useDialog();
  const { propertySettings } = usePropertySettings();
  const { createGroup, renameGroup, deleteGroup } =
    useSettingsPropertyActions();

  const [newGroupName, setNewGroupName] = useState<string | null>(null);
  const [renamingGroupId, setRenamingGroupId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState('');
  const [groupToDelete, setGroupToDelete] =
    useState<PropertyGroupRecord | null>(null);

  const fieldIds = useMemo(
    () => new Set(objectMetadataItem.fields.map(({ id }) => id)),
    [objectMetadataItem.fields],
  );

  const groups = (propertySettings?.groups ?? [])
    .filter((group) => group.objectMetadataId === objectMetadataItem.id)
    .sort((left, right) => left.position - right.position);

  const countProperties = (propertyGroupId: string) =>
    (propertySettings?.memberships ?? []).filter(
      (membership) =>
        membership.propertyGroupId === propertyGroupId &&
        fieldIds.has(membership.fieldMetadataId),
    ).length;

  const handleCreate = async () => {
    const name = newGroupName?.trim() ?? '';

    if (name === '') {
      return;
    }

    if (await createGroup(objectMetadataItem.id, name)) {
      setNewGroupName(null);
    }
  };

  const handleRename = async (propertyGroupId: string) => {
    const name = renameDraft.trim();

    if (name !== '' && (await renameGroup(propertyGroupId, name))) {
      setRenamingGroupId(null);
    }
  };

  const groupToDeleteName = groupToDelete?.name ?? '';

  return (
    <Section.Root>
      <Section.Header
        title={t`Groups`}
        description={t`Group properties to show them together. A property belongs to one group at most.`}
      />
      <StyledToolbar>
        {isDefined(newGroupName) ? (
          <>
            <StyledNameInput>
              <SettingsTextInput
                instanceId="settings-new-property-group-name"
                placeholder={t`Group name`}
                value={newGroupName}
                onChange={setNewGroupName}
                onInputEnter={handleCreate}
                autoFocusOnMount
                fullWidth
              />
            </StyledNameInput>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setNewGroupName(null)}
            >
              {t`Cancel`}
            </Button>
            <Button
              variant="solid"
              color="accent"
              size="sm"
              disabled={newGroupName.trim() === ''}
              onClick={handleCreate}
            >
              {t`Save`}
            </Button>
          </>
        ) : (
          <Button
            variant="solid"
            color="accent"
            size="sm"
            startIcon={<IconPlus />}
            onClick={() => setNewGroupName('')}
          >
            {t`Create group`}
          </Button>
        )}
      </StyledToolbar>
      <Table>
        <TableRow gridTemplateColumns={GRID_TEMPLATE_COLUMNS}>
          <TableHeader>{t`Name`}</TableHeader>
          <TableHeader align="right">{t`Number of properties`}</TableHeader>
          <TableHeader />
        </TableRow>
        {groups.length === 0 && (
          <StyledEmptyState>{t`No groups yet`}</StyledEmptyState>
        )}
        {groups.map((group) => (
          <TableRow
            key={group.id}
            gridTemplateColumns={GRID_TEMPLATE_COLUMNS}
            isSelected={group.id === highlightedGroupId}
          >
            <TableCell minWidth="0">
              {renamingGroupId === group.id ? (
                <SettingsTextInput
                  instanceId={`settings-rename-property-group-${group.id}`}
                  value={renameDraft}
                  onChange={setRenameDraft}
                  onInputEnter={() => handleRename(group.id)}
                  onBlur={() => handleRename(group.id)}
                  autoFocusOnMount
                  autoSelectOnMount
                  fullWidth
                />
              ) : (
                <StyledClickableCell onClick={() => onOpenGroup(group.id)}>
                  <OverflowingTextWithTooltip text={group.name} />
                </StyledClickableCell>
              )}
            </TableCell>
            <TableCell align="right">{countProperties(group.id)}</TableCell>
            <TableCell align="right" padding="0">
              <DropdownRoot
                type="menu"
                dropdownId={`settings-property-group-menu-${group.id}`}
              >
                <Dropdown.Trigger
                  render={
                    <LightIconButton
                      aria-label={t`Group options`}
                      emphasis="subtle"
                    >
                      <IconDotsVertical />
                    </LightIconButton>
                  }
                />
                <DropdownContent
                  align="end"
                  width={GenericDropdownContentWidth.Medium}
                >
                  <Dropdown.Section>
                    <Dropdown.ActionItem
                      startIcon={<IconPencil />}
                      onClick={() => {
                        setRenameDraft(group.name);
                        setRenamingGroupId(group.id);
                      }}
                    >
                      {t`Rename`}
                    </Dropdown.ActionItem>
                    <Dropdown.ActionItem
                      startIcon={<IconTrash />}
                      color="danger"
                      onClick={() => {
                        setGroupToDelete(group);
                        openDialog(DELETE_PROPERTY_GROUP_DIALOG_ID);
                      }}
                    >
                      {t`Delete`}
                    </Dropdown.ActionItem>
                  </Dropdown.Section>
                </DropdownContent>
              </DropdownRoot>
            </TableCell>
          </TableRow>
        ))}
      </Table>
      <ConfirmationDialog
        dialogId={DELETE_PROPERTY_GROUP_DIALOG_ID}
        title={t`Delete group`}
        subtitle={t`Delete "${groupToDeleteName}"? Its properties are kept and move to No group.`}
        onConfirmClick={async () => {
          if (isDefined(groupToDelete)) {
            await deleteGroup(groupToDelete.id);
            setGroupToDelete(null);
          }
        }}
        confirmButtonText={t`Delete`}
        confirmButtonColor="danger"
      />
    </Section.Root>
  );
};
