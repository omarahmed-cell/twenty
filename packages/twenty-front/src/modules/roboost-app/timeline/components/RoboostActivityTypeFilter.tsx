import { ROBOOST_ACTIVITY_TYPE_CATEGORIES } from '@/roboost-app/timeline/constants/RoboostActivityTypeCategories';
import { type RoboostActivityTypeKey } from '@/roboost-app/timeline/types/RoboostActivityTypeKey';
import { Checkbox } from '@/roboost-ui/components/Checkbox';
import { Icon } from '@/roboost-ui/components/Icon';
import { MenuSearch } from '@/roboost-ui/components/MenuSearch';
import { Popover } from '@/roboost-ui/components/Popover';
import { cx } from '@/roboost-ui/utils/cx';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';

type RoboostActivityTypeFilterProps = {
  selected: RoboostActivityTypeKey[];
  onChange: (selected: RoboostActivityTypeKey[]) => void;
};

// All types selected means no filter; the chip shows "Activity (n/total)" like HubSpot
export const RoboostActivityTypeFilter = ({
  selected,
  onChange,
}: RoboostActivityTypeFilterProps) => {
  const { t, i18n } = useLingui();
  const [search, setSearch] = useState('');
  const searchTerm = search.trim().toLowerCase();
  const allKeys = ROBOOST_ACTIVITY_TYPE_CATEGORIES.flatMap(({ types }) =>
    types.map(({ key }) => key),
  );
  const categories = ROBOOST_ACTIVITY_TYPE_CATEGORIES.map((category) => ({
    ...category,
    types: category.types.filter(
      ({ label }) =>
        searchTerm === '' || i18n._(label).toLowerCase().includes(searchTerm),
    ),
  })).filter(({ types }) => types.length > 0);

  const setKeys = (keys: RoboostActivityTypeKey[], isOn: boolean) =>
    onChange(
      isOn
        ? [...new Set([...selected, ...keys])]
        : selected.filter((key) => !keys.includes(key)),
    );
  const isFiltered = selected.length < allKeys.length;

  return (
    <Popover
      ariaLabel={t`Activity type`}
      className="rb-atf"
      trigger={({ toggle, isOpen }) => (
        <button
          type="button"
          className={cx('rb-chip', isFiltered && 'is-on')}
          aria-expanded={isOpen}
          onClick={toggle}
        >
          {isFiltered
            ? t`Activity (${selected.length}/${allKeys.length})`
            : t`Activity`}
          <Icon name="caret" size={12} />
        </button>
      )}
    >
      {() => (
        <>
          <MenuSearch value={search} onChange={setSearch} />
          <div className="rb-atf-all">
            <Checkbox
              checked={selected.length === allKeys.length}
              indeterminate={selected.length > 0 && isFiltered}
              onChange={(checked) => onChange(checked ? allKeys : [])}
            >
              <b>{t`Select all`}</b>
            </Checkbox>
          </div>
          <div className="rb-atf-cols">
            {categories.map((category) => {
              const keys = category.types.map(({ key }) => key);
              const selectedCount = keys.filter((key) =>
                selected.includes(key),
              ).length;

              return (
                <div key={category.id} className="rb-atf-col">
                  <Checkbox
                    checked={selectedCount === keys.length}
                    indeterminate={
                      selectedCount > 0 && selectedCount < keys.length
                    }
                    onChange={(checked) => setKeys(keys, checked)}
                  >
                    <b>{i18n._(category.label)}</b>
                  </Checkbox>
                  <div className="rb-atf-types">
                    {category.types.map(({ key, label }) => (
                      <Checkbox
                        key={key}
                        checked={selected.includes(key)}
                        onChange={(checked) => setKeys([key], checked)}
                      >
                        {i18n._(label)}
                      </Checkbox>
                    ))}
                  </div>
                </div>
              );
            })}
            {categories.length === 0 && (
              <div className="rb-menu-empty">{t`No matches`}</div>
            )}
          </div>
        </>
      )}
    </Popover>
  );
};
