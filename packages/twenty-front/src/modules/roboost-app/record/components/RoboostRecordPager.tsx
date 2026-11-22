import { roboostListNavigationState } from '@/roboost-app/list/states/roboostListNavigationState';
import { Icon } from '@/roboost-ui/components/Icon';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { useLingui } from '@lingui/react/macro';
import { Link } from 'react-router-dom';
import { AppPath } from 'twenty-shared/types';
import { getAppPath, isDefined } from 'twenty-shared/utils';

type RoboostRecordPagerProps = {
  objectNameSingular: string;
  recordId: string;
};

export const RoboostRecordPager = ({
  objectNameSingular,
  recordId,
}: RoboostRecordPagerProps) => {
  const { t } = useLingui();
  const roboostListNavigation = useAtomStateValue(roboostListNavigationState);

  if (roboostListNavigation?.objectNameSingular !== objectNameSingular) {
    return null;
  }
  const { recordIds } = roboostListNavigation;
  const index = recordIds.indexOf(recordId);

  if (index === -1) {
    return null;
  }
  const getPath = (id: string | undefined) =>
    isDefined(id)
      ? getAppPath(AppPath.RecordShowPage, {
          objectNameSingular,
          objectRecordId: id,
        })
      : undefined;
  const previousPath = getPath(recordIds[index - 1]);
  const nextPath = getPath(recordIds[index + 1]);

  return (
    <span className="rb-pager" title={t`${index + 1} of ${recordIds.length}`}>
      {isDefined(previousPath) ? (
        <Link
          className="rb-rc-iconbtn"
          to={previousPath}
          aria-label={t`Previous record`}
        >
          <Icon name="chevron-left" size={14} />
        </Link>
      ) : (
        <span className="rb-rc-iconbtn is-disabled" aria-hidden="true">
          <Icon name="chevron-left" size={14} />
        </span>
      )}
      {isDefined(nextPath) ? (
        <Link
          className="rb-rc-iconbtn"
          to={nextPath}
          aria-label={t`Next record`}
        >
          <Icon name="chevron-right" size={14} />
        </Link>
      ) : (
        <span className="rb-rc-iconbtn is-disabled" aria-hidden="true">
          <Icon name="chevron-right" size={14} />
        </span>
      )}
    </span>
  );
};
