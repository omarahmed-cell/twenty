import { Icon } from '@/roboost-ui/components/Icon';
import { Input } from '@/roboost-ui/components/Input';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { normalizeDomain } from 'twenty-shared/utils';

export type RoboostMultiValueKind = 'email' | 'domain';

type RoboostMultiValueInputProps = {
  kind: RoboostMultiValueKind;
  label: string;
  primary: string;
  extras: string[];
  placeholder?: string;
  invalid?: boolean;
  onChange: (primary: string, extras: string[]) => void;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const normalizeRoboostMultiValue = (
  kind: RoboostMultiValueKind,
  value: string,
) => (kind === 'email' ? value.trim().toLowerCase() : normalizeDomain(value));

export const isValidRoboostMultiValue = (
  kind: RoboostMultiValueKind,
  value: string,
) =>
  kind === 'email'
    ? EMAIL_PATTERN.test(value)
    : /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(value);

// Primary value plus the extra emails or domains as chips; extras can be removed or made primary
export const RoboostMultiValueInput = ({
  kind,
  label,
  primary,
  extras,
  placeholder,
  invalid,
  onChange,
}: RoboostMultiValueInputProps) => {
  const { t } = useLingui();
  const [draft, setDraft] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const normalizedDraft = normalizeRoboostMultiValue(kind, draft);
  const isDraftValid =
    normalizedDraft !== '' && isValidRoboostMultiValue(kind, normalizedDraft);
  const isDuplicate =
    normalizedDraft === normalizeRoboostMultiValue(kind, primary) ||
    extras.some(
      (extra) => normalizeRoboostMultiValue(kind, extra) === normalizedDraft,
    );

  const addDraft = () => {
    if (!isDraftValid || isDuplicate) {
      return;
    }
    onChange(primary, [...extras, normalizedDraft]);
    setDraft('');
    setIsAdding(false);
  };

  return (
    <div className="rb-mv">
      <Input
        type={kind === 'email' ? 'email' : 'text'}
        value={primary}
        placeholder={placeholder}
        invalid={invalid}
        aria-label={label}
        onChange={(event) => onChange(event.target.value, extras)}
      />
      {extras.length > 0 && (
        <div className="rb-mv-chips">
          {extras.map((extra, index) => (
            <span key={`${extra}-${index}`} className="rb-mv-chip">
              <span className="rb-truncate">{extra}</span>
              <button
                type="button"
                className="rb-mv-chip-action"
                title={t`Make primary`}
                aria-label={t`Make ${extra} primary`}
                onClick={() =>
                  onChange(extra, [
                    ...extras.slice(0, index),
                    ...(primary.trim() === '' ? [] : [primary.trim()]),
                    ...extras.slice(index + 1),
                  ])
                }
              >
                <Icon name="star" size={11} />
              </button>
              <button
                type="button"
                className="rb-mv-chip-action"
                title={t`Remove`}
                aria-label={t`Remove ${extra}`}
                onClick={() =>
                  onChange(
                    primary,
                    extras.filter((_, candidate) => candidate !== index),
                  )
                }
              >
                <Icon name="x" size={11} />
              </button>
            </span>
          ))}
        </div>
      )}
      {isAdding ? (
        <div className="rb-mv-add-row">
          <Input
            size="sm"
            value={draft}
            placeholder={
              kind === 'email' ? t`another@company.com` : t`otherdomain.com`
            }
            invalid={draft !== '' && (!isDraftValid || isDuplicate)}
            aria-label={kind === 'email' ? t`Add email` : t`Add domain`}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                event.stopPropagation();
                addDraft();
              }
              if (event.key === 'Escape') {
                event.stopPropagation();
                setIsAdding(false);
                setDraft('');
              }
            }}
          />
          <button
            type="button"
            className="rb-mv-add"
            disabled={!isDraftValid || isDuplicate}
            onClick={addDraft}
          >
            {t`Add`}
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="rb-mv-add"
          onClick={() => setIsAdding(true)}
        >
          <Icon name="plus" size={12} />
          {kind === 'email' ? t`Add email` : t`Add domain`}
        </button>
      )}
    </div>
  );
};
