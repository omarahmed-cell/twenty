import { formatRoboostDate } from '@/roboost-app/utils/formatRoboostDate';
import { ROBOOST_PERMISSION_HISTORY } from '@/roboost-app/users-and-teams/graphql/roboostUsersQueries';
import { type RoboostPermissionHistoryEntry } from '@/roboost-app/users-and-teams/types/RoboostUsers';
import { Button } from '@/roboost-ui/components/Button';
import { Input } from '@/roboost-ui/components/Input';
import { Modal } from '@/roboost-ui/components/Modal';
import { useQuery } from '@apollo/client/react';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { isDefined } from 'twenty-shared/utils';

type RoboostPermissionHistoryModalProps = {
  workspaceMemberId: string | null;
  title: string;
  onClose: () => void;
};

const toStartOfDay = (value: string) =>
  value === '' ? null : new Date(`${value}T00:00:00`).toISOString();

const toEndOfDay = (value: string) =>
  value === '' ? null : new Date(`${value}T23:59:59.999`).toISOString();

const formatTime = (value: string) =>
  new Date(value).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });

export const RoboostPermissionHistoryModal = ({
  workspaceMemberId,
  title,
  onClose,
}: RoboostPermissionHistoryModalProps) => {
  const { t } = useLingui();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const { data, loading } = useQuery<{
    roboostPermissionHistory: RoboostPermissionHistoryEntry[];
  }>(ROBOOST_PERMISSION_HISTORY, {
    variables: {
      workspaceMemberId,
      from: toStartOfDay(from),
      to: toEndOfDay(to),
    },
    fetchPolicy: 'network-only',
  });
  const entries = data?.roboostPermissionHistory ?? [];

  return (
    <Modal
      title={title}
      subtitle={t`Newest first. Every change to permissions, role, teams, invitations and status.`}
      width={760}
      onClose={onClose}
      footer={
        <>
          <span className="rb-sp" />
          <Button variant="secondary" onClick={onClose}>
            {t`Close`}
          </Button>
        </>
      }
    >
      <div className="rb-ut-history">
        <div className="rb-ut-history-filters">
          <label className="rb-ut-label">
            {t`From`}
            <Input
              type="date"
              size="sm"
              value={from}
              onChange={(event) => setFrom(event.target.value)}
            />
          </label>
          <label className="rb-ut-label">
            {t`To`}
            <Input
              type="date"
              size="sm"
              value={to}
              onChange={(event) => setTo(event.target.value)}
            />
          </label>
        </div>
        <div className="rb-ut-history-list">
          {entries.map((entry) => (
            <div key={entry.id} className="rb-ut-history-item">
              <div className="rb-ut-history-when">
                <div>{formatRoboostDate(entry.createdAt)}</div>
                <div className="rb-dt-muted">{formatTime(entry.createdAt)}</div>
              </div>
              <div className="rb-ut-history-what">
                <div className="rb-ut-history-setting">
                  {isDefined(workspaceMemberId)
                    ? entry.setting
                    : `${entry.targetLabel}: ${entry.setting}`}
                </div>
                {(isDefined(entry.fromValue) || isDefined(entry.toValue)) && (
                  <div className="rb-ut-history-change">
                    <span className="rb-ut-history-from">
                      {entry.fromValue ?? '—'}
                    </span>
                    <span aria-hidden>→</span>
                    <span className="rb-ut-history-to">
                      {entry.toValue ?? '—'}
                    </span>
                  </div>
                )}
                <div className="rb-dt-muted">
                  {t`by ${entry.actorName ?? 'the system'}`}
                </div>
              </div>
            </div>
          ))}
          {entries.length === 0 && !loading && (
            <div className="rb-dt-empty">{t`No changes in this period.`}</div>
          )}
        </div>
      </div>
    </Modal>
  );
};
