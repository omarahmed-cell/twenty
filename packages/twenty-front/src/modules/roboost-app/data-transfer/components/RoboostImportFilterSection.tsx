import { ROBOOST_IMPORT_FILTER_FIELD_NAME } from '@/roboost-app/data-transfer/constants/RoboostImportFilterFieldName';
import { ROBOOST_IMPORT_OPTIONS } from '@/roboost-app/data-transfer/graphql/roboostDataTransferQueries';
import { type RoboostAssociationFilter } from '@/roboost-app/list/types/RoboostListFilters';
import { Icon } from '@/roboost-ui/components/Icon';
import { MultiSelect } from '@/roboost-ui/components/MultiSelect';
import { Select } from '@/roboost-ui/components/Select';
import { useQuery } from '@apollo/client/react';
import { useLingui } from '@lingui/react/macro';
import { isDefined } from 'twenty-shared/utils';
import { v4 } from 'uuid';

type RoboostImportFilterSectionProps = {
  objectNameSingular: string;
  associations: RoboostAssociationFilter[];
  onChange: (associations: RoboostAssociationFilter[]) => void;
};

// "Import is any of / is none of <imports>": which import created or updated the record
export const RoboostImportFilterSection = ({
  objectNameSingular,
  associations,
  onChange,
}: RoboostImportFilterSectionProps) => {
  const { t } = useLingui();
  const { data } = useQuery<{
    roboostImportOptions: { id: string; name: string }[];
  }>(ROBOOST_IMPORT_OPTIONS, {
    variables: { objectNameSingular },
    fetchPolicy: 'cache-and-network',
  });
  const importFilter = associations.find(
    (association) =>
      association.relationFieldName === ROBOOST_IMPORT_FILTER_FIELD_NAME,
  );
  const others = associations.filter(
    (association) => association !== importFilter,
  );
  const rule = importFilter?.rules[0];
  const options = (data?.roboostImportOptions ?? []).map((option) => ({
    value: option.id,
    label: option.name,
  }));
  const selectedIds = Array.isArray(rule?.value) ? rule.value : [];

  const update = (operator: 'isAnyOf' | 'isNoneOf', ids: string[]) =>
    onChange([
      ...others,
      {
        id: importFilter?.id ?? v4(),
        relationFieldName: ROBOOST_IMPORT_FILTER_FIELD_NAME,
        rules: [
          {
            id: rule?.id ?? v4(),
            fieldName: 'import',
            operator,
            value: ids,
            labels: Object.fromEntries(
              options
                .filter((option) => ids.includes(option.value))
                .map((option) => [option.value, option.label]),
            ),
          },
        ],
        resolvedFilter: null,
      },
    ]);

  return (
    <section className="rb-afp-section">
      <h3 className="rb-afp-title">{t`Import`}</h3>
      <p className="rb-afp-sub">{t`Filter by the import that created or updated the record`}</p>
      {isDefined(importFilter) ? (
        <div className="rb-afp-group">
          <div className="rb-afp-group-head">
            <Select
              aria-label={t`Import condition`}
              value={rule?.operator === 'isNoneOf' ? 'isNoneOf' : 'isAnyOf'}
              options={[
                { value: 'isAnyOf', label: t`is any of` },
                { value: 'isNoneOf', label: t`is none of` },
              ]}
              onChange={(operator) =>
                update(operator as 'isAnyOf' | 'isNoneOf', selectedIds)
              }
            />
            <button
              type="button"
              className="rb-rc-iconbtn"
              aria-label={t`Remove import filter`}
              onClick={() => onChange(others)}
            >
              <Icon name="x" size={14} />
            </button>
          </div>
          <MultiSelect
            aria-label={t`Imports`}
            placeholder={
              options.length === 0 ? t`No imports yet` : t`Choose imports`
            }
            options={options}
            value={selectedIds}
            onChange={(ids) =>
              update(
                rule?.operator === 'isNoneOf' ? 'isNoneOf' : 'isAnyOf',
                ids,
              )
            }
          />
        </div>
      ) : (
        <button
          type="button"
          className="rb-afp-add"
          onClick={() => update('isAnyOf', [])}
        >
          <Icon name="plus" size={14} />
          {t`Add import filter`}
        </button>
      )}
    </section>
  );
};
