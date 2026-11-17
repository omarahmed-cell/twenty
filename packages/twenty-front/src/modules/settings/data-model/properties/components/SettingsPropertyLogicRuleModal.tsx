import { useLingui } from '@lingui/react/macro';
import { useMemo, useState } from 'react';
import {
  type ConditionalLogicRule,
  expandPropertyLogicRule,
  toPropertyGroupReference,
} from 'twenty-shared/utils';

import { buildConditionalLogicFields } from '@/conditional-logic/utils/buildConditionalLogicFields';
import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { usePropertySettings } from '@/properties/hooks/usePropertySettings';
import { buildFieldNamesByPropertyGroupId } from '@/properties/utils/buildObjectPropertyLogicRules';
import { SettingsConditionalLogicRuleEditor } from '@/settings/data-model/conditional-logic/components/SettingsConditionalLogicRuleEditor';
import { useSettingsPropertyActions } from '@/settings/data-model/properties/hooks/useSettingsPropertyActions';
import { DropdownInModalContext } from '@/ui/layout/dropdown/contexts/DropdownInModalContext';
import { useFullScreenModal } from '@/ui/layout/fullscreen/hooks/useFullScreenModal';

// Written by the server or the system, never by a person
const EXCLUDED_FIELD_NAMES = new Set([
  'id',
  'createdAt',
  'updatedAt',
  'deletedAt',
  'createdBy',
  'updatedBy',
  'position',
  'searchVector',
]);

type SettingsPropertyLogicRuleModalProps = {
  objectMetadataItem: EnrichedObjectMetadataItem;
  ruleRecordId: string | null;
  initialRule: ConditionalLogicRule;
  onClose: () => void;
};

export const SettingsPropertyLogicRuleModal = ({
  objectMetadataItem,
  ruleRecordId,
  initialRule,
  onClose,
}: SettingsPropertyLogicRuleModalProps) => {
  const { t } = useLingui();
  const { propertySettings } = usePropertySettings();
  const { saveRule } = useSettingsPropertyActions();
  const [draft, setDraft] = useState(initialRule);
  const [isSaving, setIsSaving] = useState(false);

  const fieldMetadataItemByName = useMemo(
    () =>
      new Map(objectMetadataItem.fields.map((field) => [field.name, field])),
    [objectMetadataItem.fields],
  );

  const fields = useMemo(
    () =>
      buildConditionalLogicFields(objectMetadataItem.fields).filter(
        (field) => !EXCLUDED_FIELD_NAMES.has(field.name),
      ),
    [objectMetadataItem.fields],
  );

  const groupOptions = (propertySettings?.groups ?? [])
    .filter((group) => group.objectMetadataId === objectMetadataItem.id)
    .sort((left, right) => left.position - right.position)
    .map(({ id, name }) => ({
      value: toPropertyGroupReference(id),
      label: t`Group: ${name}`,
    }));

  const fieldNamesByPropertyGroupId = useMemo(
    () =>
      propertySettings === null
        ? new Map<string, string[]>()
        : buildFieldNamesByPropertyGroupId({
            propertySettings,
            fields: objectMetadataItem.fields,
          }),
    [propertySettings, objectMetadataItem.fields],
  );

  const handleSave = async () => {
    setIsSaving(true);

    const saved = await saveRule({
      ruleRecordId,
      objectMetadataId: objectMetadataItem.id,
      rule: draft,
    });

    setIsSaving(false);

    if (saved) {
      onClose();
    }
  };

  const objectLabel = objectMetadataItem.labelPlural;

  const { renderFullScreenModal } = useFullScreenModal({
    links: [{ children: t`Conditional logic` }, { children: objectLabel }],
    onClose,
  });

  return renderFullScreenModal(
    <DropdownInModalContext.Provider value={true}>
      <div>
        <SettingsConditionalLogicRuleEditor
          draft={draft}
          onChange={setDraft}
          onCancel={onClose}
          onSave={handleSave}
          isSaving={isSaving}
          fields={fields}
          fieldMetadataItemByName={fieldMetadataItemByName}
          objectMetadataItem={objectMetadataItem}
          previewHint={t`Change the controlling values to see which properties appear and which are required.`}
          extraPropertyOptions={groupOptions}
          expandRule={(rule) =>
            expandPropertyLogicRule(rule, fieldNamesByPropertyGroupId)
          }
        />
      </div>
    </DropdownInModalContext.Provider>,
    true,
  );
};
