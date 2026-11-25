import { ROBOOST_MERGED_INTO } from '@/roboost-app/merge/graphql/roboostMergeQueries';
import { Icon } from '@/roboost-ui/components/Icon';
import { useQuery } from '@apollo/client/react';
import { useLingui } from '@lingui/react/macro';
import { Navigate, useSearchParams } from 'react-router-dom';
import { AppPath } from 'twenty-shared/types';
import { getAppPath, isDefined } from 'twenty-shared/utils';

type RoboostMergedRecordRedirectProps = {
  objectNameSingular: string;
  recordId: string;
  fallback: React.ReactNode;
};

// A merged record's old URL opens the record it was merged into
export const RoboostMergedRecordRedirect = ({
  objectNameSingular,
  recordId,
  fallback,
}: RoboostMergedRecordRedirectProps) => {
  const { data, loading } = useQuery<{
    roboostMergedInto: { primaryId: string; primaryName: string | null } | null;
  }>(ROBOOST_MERGED_INTO, {
    variables: { objectName: objectNameSingular, recordId },
    fetchPolicy: 'network-only',
  });
  const target = data?.roboostMergedInto;

  if (loading) {
    return null;
  }

  if (!isDefined(target)) {
    return <>{fallback}</>;
  }

  return (
    <Navigate
      replace
      to={`${getAppPath(AppPath.RecordShowPage, {
        objectNameSingular,
        objectRecordId: target.primaryId,
      })}?mergedFrom=${encodeURIComponent(recordId)}`}
    />
  );
};

export const RoboostMergedRecordNotice = () => {
  const { t } = useLingui();
  const [searchParams, setSearchParams] = useSearchParams();

  if (!isDefined(searchParams.get('mergedFrom'))) {
    return null;
  }

  return (
    <div className="rb-mg-notice">
      <Icon name="merge" size={14} />
      <span>{t`The record you opened was merged into this one.`}</span>
      <button
        type="button"
        className="rb-mg-notice-close"
        aria-label={t`Dismiss`}
        onClick={() => {
          searchParams.delete('mergedFrom');
          setSearchParams(searchParams, { replace: true });
        }}
      >
        <Icon name="x" size={12} />
      </button>
    </div>
  );
};
