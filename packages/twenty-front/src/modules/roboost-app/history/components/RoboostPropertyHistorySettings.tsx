import { MAX_ROBOOST_PROPERTY_HISTORY_LIMIT } from '@/roboost-app/history/constants/MaxRoboostPropertyHistoryLimit';
import { useRoboostPropertyHistoryLimits } from '@/roboost-app/history/hooks/useRoboostPropertyHistoryLimits';
import { type RoboostPropertyHistoryLimits } from '@/roboost-app/history/types/RoboostPropertyHistoryLimits';
import { Button } from '@/roboost-ui/components/Button';
import { Input } from '@/roboost-ui/components/Input';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';

type RoboostPropertyHistoryDraft = Record<
  keyof RoboostPropertyHistoryLimits,
  string
>;

const isValidLimit = (value: string) => {
  const limit = Number(value);

  return (
    Number.isInteger(limit) &&
    limit >= 1 &&
    limit <= MAX_ROBOOST_PROPERTY_HISTORY_LIMIT
  );
};

export const RoboostPropertyHistorySettings = () => {
  const { t } = useLingui();
  const { limits, saveLimits } = useRoboostPropertyHistoryLimits();
  const [draft, setDraft] = useState<RoboostPropertyHistoryDraft>({
    contacts: String(limits.contacts),
    others: String(limits.others),
  });
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>(
    'idle',
  );
  const isValid = isValidLimit(draft.contacts) && isValidLimit(draft.others);
  const isChanged =
    Number(draft.contacts) !== limits.contacts ||
    Number(draft.others) !== limits.others;

  const rows: { key: keyof RoboostPropertyHistoryLimits; label: string }[] = [
    { key: 'contacts', label: t`Contacts` },
    { key: 'others', label: t`Other objects` },
  ];

  const save = async () => {
    setStatus('saving');
    try {
      await saveLimits({
        contacts: Number(draft.contacts),
        others: Number(draft.others),
      });
      setStatus('saved');
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className="rb-ui rb-histlimits">
      {rows.map(({ key, label }) => (
        <label key={key} className="rb-histlimits-row">
          <span>{label}</span>
          <Input
            type="number"
            size="sm"
            invalid={!isValidLimit(draft[key])}
            aria-label={t`Changes kept per property for ${label}`}
            value={draft[key]}
            onChange={(event) => {
              setStatus('idle');
              setDraft({ ...draft, [key]: event.target.value });
            }}
          />
        </label>
      ))}
      <div className="rb-workdays-foot">
        <Button
          variant="primary"
          size="sm"
          disabled={!isChanged || !isValid || status === 'saving'}
          onClick={save}
        >
          {status === 'saving' ? t`Saving…` : t`Save`}
        </Button>
        {!isValid && (
          <span className="rb-workdays-note is-error">
            {t`Use a whole number from 1 to ${MAX_ROBOOST_PROPERTY_HISTORY_LIMIT}.`}
          </span>
        )}
        {status === 'saved' && (
          <span className="rb-workdays-note">{t`Saved`}</span>
        )}
        {status === 'error' && (
          <span className="rb-workdays-note is-error">
            {t`Only admins can change the property history limits.`}
          </span>
        )}
      </div>
    </div>
  );
};
