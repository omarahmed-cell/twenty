import { DEFAULT_ROBOOST_LARGE_EXPORT_THRESHOLD } from '@/roboost-app/data-transfer/constants/DefaultRoboostLargeExportThreshold';
import { useRoboostUserVars } from '@/roboost-app/hooks/useRoboostUserVars';
import { Button } from '@/roboost-ui/components/Button';
import { Input } from '@/roboost-ui/components/Input';
import { useLingui } from '@lingui/react/macro';
import { isNumber } from '@sniptt/guards';
import { useState } from 'react';

const THRESHOLD_USER_VAR = 'roboost.largeExportThreshold';

// Per admin: each one is alerted only above their own number
export const RoboostLargeExportThreshold = () => {
  const { t } = useLingui();
  const { getUserVar, setUserVar } = useRoboostUserVars();
  const saved = getUserVar<number>(THRESHOLD_USER_VAR);
  const current = isNumber(saved)
    ? saved
    : DEFAULT_ROBOOST_LARGE_EXPORT_THRESHOLD;
  const [draft, setDraft] = useState(String(current));
  const [status, setStatus] = useState<'idle' | 'saved'>('idle');
  const value = Number(draft);
  const isValid = Number.isInteger(value) && value >= 1;

  return (
    <div className="rb-dt-card">
      <h3 className="rb-dt-title">{t`Large export notification threshold`}</h3>
      <p className="rb-dt-sub">{t`Get notified when someone exports more than this number of records. Only admins are notified, and this threshold applies only to you.`}</p>
      <div className="rb-dt-threshold">
        <Input
          type="number"
          size="sm"
          aria-label={t`Large export threshold`}
          invalid={!isValid}
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value);
            setStatus('idle');
          }}
        />
        <span className="rb-dt-muted">{t`records`}</span>
        <Button
          size="sm"
          variant="primary"
          disabled={!isValid || value === current}
          onClick={async () => {
            await setUserVar(THRESHOLD_USER_VAR, value);
            setStatus('saved');
          }}
        >
          {t`Save`}
        </Button>
        {status === 'saved' && <span className="rb-dt-muted">{t`Saved`}</span>}
      </div>
    </div>
  );
};
