import { RoboostCreateScoreModal } from '@/roboost-app/scoring/components/RoboostCreateScoreModal';
import { RoboostDeleteScoreModal } from '@/roboost-app/scoring/components/RoboostDeleteScoreModal';
import { RoboostScoreActiveConfirmModal } from '@/roboost-app/scoring/components/RoboostScoreActiveConfirmModal';
import {
  ROBOOST_SCORES,
  ROBOOST_SET_SCORE_ACTIVE,
} from '@/roboost-app/scoring/graphql/roboostScoreQueries';
import { useRoboostScoreFieldLabel } from '@/roboost-app/scoring/hooks/useRoboostScoreFieldLabel';
import { useRoboostScoreObjectLabels } from '@/roboost-app/scoring/hooks/useRoboostScoreObjectLabels';
import { type RoboostScore } from '@/roboost-app/scoring/types/RoboostScore';
import { formatRoboostDate } from '@/roboost-app/utils/formatRoboostDate';
import { Button } from '@/roboost-ui/components/Button';
import { Icon } from '@/roboost-ui/components/Icon';
import { Input } from '@/roboost-ui/components/Input';
import { Menu } from '@/roboost-ui/components/Menu';
import { Select } from '@/roboost-ui/components/Select';
import { Toggle } from '@/roboost-ui/components/Toggle';
import { cx } from '@/roboost-ui/utils/cx';
import { useMutation, useQuery } from '@apollo/client/react';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { isDefined, ROBOOST_SCORE_OBJECT_NAMES } from 'twenty-shared/utils';
import { useToast } from 'twenty-ui/components/feedback';

type SortKey =
  | 'name'
  | 'objectName'
  | 'property'
  | 'isActive'
  | 'updatedAt'
  | 'createdAt'
  | 'createdByName';

export const RoboostScoringPage = () => {
  const { t } = useLingui();
  const navigate = useNavigate();
  const { enqueueToast } = useToast();
  const objectLabels = useRoboostScoreObjectLabels();
  const getFieldLabel = useRoboostScoreFieldLabel();
  const { data, loading, refetch } = useQuery<{
    roboostScores: RoboostScore[];
    roboostScoringCanEdit: boolean;
  }>(ROBOOST_SCORES, { fetchPolicy: 'cache-and-network' });
  const [setScoreActive] = useMutation(ROBOOST_SET_SCORE_ACTIVE);
  const [search, setSearch] = useState('');
  const [objectFilter, setObjectFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sort, setSort] = useState<{ key: SortKey; isAscending: boolean }>({
    key: 'updatedAt',
    isAscending: false,
  });
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [cloneSource, setCloneSource] = useState<RoboostScore | null>(null);
  const [scoreToDelete, setScoreToDelete] = useState<RoboostScore | null>(null);
  const [scoreToToggle, setScoreToToggle] = useState<RoboostScore | null>(null);
  const canEdit = data?.roboostScoringCanEdit === true;
  const scores = data?.roboostScores ?? [];
  const propertyLabelOf = (score: RoboostScore) =>
    getFieldLabel(score.objectName, score.linkedFieldMetadataId);
  const term = search.trim().toLowerCase();

  const sortValue = (score: RoboostScore, key: SortKey): string | number => {
    switch (key) {
      case 'objectName':
        return objectLabels[score.objectName].plural;
      case 'property':
        return propertyLabelOf(score) ?? '';
      case 'isActive':
        return score.isActive ? 1 : 0;
      case 'createdByName':
        return score.createdByName ?? '';
      default:
        return score[key];
    }
  };

  const visibleScores = scores
    .filter(
      (score) =>
        (term === '' ||
          score.name.toLowerCase().includes(term) ||
          (propertyLabelOf(score) ?? '').toLowerCase().includes(term)) &&
        (objectFilter === '' || score.objectName === objectFilter) &&
        (statusFilter === '' || (statusFilter === 'on') === score.isActive),
    )
    .sort((first, second) => {
      const firstValue = sortValue(first, sort.key);
      const secondValue = sortValue(second, sort.key);
      const order =
        typeof firstValue === 'number' && typeof secondValue === 'number'
          ? firstValue - secondValue
          : String(firstValue).localeCompare(String(secondValue));

      return sort.isAscending ? order : -order;
    });

  const columns: { key: SortKey; label: string }[] = [
    { key: 'name', label: t`Name` },
    { key: 'objectName', label: t`Scored object` },
    { key: 'property', label: t`Score property` },
    { key: 'isActive', label: t`On / Off` },
    { key: 'updatedAt', label: t`Last updated` },
    { key: 'createdAt', label: t`Created at` },
    { key: 'createdByName', label: t`Created by` },
  ];

  const scoreCount = scores.length;

  return (
    <div className="rb-list-page rb-sc-page">
      <div className="rb-page-head">
        <div>
          <div className="rb-ph-title">{t`Scoring`}</div>
          <div className="rb-ph-sub">
            {loading && scoreCount === 0
              ? t`Loading scores`
              : scoreCount === 1
                ? t`1 score`
                : t`${scoreCount} scores`}
          </div>
        </div>
        <span className="rb-sp" />
        <button
          type="button"
          className="rb-hbtn rb-hbtn-accent"
          disabled={!canEdit}
          title={
            canEdit ? undefined : t`Only workspace admins can create scores`
          }
          onClick={() => setIsCreateOpen(true)}
        >
          <Icon name="plus" size={14} strokeWidth={2} />
          {t`Create score`}
        </button>
      </div>
      <div className="rb-dt-card rb-sc-card">
        <div className="rb-dt-filters">
          <Input
            variant="search"
            size="sm"
            placeholder={t`Search scores`}
            aria-label={t`Search scores`}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <Select
            aria-label={t`Scored object`}
            placeholder={t`Scored object: All`}
            value={objectFilter}
            isClearable
            options={ROBOOST_SCORE_OBJECT_NAMES.map((objectName) => ({
              value: objectName,
              label: objectLabels[objectName].plural,
            }))}
            onChange={setObjectFilter}
          />
          <Select
            aria-label={t`Status`}
            placeholder={t`Status: All`}
            value={statusFilter}
            isClearable
            options={[
              { value: 'on', label: t`On` },
              { value: 'off', label: t`Off` },
            ]}
            onChange={setStatusFilter}
          />
        </div>
        <div className="rb-dt-table-wrap">
          <table className="rb-dt-table rb-sc-table">
            <thead>
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    aria-sort={
                      sort.key === column.key
                        ? sort.isAscending
                          ? 'ascending'
                          : 'descending'
                        : undefined
                    }
                  >
                    <button
                      type="button"
                      className="rb-dt-sort"
                      onClick={() =>
                        setSort((current) => ({
                          key: column.key,
                          isAscending:
                            current.key === column.key
                              ? !current.isAscending
                              : true,
                        }))
                      }
                    >
                      {column.label}
                      {sort.key === column.key && (
                        <Icon
                          name={sort.isAscending ? 'arrow-up' : 'arrow-down'}
                          size={12}
                        />
                      )}
                    </button>
                  </th>
                ))}
                <th aria-label={t`Actions`} />
              </tr>
            </thead>
            <tbody>
              {visibleScores.map((score) => (
                <tr key={score.id}>
                  <td>
                    <Link className="rb-sc-name" to={`/scoring/${score.id}`}>
                      <span className="rb-truncate">{score.name}</span>
                    </Link>
                    {score.hasDraftChanges &&
                      isDefined(score.publishedVersionNumber) && (
                        <span className="rb-sc-badge">{t`Draft changes`}</span>
                      )}
                    {!isDefined(score.publishedVersionNumber) && (
                      <span className="rb-sc-badge">{t`Not created yet`}</span>
                    )}
                  </td>
                  <td>{objectLabels[score.objectName].singular}</td>
                  <td>{propertyLabelOf(score) ?? '—'}</td>
                  <td>
                    <span className="rb-sc-status">
                      <Toggle
                        aria-label={score.isActive ? t`Turn off` : t`Turn on`}
                        checked={score.isActive}
                        disabled={
                          !canEdit || !isDefined(score.publishedVersionNumber)
                        }
                        onChange={() => setScoreToToggle(score)}
                      />
                      <span className={cx(score.isActive && 'is-on')}>
                        {score.isActive ? t`On` : t`Off`}
                      </span>
                    </span>
                  </td>
                  <td>
                    <div>{formatRoboostDate(score.updatedAt)}</div>
                    {isDefined(score.updatedByName) && (
                      <div className="rb-dt-muted">
                        {t`by ${score.updatedByName}`}
                      </div>
                    )}
                  </td>
                  <td>{formatRoboostDate(score.createdAt)}</td>
                  <td>{score.createdByName ?? '—'}</td>
                  <td className="rb-sc-actions">
                    <Menu
                      align="right"
                      minWidth={160}
                      entries={[
                        {
                          id: 'edit',
                          label: canEdit ? t`Edit` : t`View`,
                          icon: canEdit ? 'pencil' : 'eye',
                          onSelect: () => navigate(`/scoring/${score.id}`),
                        },
                        {
                          id: 'clone',
                          label: t`Clone`,
                          icon: 'copy',
                          isDisabled: !canEdit,
                          onSelect: () => setCloneSource(score),
                        },
                        {
                          id: 'delete',
                          label: t`Delete`,
                          icon: 'trash',
                          isDanger: true,
                          isDisabled: !canEdit,
                          onSelect: () => setScoreToDelete(score),
                        },
                      ]}
                      trigger={({ toggle, isOpen }) => (
                        <Button
                          variant="ghost"
                          size="sm"
                          iconOnly
                          icon="more"
                          aria-label={t`Score actions`}
                          aria-expanded={isOpen}
                          onClick={toggle}
                        />
                      )}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {visibleScores.length === 0 && !loading && (
            <div className="rb-dt-empty">
              {scoreCount === 0
                ? t`No scores yet. Create one to rate contacts, companies or deals.`
                : t`No scores match.`}
            </div>
          )}
        </div>
      </div>
      {(isCreateOpen || isDefined(cloneSource)) && (
        <RoboostCreateScoreModal
          cloneSource={cloneSource ?? undefined}
          onClose={() => {
            setIsCreateOpen(false);
            setCloneSource(null);
          }}
          onCreated={(score) => {
            setIsCreateOpen(false);
            setCloneSource(null);
            navigate(`/scoring/${score.id}`);
          }}
        />
      )}
      {isDefined(scoreToDelete) && (
        <RoboostDeleteScoreModal
          score={scoreToDelete}
          propertyLabel={propertyLabelOf(scoreToDelete)}
          onClose={() => setScoreToDelete(null)}
          onDeleted={() => {
            setScoreToDelete(null);
            refetch();
            enqueueToast({ status: 'success', children: t`Score deleted` });
          }}
        />
      )}
      {isDefined(scoreToToggle) && (
        <RoboostScoreActiveConfirmModal
          scoreName={scoreToToggle.name}
          nextIsActive={!scoreToToggle.isActive}
          onClose={() => setScoreToToggle(null)}
          onConfirm={async () => {
            await setScoreActive({
              variables: {
                scoreId: scoreToToggle.id,
                isActive: !scoreToToggle.isActive,
              },
            });
            setScoreToToggle(null);
            refetch();
          }}
        />
      )}
    </div>
  );
};
