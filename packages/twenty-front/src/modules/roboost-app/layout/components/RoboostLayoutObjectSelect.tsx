import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { Select } from '@/roboost-ui/components/Select';
import { useLingui } from '@lingui/react/macro';

type RoboostLayoutObjectSelectProps = {
  objects: EnrichedObjectMetadataItem[];
  value: string;
  onChange: (nameSingular: string) => void;
};

// The "Select an object:" bar at the top of both Layout tabs
export const RoboostLayoutObjectSelect = ({
  objects,
  value,
  onChange,
}: RoboostLayoutObjectSelectProps) => {
  const { t } = useLingui();

  return (
    <div className="rb-layout-object">
      <span className="rb-layout-object-label">{t`Select an object:`}</span>
      <Select
        aria-label={t`Object`}
        className="rb-layout-object-select"
        value={value}
        options={objects.map((item) => ({
          value: item.nameSingular,
          label: item.labelPlural,
        }))}
        onChange={onChange}
      />
    </div>
  );
};
