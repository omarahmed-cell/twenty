import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { RoboostBulkMergeModal } from '@/roboost-app/merge/components/RoboostBulkMergeModal';
import { RoboostMergeModal } from '@/roboost-app/merge/components/RoboostMergeModal';
import {
  ROBOOST_BULK_MERGES,
  ROBOOST_DUPLICATE_OVERVIEW,
  ROBOOST_DUPLICATE_PAIRS,
  ROBOOST_MERGE_HISTORY_CSV,
  ROBOOST_SCAN_DUPLICATES,
  ROBOOST_SET_DUPLICATE_PAIR_REJECTED,
} from '@/roboost-app/merge/graphql/roboostDuplicateQueries';
import {
  type RoboostBulkMergeRun,
  type RoboostDuplicateOverview,
  type RoboostDuplicatePair,
} from '@/roboost-app/merge/types/RoboostDuplicate';
import { formatRoboostDateTime } from '@/roboost-app/utils/formatRoboostDateTime';
import { Button } from '@/roboost-ui/components/Button';
import { Input } from '@/roboost-ui/components/Input';
import { Modal } from '@/roboost-ui/components/Modal';
import { Select } from '@/roboost-ui/components/Select';
import { Tabs } from '@/roboost-ui/components/Tabs';
import { Tag } from '@/roboost-ui/components/Tag';
import { type RoboostTone } from '@/roboost-ui/types/RoboostTone';
import { useApolloClient, useMutation, useQuery } from '@apollo/client/react';
import { useLingui } from '@lingui/react/macro';
import { saveAs } from 'file-saver';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ROBOOST_DUPLICATE_CONFIDENCE_RANK,
  ROBOOST_DUPLICATE_RULES,
  type RoboostDuplicateConfidence,
} from 'twenty-shared/constants';
import { AppPath } from 'twenty-shared/types';
import { getAppPath, isDefined } from 'twenty-shared/utils';
import { useToast } from 'twenty-ui/components/feedback';

type RoboostManageDuplicatesModalProps = {
  objectMetadataItem: EnrichedObjectMetadataItem;
  initialBulkMergeId: string | null;
  onClose: () => void;
  onRecordsChanged: () => void;
};

type TabId = 'open' | 'rejected' | 'bulk';
type SortId = 'newest' | 'oldest' | 'confidence';

const CONFIDENCE_TONE: Record<RoboostDuplicateConfidence, RoboostTone> = {
  EXACT: 'danger',
  HIGH: 'warning',
  POSSIBLE: 'neutral',
};

const RULE_LABEL_BY_KEY = new Map<string, string>(
  ROBOOST_DUPLICATE_RULES.map((rule) => [rule.key, rule.label]),
);

const RoboostBulkMergeRunCard = ({ run }: { run: RoboostBulkMergeRun }) => {
  const { t } = useLingui();
  const [isOpen, setIsOpen] = useState(false);
  const handled = run.results.length;
  const percent =
    run.total === 0 ? 100 : Math.round((handled / run.total) * 100);
  const mergedCount = run.results.filter(
    (result) => result.status === 'MERGED',
  ).length;
  const failedCount = run.failedCount;
  const total = run.total;
  const byName = run.startedByName ?? t`someone`;
  const statusLabel =
    run.status === 'RUNNING'
      ? t`Running`
      : run.status === 'FAILED'
        ? t`Stopped`
        : t`Done`;

  return (
    <div className="rb-mh-item">
      <div className="rb-mh-item-head">
        <span className="rb-mh-item-title">
          {t`${mergedCount} of ${total} pairs merged`}
        </span>
        <Tag
          tone={
            run.status === 'RUNNING'
              ? 'info'
              : run.status === 'FAILED' || failedCount > 0
                ? 'warning'
                : 'success'
          }
        >
          {statusLabel}
        </Tag>
        <span className="rb-sp" />
        <Button variant="ghost" size="sm" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? t`Hide log` : t`Show log`}
        </Button>
      </div>
      <div className="rb-dq-progress" aria-label={t`${percent}% done`}>
        <span style={{ width: `${percent}%` }} />
      </div>
      <div className="rb-dt-muted">
        {t`Started by ${byName}`} · {formatRoboostDateTime(run.startedAt)}
        {failedCount > 0 && ` · ${t`${failedCount} failed`}`}
      </div>
      {isOpen && (
        <div className="rb-dq-log">
          {run.pairs.map((pair) => {
            const result = run.results.find(
              (entry) => entry.pairId === pair.pairId,
            );
            const resultLabel = !isDefined(result)
              ? t`Waiting`
              : result.status === 'MERGED'
                ? t`Merged`
                : result.status === 'SKIPPED'
                  ? t`Skipped`
                  : t`Failed`;

            return (
              <div key={pair.pairId} className="rb-dq-log-row">
                <span>
                  {pair.secondaryName} → <b>{pair.primaryName}</b>
                </span>
                <span className="rb-sp" />
                <span
                  className={
                    result?.status === 'FAILED' ? 'rb-dq-failed' : 'rb-dt-muted'
                  }
                >
                  {resultLabel}
                  {isDefined(result?.message) && `: ${result.message}`}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// List > Data quality: duplicate pairs from the nightly scan, Not duplicates, Review & merge and bulk merge
export const RoboostManageDuplicatesModal = ({
  objectMetadataItem,
  initialBulkMergeId,
  onClose,
  onRecordsChanged,
}: RoboostManageDuplicatesModalProps) => {
  const { t } = useLingui();
  const { enqueueToast } = useToast();
  const client = useApolloClient();
  const objectName = objectMetadataItem.nameSingular;
  const [tab, setTab] = useState<TabId>(
    isDefined(initialBulkMergeId) ? 'bulk' : 'open',
  );
  const [confidenceFilter, setConfidenceFilter] = useState('');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortId>('confidence');
  const [reviewPair, setReviewPair] = useState<RoboostDuplicatePair | null>(
    null,
  );
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  const { data: overviewData, refetch: refetchOverview } = useQuery<{
    roboostDuplicateOverview: RoboostDuplicateOverview;
  }>(ROBOOST_DUPLICATE_OVERVIEW, {
    variables: { objectName },
    fetchPolicy: 'network-only',
  });
  const {
    data: pairsData,
    loading: isLoadingPairs,
    refetch: refetchPairs,
  } = useQuery<{ roboostDuplicatePairs: RoboostDuplicatePair[] }>(
    ROBOOST_DUPLICATE_PAIRS,
    {
      variables: {
        objectName,
        status: tab === 'rejected' ? 'REJECTED' : 'OPEN',
      },
      fetchPolicy: 'network-only',
      skip: tab === 'bulk',
    },
  );
  const { data: bulkData, refetch: refetchBulk } = useQuery<{
    roboostBulkMerges: RoboostBulkMergeRun[];
  }>(ROBOOST_BULK_MERGES, {
    variables: { objectName },
    fetchPolicy: 'network-only',
    skip: tab !== 'bulk',
    pollInterval: 2000,
  });
  const [scanDuplicates] = useMutation<{ roboostScanDuplicates: number }>(
    ROBOOST_SCAN_DUPLICATES,
  );
  const [setPairRejected] = useMutation(ROBOOST_SET_DUPLICATE_PAIR_REJECTED);

  const overview = overviewData?.roboostDuplicateOverview;
  const canBulkMerge = overview?.mergeScope === 'ALL';
  const labelPlural = objectMetadataItem.labelPlural.toLowerCase();
  const lastScanAt = overview?.settings.lastScanAt ?? null;

  const pairs = useMemo(() => {
    const term = search.trim().toLowerCase();
    const filtered = (pairsData?.roboostDuplicatePairs ?? []).filter(
      (pair) =>
        (confidenceFilter === '' || pair.confidence === confidenceFilter) &&
        (term === '' ||
          [pair.recordA, pair.recordB].some((record) =>
            `${record.name} ${record.keyText}`.toLowerCase().includes(term),
          )),
    );

    return [...filtered].sort((left, right) => {
      if (sort === 'confidence') {
        return (
          ROBOOST_DUPLICATE_CONFIDENCE_RANK[right.confidence] -
            ROBOOST_DUPLICATE_CONFIDENCE_RANK[left.confidence] ||
          right.detectedAt.localeCompare(left.detectedAt)
        );
      }

      return sort === 'newest'
        ? right.detectedAt.localeCompare(left.detectedAt)
        : left.detectedAt.localeCompare(right.detectedAt);
    });
  }, [pairsData, confidenceFilter, search, sort]);

  const refreshAll = () => {
    refetchOverview();
    if (tab === 'bulk') {
      refetchBulk();
    } else {
      refetchPairs();
    }
  };

  const scanNow = async () => {
    setIsScanning(true);
    try {
      const result = await scanDuplicates({ variables: { objectName } });
      const pairCount = result.data?.roboostScanDuplicates ?? 0;

      enqueueToast({
        status: 'success',
        children: t`Scan finished: ${pairCount} possible duplicate pairs`,
      });
      refreshAll();
    } catch (error) {
      enqueueToast({
        status: 'error',
        children: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setIsScanning(false);
    }
  };

  const setRejected = async (
    pair: RoboostDuplicatePair,
    isRejected: boolean,
  ) => {
    try {
      await setPairRejected({ variables: { pairId: pair.id, isRejected } });
      const nameA = pair.recordA.name;
      const nameB = pair.recordB.name;

      enqueueToast({
        status: 'success',
        children: isRejected
          ? t`${nameA} and ${nameB} marked as not duplicates`
          : t`${nameA} and ${nameB} are back in the duplicates list`,
      });
      refreshAll();
    } catch (error) {
      enqueueToast({
        status: 'error',
        children: error instanceof Error ? error.message : String(error),
      });
    }
  };

  const exportHistory = async () => {
    try {
      const { data } = await client.query<{ roboostMergeHistoryCsv: string }>({
        query: ROBOOST_MERGE_HISTORY_CSV,
        variables: { objectName },
        fetchPolicy: 'network-only',
      });

      saveAs(
        new Blob([data?.roboostMergeHistoryCsv ?? ''], {
          type: 'text/csv;charset=utf-8',
        }),
        `${objectMetadataItem.namePlural}-merge-history.csv`,
      );
    } catch (error) {
      enqueueToast({
        status: 'error',
        children: error instanceof Error ? error.message : String(error),
      });
    }
  };

  const recordLink = (recordId: string, name: string) => (
    <Link
      className="rb-link"
      target="_blank"
      to={getAppPath(AppPath.RecordShowPage, {
        objectNameSingular: objectName,
        objectRecordId: recordId,
      })}
    >
      {name}
    </Link>
  );

  return (
    <>
      <Modal
        title={t`Manage duplicates: ${objectMetadataItem.labelPlural}`}
        subtitle={
          isDefined(lastScanAt)
            ? t`Last scan ${formatRoboostDateTime(lastScanAt)}. The scan runs every night after 00:37 UTC.`
            : t`Not scanned yet. The scan runs every night after 00:37 UTC.`
        }
        width={1080}
        className="rb-dq-modal"
        onClose={onClose}
        footer={
          <>
            {canBulkMerge && (
              <Button variant="ghost" icon="download" onClick={exportHistory}>
                {t`Export merge history`}
              </Button>
            )}
            <span className="rb-sp" />
            <Button variant="secondary" onClick={onClose}>
              {t`Close`}
            </Button>
          </>
        }
      >
        <div className="rb-dq">
          <div className="rb-dq-bar">
            <Tabs
              value={tab}
              onChange={(id) => setTab(id as TabId)}
              tabs={[
                {
                  id: 'open',
                  label: t`Duplicates`,
                  count: overview?.openCount,
                },
                { id: 'rejected', label: t`Not duplicates` },
                { id: 'bulk', label: t`Bulk merges` },
              ]}
            />
            <span className="rb-sp" />
            <Button
              variant="secondary"
              icon="refresh"
              disabled={isScanning}
              onClick={scanNow}
            >
              {isScanning ? t`Scanning…` : t`Scan now`}
            </Button>
            {canBulkMerge && (
              <Button variant="primary" onClick={() => setIsBulkOpen(true)}>
                {t`Bulk merge exact pairs`}
              </Button>
            )}
          </div>

          {tab !== 'bulk' && (
            <div className="rb-dq-filters">
              <Input
                variant="search"
                icon="search"
                size="sm"
                value={search}
                placeholder={t`Search by name, email or domain`}
                aria-label={t`Search duplicates`}
                onChange={(event) => setSearch(event.target.value)}
              />
              <Select
                value={confidenceFilter}
                aria-label={t`Confidence`}
                placeholder={t`All confidence levels`}
                isClearable
                onChange={setConfidenceFilter}
                options={[
                  { value: 'EXACT', label: t`Exact` },
                  { value: 'HIGH', label: t`High` },
                  { value: 'POSSIBLE', label: t`Possible` },
                ]}
              />
              <Select
                value={sort}
                aria-label={t`Sort`}
                onChange={(value) => setSort(value as SortId)}
                options={[
                  { value: 'confidence', label: t`Highest confidence first` },
                  { value: 'newest', label: t`Newest first` },
                  { value: 'oldest', label: t`Oldest first` },
                ]}
              />
            </div>
          )}

          {tab !== 'bulk' && (
            <div className="rb-dq-table">
              <div className="rb-dq-thead rb-dq-pair-grid">
                <span>{t`Record`}</span>
                <span>{t`Possible duplicate`}</span>
                <span>{t`Confidence`}</span>
                <span>{t`Reason`}</span>
                <span>{tab === 'rejected' ? t`Marked` : t`Found`}</span>
                <span />
              </div>
              {pairs.map((pair) => {
                const confidenceLabel = {
                  EXACT: t`Exact`,
                  HIGH: t`High`,
                  POSSIBLE: t`Possible`,
                }[pair.confidence];

                return (
                  <div key={pair.id} className="rb-dq-trow rb-dq-pair-grid">
                    {[pair.recordA, pair.recordB].map((record) => (
                      <span key={record.id} className="rb-dq-record">
                        {recordLink(record.id, record.name)}
                        {record.keyText !== '' && (
                          <span className="rb-dt-muted">{record.keyText}</span>
                        )}
                      </span>
                    ))}
                    <span>
                      <Tag tone={CONFIDENCE_TONE[pair.confidence]}>
                        {confidenceLabel}
                      </Tag>
                    </span>
                    <span className="rb-dq-reason">
                      {pair.reasons
                        .map(
                          (reason) => RULE_LABEL_BY_KEY.get(reason) ?? reason,
                        )
                        .join(', ')}
                    </span>
                    <span className="rb-dt-muted">
                      {formatRoboostDateTime(
                        tab === 'rejected'
                          ? (pair.resolvedAt ?? pair.detectedAt)
                          : pair.detectedAt,
                      )}
                      {tab === 'rejected' &&
                        isDefined(pair.resolvedByName) &&
                        ` · ${pair.resolvedByName}`}
                    </span>
                    <span className="rb-dq-actions">
                      {tab === 'open' ? (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setRejected(pair, true)}
                          >
                            {t`Not duplicates`}
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setReviewPair(pair)}
                          >
                            {t`Review & merge`}
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setRejected(pair, false)}
                        >
                          {t`Undo`}
                        </Button>
                      )}
                    </span>
                  </div>
                );
              })}
              {!isLoadingPairs && pairs.length === 0 && (
                <div className="rb-dt-empty">
                  {tab === 'rejected'
                    ? t`No pairs marked as not duplicates.`
                    : t`No duplicate ${labelPlural} found.`}
                </div>
              )}
            </div>
          )}

          {tab === 'bulk' && (
            <div className="rb-mh">
              {(bulkData?.roboostBulkMerges ?? []).map((run) => (
                <RoboostBulkMergeRunCard key={run.id} run={run} />
              ))}
              {(bulkData?.roboostBulkMerges ?? []).length === 0 && (
                <div className="rb-dt-empty">{t`No bulk merges yet.`}</div>
              )}
            </div>
          )}
        </div>
      </Modal>
      {isDefined(reviewPair) && (
        <RoboostMergeModal
          objectMetadataItem={objectMetadataItem}
          startRecordId={reviewPair.recordA.id}
          initialOtherRecordId={reviewPair.recordB.id}
          onClose={() => setReviewPair(null)}
          onMerged={() => {
            setReviewPair(null);
            refreshAll();
            onRecordsChanged();
          }}
        />
      )}
      {isBulkOpen && (
        <RoboostBulkMergeModal
          objectMetadataItem={objectMetadataItem}
          onClose={() => setIsBulkOpen(false)}
          onStarted={() => {
            setIsBulkOpen(false);
            setTab('bulk');
            refetchOverview();
            onRecordsChanged();
          }}
        />
      )}
    </>
  );
};
