import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { useRoboostFieldGroups } from '@/roboost-app/list/hooks/useRoboostFieldGroups';
import { Checkbox } from '@/roboost-ui/components/Checkbox';
import { Icon } from '@/roboost-ui/components/Icon';
import { Input } from '@/roboost-ui/components/Input';
import { useLingui } from '@lingui/react/macro';
import { type FocusEvent, Fragment, useState } from 'react';

type RoboostAddColumnPopoverProps = {
  objectMetadataItem: EnrichedObjectMetadataItem;
  selectedFieldIds: string[];
  onToggle: (fieldId: string) => void;
};

export const RoboostAddColumnPopover = ({
  objectMetadataItem,
  selectedFieldIds,
  onToggle,
}: RoboostAddColumnPopoverProps) => {
  const { t } = useLingui();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const groups = useRoboostFieldGroups(objectMetadataItem);
  const term = search.trim().toLowerCase();

  return (
    <div
      className="rb-menu-anchor"
      onBlur={(event: FocusEvent<HTMLDivElement>) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setIsOpen(false);
        }
      }}
    >
      <button
        type="button"
        className="rb-addcol-btn"
        aria-expanded={isOpen}
        onClick={(event) => {
          event.stopPropagation();
          setIsOpen(!isOpen);
        }}
      >
        <Icon name="plus" size={13} strokeWidth={2} />
        {t`Add column`}
      </button>
      {isOpen && (
        <div
          className="rb-addpop"
          tabIndex={-1}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="rb-ap-search">
            <Input
              variant="search"
              size="sm"
              placeholder={t`Search properties`}
              aria-label={t`Search properties`}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <div className="rb-ap-list">
            {groups.map((group) => {
              const fields = group.fields.filter((field) =>
                field.label.toLowerCase().includes(term),
              );

              return fields.length === 0 ? null : (
                <Fragment key={group.id}>
                  <div className="rb-cm-group">{group.title}</div>
                  {fields.map((field) => (
                    <div key={field.id} className="rb-ap-item">
                      <Checkbox
                        checked={selectedFieldIds.includes(field.id)}
                        onChange={() => onToggle(field.id)}
                      >
                        {field.label}
                      </Checkbox>
                    </div>
                  ))}
                </Fragment>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
