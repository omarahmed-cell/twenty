import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { useMemo, useState } from 'react';
import { type ConditionalLogicRule, isDefined } from 'twenty-shared/utils';
import { LightIconButton, SearchInput } from 'twenty-ui/components/input';
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

import { buildConditionalLogicFields } from '@/conditional-logic/utils/buildConditionalLogicFields';
import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { usePropertySettings } from '@/properties/hooks/usePropertySettings';
import { toConditionalLogicRule } from '@/properties/utils/buildObjectPropertyLogicRules';
import { createConditionalLogicRuleDraft } from '@/settings/data-model/conditional-logic/utils/conditionalLogicRuleDraft';
import { SettingsPropertyLogicRuleModal } from '@/settings/data-model/properties/components/SettingsPropertyLogicRuleModal';
import { useSettingsPropertyActions } from '@/settings/data-model/properties/hooks/useSettingsPropertyActions';
import {
  describePropertyLogicConditions,
  describePropertyLogicDependents,
} from '@/settings/data-model/properties/utils/describePropertyLogicRule';
import { getPropertyCreatedByLabel } from '@/settings/data-model/properties/utils/getPropertyCreatedByLabel';
import { ConfirmationDialog } from '@/ui/layout/dialog/components/ConfirmationDialog';
import { useDialog } from '@/ui/layout/dialog/hooks/useDialog';
import { DropdownContent } from '@/ui/layout/dropdown/components/DropdownContent';
import { DropdownRoot } from '@/ui/layout/dropdown/components/DropdownRoot';
import { GenericDropdownContentWidth } from '@/ui/layout/dropdown/constants/GenericDropdownContentWidth';
import { Table } from '@/ui/layout/table/components/Table';
import { TableCell } from '@/ui/layout/table/components/TableCell';
import { TableHeader } from '@/ui/layout/table/components/TableHeader';
import { TableRow } from '@/ui/layout/table/components/TableRow';

const GRID_TEMPLATE_COLUMNS =
  'minmax(200px, 2fr) minmax(200px, 2fr) 110px 1fr 36px';

const DELETE_PROPERTY_LOGIC_DIALOG_ID = 'settings-delete-property-logic-dialog';

const StyledToolbar = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
  padding-bottom: ${themeCssVariables.spacing[2]};
`;

const StyledSearchContainer = styled.div`
  flex: 1;
`;

const StyledClickableCell = styled.div`
  cursor: pointer;
  min-width: 0;
`;

const StyledSecondaryText = styled.span`
  color: ${themeCssVariables.font.color.tertiary};
`;

const StyledEmptyState = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  padding: ${themeCssVariables.spacing[4]} 0;
`;

type EditedRule = {
  ruleRecordId: string | null;
  rule: ConditionalLogicRule;
};

type SettingsPropertyLogicTabProps = {
  objectMetadataItem: EnrichedObjectMetadataItem;
};

export const SettingsPropertyLogicTab = ({
  objectMetadataItem,
}: SettingsPropertyLogicTabProps) => {
  const { t } = useLingui();
  const { openDialog } = useDialog();
  const { propertySettings } = usePropertySettings();
  const { deleteRule } = useSettingsPropertyActions();

  const [searchTerm, setSearchTerm] = useState('');
  const [editedRule, setEditedRule] = useState<EditedRule | null>(null);
  const [ruleToDeleteId, setRuleToDeleteId] = useState<string | null>(null);

  const fields = useMemo(
    () => buildConditionalLogicFields(objectMetadataItem.fields),
    [objectMetadataItem.fields],
  );

  const groupNameById = new Map(
    (propertySettings?.groups ?? []).map(({ id, name }) => [id, name]),
  );

  const rows = (propertySettings?.rules ?? [])
    .filter((record) => record.objectMetadataId === objectMetadataItem.id)
    .flatMap((record) => {
      const rule = toConditionalLogicRule(record);

      if (!isDefined(rule)) {
        return [];
      }

      return [
        {
          record,
          rule,
          conditions: describePropertyLogicConditions({ rule, fields }),
          dependents: describePropertyLogicDependents({
            rule,
            fields,
            groupNameById,
          }).join(', '),
        },
      ];
    })
    .filter(({ conditions, dependents }) => {
      const normalizedSearch = searchTerm.trim().toLowerCase();

      return (
        normalizedSearch === '' ||
        conditions.toLowerCase().includes(normalizedSearch) ||
        dependents.toLowerCase().includes(normalizedSearch)
      );
    });

  const openRule = (editedRuleToOpen: EditedRule) =>
    setEditedRule(editedRuleToOpen);

  return (
    <Section.Root>
      <Section.Header
        title={t`Conditional logic`}
        description={t`Show properties only when other properties have certain values. Required properties must be filled when the rule becomes true.`}
      />
      <StyledToolbar>
        <StyledSearchContainer>
          <SearchInput
            placeholder={t`Search conditional logic...`}
            value={searchTerm}
            onValueChange={setSearchTerm}
          />
        </StyledSearchContainer>
        <Button
          variant="solid"
          color="accent"
          size="sm"
          startIcon={<IconPlus />}
          onClick={() =>
            openRule({
              ruleRecordId: null,
              rule: createConditionalLogicRuleDraft(),
            })
          }
        >
          {t`Create logic`}
        </Button>
      </StyledToolbar>
      <Table>
        <TableRow gridTemplateColumns={GRID_TEMPLATE_COLUMNS}>
          <TableHeader>{t`Controlling properties`}</TableHeader>
          <TableHeader>{t`Dependent properties`}</TableHeader>
          <TableHeader>{t`Create date`}</TableHeader>
          <TableHeader>{t`Created by`}</TableHeader>
          <TableHeader />
        </TableRow>
        {rows.length === 0 && (
          <StyledEmptyState>{t`No conditional logic yet`}</StyledEmptyState>
        )}
        {rows.map(({ record, rule, conditions, dependents }) => (
          <TableRow key={record.id} gridTemplateColumns={GRID_TEMPLATE_COLUMNS}>
            <TableCell minWidth="0">
              <StyledClickableCell
                onClick={() => openRule({ ruleRecordId: record.id, rule })}
              >
                <OverflowingTextWithTooltip text={conditions} />
              </StyledClickableCell>
            </TableCell>
            <TableCell minWidth="0">
              <StyledClickableCell
                onClick={() => openRule({ ruleRecordId: record.id, rule })}
              >
                <OverflowingTextWithTooltip text={dependents} />
              </StyledClickableCell>
            </TableCell>
            <TableCell>
              <StyledSecondaryText>
                {new Date(record.createdAt).toLocaleDateString()}
              </StyledSecondaryText>
            </TableCell>
            <TableCell minWidth="0">
              <OverflowingTextWithTooltip
                text={getPropertyCreatedByLabel(record.createdBy)}
              />
            </TableCell>
            <TableCell align="right" padding="0">
              <DropdownRoot
                type="menu"
                dropdownId={`settings-property-logic-menu-${record.id}`}
              >
                <Dropdown.Trigger
                  render={
                    <LightIconButton
                      aria-label={t`Conditional logic options`}
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
                      onClick={() =>
                        openRule({ ruleRecordId: record.id, rule })
                      }
                    >
                      {t`Edit`}
                    </Dropdown.ActionItem>
                    <Dropdown.ActionItem
                      startIcon={<IconTrash />}
                      color="danger"
                      onClick={() => {
                        setRuleToDeleteId(record.id);
                        openDialog(DELETE_PROPERTY_LOGIC_DIALOG_ID);
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
      {isDefined(editedRule) && (
        <SettingsPropertyLogicRuleModal
          key={editedRule.ruleRecordId ?? editedRule.rule.id}
          objectMetadataItem={objectMetadataItem}
          ruleRecordId={editedRule.ruleRecordId}
          initialRule={editedRule.rule}
          onClose={() => setEditedRule(null)}
        />
      )}
      <ConfirmationDialog
        dialogId={DELETE_PROPERTY_LOGIC_DIALOG_ID}
        title={t`Delete conditional logic`}
        subtitle={t`Its dependent properties will always show. Stored values are kept.`}
        onConfirmClick={async () => {
          if (isDefined(ruleToDeleteId)) {
            await deleteRule(ruleToDeleteId);
            setRuleToDeleteId(null);
          }
        }}
        confirmButtonText={t`Delete`}
        confirmButtonColor="danger"
      />
    </Section.Root>
  );
};
