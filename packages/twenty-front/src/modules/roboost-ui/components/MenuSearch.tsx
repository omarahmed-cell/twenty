import { Icon } from '@/roboost-ui/components/Icon';
import { useLingui } from '@lingui/react/macro';

export type MenuSearchProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export const MenuSearch = ({
  value,
  onChange,
  placeholder,
}: MenuSearchProps) => {
  const { t } = useLingui();

  return (
    <div className="rb-menu-search">
      <input
        autoFocus
        className="rb-menu-search-input"
        value={value}
        placeholder={placeholder ?? t`Search`}
        aria-label={placeholder ?? t`Search`}
        onChange={(event) => onChange(event.target.value)}
      />
      <Icon name="search" size={16} />
    </div>
  );
};
