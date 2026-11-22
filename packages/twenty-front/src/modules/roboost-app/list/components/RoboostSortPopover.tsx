import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { type RoboostListSort } from '@/roboost-app/list/components/RoboostListTable';
import { getRoboostSortDirectionLabels } from '@/roboost-app/list/utils/getRoboostSortDirectionLabels';
import { Icon } from '@/roboost-ui/components/Icon';
import { Popover } from '@/roboost-ui/components/Popover';
import { Select } from '@/roboost-ui/components/Select';
import { cx } from '@/roboost-ui/utils/cx';
import { useLingui } from '@lingui/react/macro';

type RoboostSortPopoverProps = {
  sortableFields: FieldMetadataItem[];
  sort: RoboostListSort | null;
  onSortChange: (sort: RoboostListSort | null) => void;
};

export const RoboostSortPopover = ({
  sortableFields,
  sort,
  onSortChange,
}: RoboostSortPopoverProps) => {
  const { t, i18n } = useLingui();
  const selectedField = sortableFields.find(
    (field) => field.name === sort?.fieldName,
  );
  const directionLabels = getRoboostSortDirectionLabels(selectedField);

  return (
    <Popover
      ariaLabel={t`Sort by`}
      className="rb-sort-box"
      trigger={({ toggle, isOpen }) => (
        <button
          type="button"
          className={cx('rb-chip', sort !== null && 'is-on')}
          aria-expanded={isOpen}
          onClick={toggle}
        >
          <Icon name="sort-lines" size={14} />
          {t`Sort by`}
        </button>
      )}
    >
      {() => (
        <>
          <div className="rb-sort-box-head">
            <span className="rb-sort-box-title">{t`Sort by`}</span>
            {sort !== null && (
              <button
                type="button"
                className="rb-link"
                onClick={() => onSortChange(null)}
              >
                {t`Clear`}
              </button>
            )}
          </div>
          <div className="rb-sort-box-row">
            <Select
              aria-label={t`Sort field`}
              className="rb-sort-box-field"
              placeholder={t`Choose a property`}
              value={sort?.fieldName ?? ''}
              options={sortableFields.map((field) => ({
                value: field.name,
                label: field.label,
              }))}
              onChange={(fieldName) =>
                onSortChange({
                  fieldName,
                  direction: sort?.direction ?? 'asc',
                })
              }
            />
            <div className="rb-segmented" role="group" aria-label={t`Order`}>
              {(['asc', 'desc'] as const).map((direction) => (
                <button
                  key={direction}
                  type="button"
                  className={cx(
                    'rb-segmented-btn',
                    sort?.direction === direction && 'is-on',
                  )}
                  aria-pressed={sort?.direction === direction}
                  disabled={sort === null}
                  onClick={() =>
                    sort !== null && onSortChange({ ...sort, direction })
                  }
                >
                  {i18n._(directionLabels[direction])}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </Popover>
  );
};
