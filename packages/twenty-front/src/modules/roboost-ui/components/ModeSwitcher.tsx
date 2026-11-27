import { type RoboostMode } from '@/roboost-ui/types/RoboostMode';
import { cx } from '@/roboost-ui/utils/cx';
import { getRoboostModeAttributes } from '@/roboost-ui/utils/getRoboostModeAttributes';
import { useLingui } from '@lingui/react/macro';

export type ModeSwitcherProps = {
  value: RoboostMode;
  onChange: (mode: RoboostMode) => void;
  className?: string;
};

export const ModeSwitcher = ({
  value,
  onChange,
  className,
}: ModeSwitcherProps) => {
  const { t } = useLingui();

  const modes: { id: RoboostMode; name: string; description: string }[] = [
    {
      id: 'roboost',
      name: t`Roboost`,
      description: t`Navy frame · orange accent`,
    },
    {
      id: 'roboost-dark',
      name: t`Roboost Dark`,
      description: t`Near-black frame · orange accent`,
    },
    { id: 'sira', name: t`Sira`, description: t`Blue frame · blue accent` },
    {
      id: 'sira-dark',
      name: t`Sira Dark`,
      description: t`Near-black frame · blue accent`,
    },
    {
      id: 'light',
      name: t`Light`,
      description: t`White frame · black and white`,
    },
  ];

  return (
    <div className={cx('rb-mode-cards rb-ui', className)} role="radiogroup">
      {modes.map((mode) => (
        <button
          key={mode.id}
          type="button"
          role="radio"
          data-theme={getRoboostModeAttributes(mode.id).theme}
          data-scheme={getRoboostModeAttributes(mode.id).scheme}
          className={cx('rb-mode-card', value === mode.id && 'is-selected')}
          aria-checked={value === mode.id}
          onClick={() => onChange(mode.id)}
        >
          <span className="rb-mode-thumb">
            <span
              className="rb-mode-thumb-nav"
              style={{ background: 'var(--frame)' }}
            >
              <span className="rb-mode-thumb-logo" />
              <span className="rb-mode-thumb-line on" />
              <span className="rb-mode-thumb-line" />
              <span className="rb-mode-thumb-line" />
            </span>
            <span className="rb-mode-thumb-main">
              <span
                className="rb-mode-thumb-bar"
                style={{ background: 'var(--accent)', width: '46%' }}
              />
              <span className="rb-mode-thumb-card" />
            </span>
          </span>
          <span className="rb-mode-meta">
            <span className="rb-mode-radio" />
            <span style={{ flex: 1, minWidth: 0 }}>
              <span className="rb-mode-name" style={{ display: 'block' }}>
                {mode.name}
              </span>
              <span className="rb-mode-desc" style={{ display: 'block' }}>
                {mode.description}
              </span>
            </span>
          </span>
        </button>
      ))}
    </div>
  );
};
