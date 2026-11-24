import { Icon } from '@/roboost-ui/components/Icon';
import { useLingui } from '@lingui/react/macro';
import { type KeyboardEvent, useEffect, useRef } from 'react';

export type MenuSearchProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onKeyDown?: (event: KeyboardEvent<HTMLInputElement>) => void;
};

export const MenuSearch = ({
  value,
  onChange,
  placeholder,
  onKeyDown,
}: MenuSearchProps) => {
  const { t } = useLingui();
  const inputRef = useRef<HTMLInputElement>(null);

  // The opening click is still being handled by page-level listeners that move focus, so focus once it settles
  useEffect(() => {
    const timeoutId = window.setTimeout(
      () => inputRef.current?.focus({ preventScroll: true }),
      0,
    );

    return () => window.clearTimeout(timeoutId);
  }, []);

  return (
    <div className="rb-menu-search">
      <input
        ref={inputRef}
        className="rb-menu-search-input"
        value={value}
        placeholder={placeholder ?? t`Search`}
        aria-label={placeholder ?? t`Search`}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={onKeyDown}
      />
      <Icon name="search" size={16} />
    </div>
  );
};
