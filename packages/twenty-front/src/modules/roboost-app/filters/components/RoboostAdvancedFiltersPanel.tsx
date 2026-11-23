import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { useObjectMetadataItems } from '@/object-metadata/hooks/useObjectMetadataItems';
import {
  getRoboostFilterableFields,
  RoboostFilterRuleEditor,
} from '@/roboost-app/filters/components/RoboostFilterRuleEditor';
import { useResolveRoboostAssociationFilters } from '@/roboost-app/filters/hooks/useResolveRoboostAssociationFilters';
import {
  type RoboostAdvancedFilter,
  type RoboostAssociationFilter,
  type RoboostFilterRule,
} from '@/roboost-app/list/types/RoboostListFilters';
import { Button } from '@/roboost-ui/components/Button';
import { Icon } from '@/roboost-ui/components/Icon';
import { Select } from '@/roboost-ui/components/Select';
import { SidePanel } from '@/roboost-ui/components/SidePanel';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { isDefined } from 'twenty-shared/utils';
import { v4 } from 'uuid';
import { RelationType } from '~/generated-metadata/graphql';

type RoboostAdvancedFiltersPanelProps = {
  objectMetadataItem: EnrichedObjectMetadataItem;
  value: RoboostAdvancedFilter;
  onApply: (value: RoboostAdvancedFilter) => void;
  onClose: () => void;
};

const newRule = (): RoboostFilterRule => ({
  id: v4(),
  fieldName: '',
  operator: 'isKnown',
  value: null,
});

const AddFilterButton = ({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) => (
  <button type="button" className="rb-afp-add" onClick={onClick}>
    <Icon name="plus" size={14} />
    {label}
  </button>
);

export const RoboostAdvancedFiltersPanel = ({
  objectMetadataItem,
  value,
  onApply,
  onClose,
}: RoboostAdvancedFiltersPanelProps) => {
  const { t } = useLingui();
  const { objectMetadataItems } = useObjectMetadataItems();
  const { resolveAssociationFilters } =
    useResolveRoboostAssociationFilters(objectMetadataItem);
  const [draft, setDraft] = useState<RoboostAdvancedFilter>(value);
  const [isApplying, setIsApplying] = useState(false);

  const relationFields = objectMetadataItem.fields
    .filter(
      (field) =>
        field.isActive &&
        field.isSystem !== true &&
        (field.relation?.type === RelationType.MANY_TO_ONE ||
          field.relation?.type === RelationType.ONE_TO_MANY),
    )
    .filter((field) =>
      objectMetadataItems.some(
        (item) =>
          item.nameSingular ===
            field.relation?.targetObjectMetadata.nameSingular &&
          item.isSystem !== true,
      ),
    )
    .sort((first, second) => first.label.localeCompare(second.label));

  const getTargetObject = (relationFieldName: string) =>
    objectMetadataItems.find(
      (item) =>
        item.nameSingular ===
        relationFields.find((field) => field.name === relationFieldName)
          ?.relation?.targetObjectMetadata.nameSingular,
    );

  const updateAssociation = (
    associationId: string,
    update: (association: RoboostAssociationFilter) => RoboostAssociationFilter,
  ) =>
    setDraft({
      ...draft,
      associations: draft.associations.map((association) =>
        association.id === associationId ? update(association) : association,
      ),
    });

  const updateGroupRules = (
    groupId: string,
    update: (rules: RoboostFilterRule[]) => RoboostFilterRule[],
  ) =>
    setDraft({
      ...draft,
      groups: draft.groups
        .map((group) =>
          group.id === groupId
            ? { ...group, rules: update(group.rules) }
            : group,
        )
        .filter((group) => group.rules.length > 0),
    });

  const apply = async () => {
    setIsApplying(true);
    try {
      const associations = await resolveAssociationFilters(
        draft.associations.filter((association) =>
          isDefined(getTargetObject(association.relationFieldName)),
        ),
      );

      onApply({ ...draft, associations });
      onClose();
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <SidePanel
      title={t`All filters`}
      onClose={onClose}
      width={460}
      className="rb-afp"
      footer={
        <>
          <Button
            variant="ghost"
            onClick={() => setDraft({ groups: [], associations: [] })}
          >
            {t`Clear all`}
          </Button>
          <span className="rb-sp" />
          <Button variant="secondary" onClick={onClose}>
            {t`Cancel`}
          </Button>
          <Button variant="primary" disabled={isApplying} onClick={apply}>
            {isApplying ? t`Applying…` : t`Apply`}
          </Button>
        </>
      }
    >
      <section className="rb-afp-section">
        <h3 className="rb-afp-title">{t`Association`}</h3>
        <p className="rb-afp-sub">{t`Filter by associated objects`}</p>
        {draft.associations.map((association) => {
          const targetObject = getTargetObject(association.relationFieldName);

          return (
            <div key={association.id} className="rb-afp-group">
              <div className="rb-afp-group-head">
                <Select
                  aria-label={t`Associated object`}
                  placeholder={t`Choose an association`}
                  value={association.relationFieldName}
                  options={relationFields.map((field) => ({
                    value: field.name,
                    label: field.label,
                  }))}
                  onChange={(relationFieldName) =>
                    updateAssociation(association.id, () => ({
                      ...association,
                      relationFieldName,
                      rules: [newRule()],
                      resolvedFilter: null,
                    }))
                  }
                />
                <button
                  type="button"
                  className="rb-rc-iconbtn"
                  aria-label={t`Remove association filter`}
                  onClick={() =>
                    setDraft({
                      ...draft,
                      associations: draft.associations.filter(
                        (candidate) => candidate.id !== association.id,
                      ),
                    })
                  }
                >
                  <Icon name="x" size={14} />
                </button>
              </div>
              {isDefined(targetObject) &&
                association.rules.map((rule, index) => (
                  <div key={rule.id}>
                    {index > 0 && <div className="rb-afp-and">{t`and`}</div>}
                    <RoboostFilterRuleEditor
                      objectMetadataItem={targetObject}
                      rule={rule}
                      onChange={(nextRule) =>
                        updateAssociation(association.id, (current) => ({
                          ...current,
                          rules: current.rules.map((candidate) =>
                            candidate.id === rule.id ? nextRule : candidate,
                          ),
                        }))
                      }
                      onRemove={() =>
                        updateAssociation(association.id, (current) => ({
                          ...current,
                          rules: current.rules.filter(
                            (candidate) => candidate.id !== rule.id,
                          ),
                        }))
                      }
                    />
                  </div>
                ))}
              {isDefined(targetObject) &&
                getRoboostFilterableFields(targetObject).length > 0 && (
                  <AddFilterButton
                    label={t`Add condition`}
                    onClick={() =>
                      updateAssociation(association.id, (current) => ({
                        ...current,
                        rules: [...current.rules, newRule()],
                      }))
                    }
                  />
                )}
            </div>
          );
        })}
        <AddFilterButton
          label={t`Add filter`}
          onClick={() =>
            setDraft({
              ...draft,
              associations: [
                ...draft.associations,
                {
                  id: v4(),
                  relationFieldName: '',
                  rules: [],
                  resolvedFilter: null,
                },
              ],
            })
          }
        />
      </section>
      <div className="rb-afp-divider">
        <span>{t`AND`}</span>
      </div>
      <section className="rb-afp-section">
        <h3 className="rb-afp-title">{t`Advanced filters`}</h3>
        <p className="rb-afp-sub">
          {t`Filter by ${objectMetadataItem.labelSingular.toLowerCase()} properties`}
        </p>
        {draft.groups.map((group, groupIndex) => (
          <div key={group.id}>
            {groupIndex > 0 && <div className="rb-afp-or">{t`or`}</div>}
            <div className="rb-afp-group">
              {group.rules.map((rule, index) => (
                <div key={rule.id}>
                  {index > 0 && <div className="rb-afp-and">{t`and`}</div>}
                  <RoboostFilterRuleEditor
                    objectMetadataItem={objectMetadataItem}
                    rule={rule}
                    onChange={(nextRule) =>
                      updateGroupRules(group.id, (rules) =>
                        rules.map((candidate) =>
                          candidate.id === rule.id ? nextRule : candidate,
                        ),
                      )
                    }
                    onRemove={() =>
                      updateGroupRules(group.id, (rules) =>
                        rules.filter((candidate) => candidate.id !== rule.id),
                      )
                    }
                  />
                </div>
              ))}
              <AddFilterButton
                label={t`Add condition`}
                onClick={() =>
                  updateGroupRules(group.id, (rules) => [...rules, newRule()])
                }
              />
            </div>
          </div>
        ))}
        <AddFilterButton
          label={
            draft.groups.length === 0 ? t`Add filter` : t`Add filter group`
          }
          onClick={() =>
            setDraft({
              ...draft,
              groups: [...draft.groups, { id: v4(), rules: [newRule()] }],
            })
          }
        />
      </section>
    </SidePanel>
  );
};
