import { ROBOOST_EXPORTS } from '@/roboost-app/data-transfer/graphql/roboostDataTransferQueries';
import { useRoboostDownloadTransferFile } from '@/roboost-app/data-transfer/hooks/useRoboostDownloadTransferFile';
import { formatRoboostDateTime } from '@/roboost-app/utils/formatRoboostDateTime';
import { Button } from '@/roboost-ui/components/Button';
import { Icon } from '@/roboost-ui/components/Icon';
import { Input } from '@/roboost-ui/components/Input';
import { cx } from '@/roboost-ui/utils/cx';
import { useQuery } from '@apollo/client/react';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { useDebounce } from 'use-debounce';

const PAGE_SIZE = 20;

type RoboostExportRow = {
  id: string;
  name: string;
  source: string;
  recordCount: number;
  userName: string | null;
  userEmail: string | null;
  isAvailable: boolean;
  createdAt: string;
};

export const RoboostExportAuditSection = ({
  highlightedId,
}: {
  highlightedId: string | null;
}) => {
  const { t } = useLingui();
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebounce(search, 300);
  const [sortDirection, setSortDirection] = useState<'ASC' | 'DESC'>('DESC');
  const [page, setPage] = useState(1);
  const { downloadExport } = useRoboostDownloadTransferFile();
  const { data, loading } = useQuery<{
    roboostExports: { items: RoboostExportRow[]; total: number };
  }>(ROBOOST_EXPORTS, {
    variables: {
      search: debouncedSearch,
      sortDirection,
      page,
      pageSize: PAGE_SIZE,
    },
    fetchPolicy: 'cache-and-network',
  });
  const items = data?.roboostExports.items ?? [];
  const total = data?.roboostExports.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="rb-dt-card">
      <div className="rb-dt-card-head">
        <div>
          <h3 className="rb-dt-title">{t`Export audit`}</h3>
          <p className="rb-dt-sub">{t`Every export from the CRM. Files can be downloaded again for 30 days.`}</p>
        </div>
        <Input
          variant="search"
          size="sm"
          placeholder={t`Search exports`}
          aria-label={t`Search exports`}
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
        />
      </div>
      <div className="rb-dt-table-wrap">
        <table className="rb-dt-table">
          <thead>
            <tr>
              <th>{t`Name`}</th>
              <th>{t`Source`}</th>
              <th className="is-number">{t`Exported records`}</th>
              <th>{t`User`}</th>
              <th>
                <button
                  type="button"
                  className="rb-dt-sort"
                  onClick={() =>
                    setSortDirection(sortDirection === 'DESC' ? 'ASC' : 'DESC')
                  }
                >
                  {t`Date`}
                  <Icon
                    name={sortDirection === 'DESC' ? 'arrow-down' : 'arrow-up'}
                    size={12}
                  />
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((row) => (
              <tr
                key={row.id}
                className={cx(row.id === highlightedId && 'is-highlighted')}
              >
                <td>
                  <div className="rb-dt-name">{row.name}</div>
                  {row.isAvailable ? (
                    <button
                      type="button"
                      className="rb-dt-status is-ok rb-link"
                      onClick={() => downloadExport(row.id)}
                    >
                      <span className="rb-dt-dot" />
                      {t`Download available`}
                    </button>
                  ) : (
                    <span className="rb-dt-status is-muted">
                      <span className="rb-dt-dot" />
                      {t`Expired`}
                    </span>
                  )}
                </td>
                <td>{row.source}</td>
                <td className="is-number">
                  {row.recordCount.toLocaleString('en-US')}
                </td>
                <td>
                  <div>{row.userName}</div>
                  <div className="rb-dt-muted">{row.userEmail}</div>
                </td>
                <td>{formatRoboostDateTime(row.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && items.length === 0 && (
          <div className="rb-dt-empty">{t`No exports yet.`}</div>
        )}
      </div>
      <div className="rb-dt-pager">
        <span className="rb-dt-muted">{t`${total} exports`}</span>
        <Button
          size="sm"
          variant="secondary"
          disabled={page <= 1}
          onClick={() => setPage(page - 1)}
        >
          {t`Prev`}
        </Button>
        <span>{t`${page} of ${pageCount}`}</span>
        <Button
          size="sm"
          variant="secondary"
          disabled={page >= pageCount}
          onClick={() => setPage(page + 1)}
        >
          {t`Next`}
        </Button>
      </div>
    </div>
  );
};
