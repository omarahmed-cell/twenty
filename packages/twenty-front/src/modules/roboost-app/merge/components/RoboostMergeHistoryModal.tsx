import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import {
  ROBOOST_MERGE_HISTORY,
  ROBOOST_UNMERGE,
  ROBOOST_UNMERGE_PREVIEW,
} from '@/roboost-app/merge/graphql/roboostMergeQueries';
import { formatRoboostDate } from '@/roboost-app/utils/formatRoboostDate';
import { Button } from '@/roboost-ui/components/Button';
import { Modal } from '@/roboost-ui/components/Modal';
import { Tag } from '@/roboost-ui/components/Tag';
import { useMutation, useQuery } from '@apollo/client/react';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AppPath } from 'twenty-shared/types';
import { getAppPath, isDefined } from 'twenty-shared/utils';
import { useToast } from 'twenty-ui/components/feedback';

type RoboostMergeHistoryEntry = {
  id: string;
  primaryId: string;
  secondaryId: string;
  primaryName: string | null;
  secondaryName: string | null;
  mergedByName: string | null;
  mergedAt: string;
  isBulk: boolean;
  status: 'MERGED' | 'UNMERGED' | 'EXPIRED';
  unmergedAt: string | null;
  unmergedByName: string | null;
  isUnmergeable: boolean;
  changes: string[];
  movedLinkCount: number;
  segmentCount: number;
};

type RoboostUnmergePreview = {
  mergeId: string;
  isUnmergeable: boolean;
  primaryName: string | null;
  secondaryName: string | null;
  restoredFieldLabels: string[];
  movedLinkCount: number;
  segmentCount: number;
  conflicts: {
    fieldName: string;
    fieldLabel: string;
    currentValue: Record<string, unknown>;
    preMergeValue: Record<string, unknown>;
  }[];
};

type RoboostMergeHistoryModalProps = {
  objectMetadataItem: EnrichedObjectMetadataItem;
  recordId: string;
  recordName: string;
  onClose: () => void;
  onChanged: () => void;
};

const describeColumns = (value: Record<string, unknown>) =>
  Object.values(value)
    .filter((item) => item !== null && item !== '' && item !== undefined)
    .map((item) =>
      typeof item === 'object' ? JSON.stringify(item) : String(item),
    )
    .join(' · ') || '—';

const RoboostUnmergeConfirmModal = ({
  mergeId,
  onClose,
  onDone,
}: {
  mergeId: string;
  onClose: () => void;
  onDone: () => void;
}) => {
  const { t } = useLingui();
  const { enqueueToast } = useToast();
  const { data } = useQuery<{ roboostUnmergePreview: RoboostUnmergePreview }>(
    ROBOOST_UNMERGE_PREVIEW,
    { variables: { mergeId }, fetchPolicy: 'network-only' },
  );
  const [unmerge] = useMutation(ROBOOST_UNMERGE);
  const [keepCurrent, setKeepCurrent] = useState<Set<string>>(new Set());
  const [isWorking, setIsWorking] = useState(false);
  const preview = data?.roboostUnmergePreview;
  const secondaryName = preview?.secondaryName ?? '';
  const primaryName = preview?.primaryName ?? '';
  const movedLinkCount = preview?.movedLinkCount ?? 0;
  const segmentCount = preview?.segmentCount ?? 0;

  return (
    <Modal
      tone="danger"
      title={t`Unmerge ${secondaryName}?`}
      subtitle={t`${secondaryName} comes back with its own ID and values. Only what came from it moves back; anything added to ${primaryName} after the merge stays there.`}
      width={620}
      onClose={onClose}
      footer={
        <>
          <span className="rb-sp" />
          <Button variant="secondary" onClick={onClose}>
            {t`Cancel`}
          </Button>
          <Button
            variant="primary"
            tone="danger"
            disabled={
              !isDefined(preview) || !preview.isUnmergeable || isWorking
            }
            onClick={async () => {
              setIsWorking(true);
              try {
                await unmerge({
                  variables: {
                    mergeId,
                    keepCurrentFieldNames: [...keepCurrent],
                  },
                });
                enqueueToast({
                  status: 'success',
                  children: t`${secondaryName} was unmerged`,
                });
                onDone();
              } catch (error) {
                enqueueToast({
                  status: 'error',
                  children:
                    error instanceof Error ? error.message : String(error),
                });
              } finally {
                setIsWorking(false);
              }
            }}
          >
            {t`Unmerge`}
          </Button>
        </>
      }
    >
      {isDefined(preview) && (
        <div className="rb-mh-confirm">
          <ul className="rb-mh-list">
            <li>{t`${secondaryName} is restored from the trash`}</li>
            <li>
              {t`${movedLinkCount} associations and activities move back to it`}
            </li>
            {preview.restoredFieldLabels.length > 0 && (
              <li>
                {t`On ${primaryName}, these values go back to before the merge:`}{' '}
                {preview.restoredFieldLabels.join(', ')}
              </li>
            )}
            {segmentCount > 0 && (
              <li>{t`${segmentCount} segment memberships added by the merge are removed`}</li>
            )}
          </ul>
          {preview.conflicts.length > 0 && (
            <div className="rb-mh-conflicts">
              <div className="rb-mg-section-title">
                {t`Edited after the merge`}
              </div>
              <p className="rb-ut-hint">
                {t`Someone changed these fields after the merge. Choose what to keep.`}
              </p>
              {preview.conflicts.map((conflict) => {
                const isKept = keepCurrent.has(conflict.fieldName);
                const toggle = (keep: boolean) =>
                  setKeepCurrent((current) => {
                    const next = new Set(current);

                    if (keep) {
                      next.add(conflict.fieldName);
                    } else {
                      next.delete(conflict.fieldName);
                    }

                    return next;
                  });

                return (
                  <div key={conflict.fieldName} className="rb-mh-conflict">
                    <div className="rb-mh-conflict-label">
                      {conflict.fieldLabel}
                    </div>
                    <label className="rb-mg-conflict-option">
                      <input
                        type="radio"
                        name={`rb-mh-${conflict.fieldName}`}
                        checked={isKept}
                        onChange={() => toggle(true)}
                      />
                      <span>
                        {t`Keep the current value`}:{' '}
                        <b>{describeColumns(conflict.currentValue)}</b>
                      </span>
                    </label>
                    <label className="rb-mg-conflict-option">
                      <input
                        type="radio"
                        name={`rb-mh-${conflict.fieldName}`}
                        checked={!isKept}
                        onChange={() => toggle(false)}
                      />
                      <span>
                        {t`Restore the pre-merge value`}:{' '}
                        <b>{describeColumns(conflict.preMergeValue)}</b>
                      </span>
                    </label>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};

// Actions > Merge history: who merged what into this record, and Unmerge for admins within 30 days
export const RoboostMergeHistoryModal = ({
  objectMetadataItem,
  recordId,
  recordName,
  onClose,
  onChanged,
}: RoboostMergeHistoryModalProps) => {
  const { t } = useLingui();
  const { data, loading, refetch } = useQuery<{
    roboostMergeHistory: {
      canUnmerge: boolean;
      merges: RoboostMergeHistoryEntry[];
    };
  }>(ROBOOST_MERGE_HISTORY, {
    variables: { objectName: objectMetadataItem.nameSingular, recordId },
    fetchPolicy: 'network-only',
  });
  const [unmergeId, setUnmergeId] = useState<string | null>(null);
  const merges = data?.roboostMergeHistory.merges ?? [];
  const canUnmerge = data?.roboostMergeHistory.canUnmerge === true;
  const recordPath = (id: string) =>
    getAppPath(AppPath.RecordShowPage, {
      objectNameSingular: objectMetadataItem.nameSingular,
      objectRecordId: id,
    });
  const statusLabel = {
    MERGED: t`Merged`,
    UNMERGED: t`Unmerged`,
    EXPIRED: t`Merged (final)`,
  };

  return (
    <>
      <Modal
        title={t`Merge history: ${recordName}`}
        width={720}
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
        <div className="rb-mh">
          {merges.map((merge) => {
            const otherName =
              merge.primaryId === recordId
                ? (merge.secondaryName ?? merge.secondaryId)
                : (merge.primaryName ?? merge.primaryId);
            const otherId =
              merge.primaryId === recordId
                ? merge.secondaryId
                : merge.primaryId;
            const byName = merge.mergedByName ?? t`someone`;
            const changeCount = merge.changes.length;
            const linkCount = merge.movedLinkCount;

            return (
              <div key={merge.id} className="rb-mh-item">
                <div className="rb-mh-item-head">
                  <span className="rb-mh-item-title">
                    {merge.primaryId === recordId
                      ? t`${otherName} was merged into this record`
                      : t`This record was merged into ${otherName}`}
                  </span>
                  <Tag
                    tone={merge.status === 'UNMERGED' ? 'warning' : undefined}
                  >
                    {statusLabel[merge.status]}
                  </Tag>
                  {merge.isBulk && <Tag>{t`Bulk`}</Tag>}
                  <span className="rb-sp" />
                  {canUnmerge && merge.isUnmergeable && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setUnmergeId(merge.id)}
                    >
                      {t`Unmerge`}
                    </Button>
                  )}
                </div>
                <div className="rb-dt-muted">
                  {t`by ${byName}`} · {formatRoboostDate(merge.mergedAt)}
                  {merge.status === 'UNMERGED' &&
                    isDefined(merge.unmergedAt) &&
                    ` · ${t`unmerged`} ${formatRoboostDate(merge.unmergedAt)}`}
                </div>
                <div className="rb-mh-item-body">
                  {changeCount > 0 && (
                    <span>
                      {t`${changeCount} values changed`}:{' '}
                      {merge.changes.join(', ')}
                    </span>
                  )}
                  <span>{t`${linkCount} associations and activities moved`}</span>
                  {merge.status !== 'EXPIRED' && (
                    <Link className="rb-link" to={recordPath(otherId)}>
                      {t`Open ${otherName}`}
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
          {!loading && merges.length === 0 && (
            <div className="rb-dt-empty">{t`This record has no merges.`}</div>
          )}
        </div>
      </Modal>
      {isDefined(unmergeId) && (
        <RoboostUnmergeConfirmModal
          mergeId={unmergeId}
          onClose={() => setUnmergeId(null)}
          onDone={() => {
            setUnmergeId(null);
            refetch();
            onChanged();
          }}
        />
      )}
    </>
  );
};
