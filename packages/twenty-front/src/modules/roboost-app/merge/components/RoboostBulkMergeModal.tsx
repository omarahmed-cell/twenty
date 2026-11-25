import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import {
  ROBOOST_BULK_MERGE_PREVIEW,
  ROBOOST_START_BULK_MERGE,
} from '@/roboost-app/merge/graphql/roboostDuplicateQueries';
import { type RoboostBulkMergePair } from '@/roboost-app/merge/types/RoboostDuplicate';
import { Button } from '@/roboost-ui/components/Button';
import { Checkbox } from '@/roboost-ui/components/Checkbox';
import { Modal } from '@/roboost-ui/components/Modal';
import { useMutation, useQuery } from '@apollo/client/react';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { isDefined } from 'twenty-shared/utils';
import { useToast } from 'twenty-ui/components/feedback';

type RoboostBulkMergeModalProps = {
  objectMetadataItem: EnrichedObjectMetadataItem;
  onClose: () => void;
  onStarted: (bulkMergeId: string) => void;
};

// Preview first: every exact pair with the record that will survive, then a background run
export const RoboostBulkMergeModal = ({
  objectMetadataItem,
  onClose,
  onStarted,
}: RoboostBulkMergeModalProps) => {
  const { t } = useLingui();
  const { enqueueToast } = useToast();
  const { data, loading } = useQuery<{
    roboostBulkMergePreview: RoboostBulkMergePair[];
  }>(ROBOOST_BULK_MERGE_PREVIEW, {
    variables: { objectName: objectMetadataItem.nameSingular, pairIds: null },
    fetchPolicy: 'network-only',
  });
  const [startBulkMerge] = useMutation<{ roboostStartBulkMerge: string }>(
    ROBOOST_START_BULK_MERGE,
  );
  const [excludedIds, setExcludedIds] = useState<Set<string>>(new Set());
  const [isStarting, setIsStarting] = useState(false);
  const pairs = data?.roboostBulkMergePreview ?? [];
  const selectedPairs = pairs.filter((pair) => !excludedIds.has(pair.pairId));
  const selectedCount = selectedPairs.length;
  const labelPlural = objectMetadataItem.labelPlural.toLowerCase();

  const toggle = (pairId: string, isChecked: boolean) =>
    setExcludedIds((current) => {
      const next = new Set(current);

      if (isChecked) {
        next.delete(pairId);
      } else {
        next.add(pairId);
      }

      return next;
    });

  const start = async () => {
    setIsStarting(true);
    try {
      const result = await startBulkMerge({
        variables: {
          objectName: objectMetadataItem.nameSingular,
          objectNamePlural: objectMetadataItem.namePlural,
          pairIds: selectedPairs.map((pair) => pair.pairId),
        },
      });
      const bulkMergeId = result.data?.roboostStartBulkMerge;

      if (isDefined(bulkMergeId)) {
        enqueueToast({
          status: 'success',
          children: t`Bulk merge started. You'll get a notification when it's done.`,
        });
        onStarted(bulkMergeId);
      }
    } catch (error) {
      enqueueToast({
        status: 'error',
        children: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <Modal
      title={t`Bulk merge exact duplicates`}
      subtitle={t`Only exact pairs are included. The record with the most filled-in properties survives (the oldest on a tie); the other record's values fill its empty properties. Each merge can be undone from Merge history for 30 days.`}
      width={860}
      onClose={onClose}
      footer={
        <>
          <span className="rb-dt-muted">
            {t`${selectedCount} pairs selected`}
          </span>
          <span className="rb-sp" />
          <Button variant="secondary" onClick={onClose}>
            {t`Cancel`}
          </Button>
          <Button
            variant="primary"
            disabled={selectedCount === 0 || isStarting}
            onClick={start}
          >
            {t`Merge ${selectedCount} pairs`}
          </Button>
        </>
      }
    >
      <div className="rb-dq-table rb-dq-bulk-table">
        <div className="rb-dq-thead">
          <span />
          <span>{t`Survives (primary)`}</span>
          <span>{t`Fades away (secondary)`}</span>
        </div>
        {pairs.map((pair) => (
          <label key={pair.pairId} className="rb-dq-trow">
            <Checkbox
              checked={!excludedIds.has(pair.pairId)}
              onChange={(isChecked) => toggle(pair.pairId, isChecked)}
              aria-label={t`Include ${pair.secondaryName}`}
            />
            <span className="rb-dq-strong">{pair.primaryName}</span>
            <span>{pair.secondaryName}</span>
          </label>
        ))}
        {!loading && pairs.length === 0 && (
          <div className="rb-dt-empty">
            {t`No exact duplicate ${labelPlural} to merge.`}
          </div>
        )}
      </div>
    </Modal>
  );
};
