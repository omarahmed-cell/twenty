import { getRoboostNoPermissionAttribute } from '@/roboost-ui/utils/getRoboostNoPermissionAttributes';
import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { RoboostManageDuplicatesModal } from '@/roboost-app/merge/components/RoboostManageDuplicatesModal';
import { ROBOOST_DUPLICATE_OVERVIEW } from '@/roboost-app/merge/graphql/roboostDuplicateQueries';
import { type RoboostDuplicateOverview } from '@/roboost-app/merge/types/RoboostDuplicate';
import { useQuery } from '@apollo/client/react';
import { useLingui } from '@lingui/react/macro';
import { useSearchParams } from 'react-router-dom';
import { ROBOOST_MERGE_OBJECT_NAMES } from 'twenty-shared/constants';

type RoboostDataQualityButtonProps = {
  objectMetadataItem: EnrichedObjectMetadataItem;
  onRecordsChanged: () => void;
};

// Shown to users with Merge on the object; ?duplicates=open (and &bulk=<id> from the bell) opens the panel
export const RoboostDataQualityButton = ({
  objectMetadataItem,
  onRecordsChanged,
}: RoboostDataQualityButtonProps) => {
  const { t } = useLingui();
  const [searchParams, setSearchParams] = useSearchParams();
  const isMergeObject = (
    ROBOOST_MERGE_OBJECT_NAMES as readonly string[]
  ).includes(objectMetadataItem.nameSingular);
  const { data, refetch } = useQuery<{
    roboostDuplicateOverview: RoboostDuplicateOverview;
  }>(ROBOOST_DUPLICATE_OVERVIEW, {
    variables: { objectName: objectMetadataItem.nameSingular },
    skip: !isMergeObject,
    fetchPolicy: 'cache-and-network',
  });
  const overview = data?.roboostDuplicateOverview;

  if (!isMergeObject || overview?.isAvailable !== true) {
    return null;
  }

  const canMerge = overview.mergeScope !== 'NONE';

  const isOpen = searchParams.get('duplicates') === 'open';
  const openCount = overview.openCount;

  const setOpen = (open: boolean) =>
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);

        if (open) {
          next.set('duplicates', 'open');
        } else {
          next.delete('duplicates');
          next.delete('bulk');
        }

        return next;
      },
      { replace: true },
    );

  return (
    <>
      <button
        type="button"
        className="rb-hbtn rb-hbtn-ghost"
        data-rb-no-permission={getRoboostNoPermissionAttribute(canMerge)}
        aria-disabled={canMerge ? undefined : true}
        onClick={() => setOpen(true)}
      >
        {t`Data quality`}
        {canMerge && openCount > 0 && (
          <span
            className="rb-dq-badge"
            aria-label={t`${openCount} possible duplicate pairs`}
          >
            {openCount > 99 ? '99+' : openCount}
          </span>
        )}
      </button>
      {isOpen && canMerge && (
        <RoboostManageDuplicatesModal
          objectMetadataItem={objectMetadataItem}
          initialBulkMergeId={searchParams.get('bulk')}
          onClose={() => {
            setOpen(false);
            refetch();
          }}
          onRecordsChanged={onRecordsChanged}
        />
      )}
    </>
  );
};
