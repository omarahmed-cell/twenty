import { useObjectMetadataItems } from '@/object-metadata/hooks/useObjectMetadataItems';
import { type RoboostActivityTarget } from '@/roboost-app/activity/states/roboostActivityComposerState';
import { RoboostRecordPicker } from '@/roboost-app/fields/RoboostRecordPicker';
import { Icon } from '@/roboost-ui/components/Icon';
import { Select } from '@/roboost-ui/components/Select';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';

const ASSOCIABLE_OBJECTS = ['company', 'person', 'opportunity', 'service'];

type RoboostActivityTargetsMenuProps = {
  targets: RoboostActivityTarget[];
  onChange: (targets: RoboostActivityTarget[]) => void;
};

export const RoboostActivityTargetsMenu = ({
  targets,
  onChange,
}: RoboostActivityTargetsMenuProps) => {
  const { t } = useLingui();
  const { objectMetadataItems } = useObjectMetadataItems();
  const [isOpen, setIsOpen] = useState(false);
  const [pickerObject, setPickerObject] = useState('company');

  const associableObjects = objectMetadataItems.filter(
    (item) => item.isActive && ASSOCIABLE_OBJECTS.includes(item.nameSingular),
  );
  const getObjectLabel = (nameSingular: string) =>
    objectMetadataItems.find((item) => item.nameSingular === nameSingular)
      ?.labelSingular ?? nameSingular;

  return (
    <div className="rb-act-assoc">
      <button
        type="button"
        className="rb-act-inline rb-act-assoc-toggle"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
      >
        {targets.length === 1
          ? t`Associated with 1 record`
          : t`Associated with ${targets.length} records`}
        <Icon name="caret" size={12} />
      </button>
      {isOpen && (
        <div className="rb-act-assoc-panel">
          {targets.map((target) => (
            <div key={target.recordId} className="rb-act-assoc-item">
              <span className="rb-act-assoc-type">
                {getObjectLabel(target.objectNameSingular)}
              </span>
              <span className="rb-act-assoc-name">{target.label}</span>
              <button
                type="button"
                className="rb-rc-iconbtn"
                aria-label={t`Remove ${target.label}`}
                onClick={() =>
                  onChange(
                    targets.filter(
                      (candidate) => candidate.recordId !== target.recordId,
                    ),
                  )
                }
              >
                <Icon name="x" size={13} />
              </button>
            </div>
          ))}
          <div className="rb-act-assoc-add">
            <Select
              aria-label={t`Record type`}
              value={pickerObject}
              options={associableObjects.map((item) => ({
                value: item.nameSingular,
                label: item.labelSingular,
              }))}
              onChange={setPickerObject}
            />
            <RoboostRecordPicker
              key={pickerObject}
              objectNameSingular={pickerObject}
              selectedLabel=""
              placeholder={t`Add a record`}
              isClearable={false}
              onSelect={(record) => {
                if (
                  record === null ||
                  targets.some((target) => target.recordId === record.id)
                ) {
                  return;
                }
                onChange([
                  ...targets,
                  {
                    objectNameSingular: pickerObject,
                    recordId: record.id,
                    label: record.label,
                  },
                ]);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
