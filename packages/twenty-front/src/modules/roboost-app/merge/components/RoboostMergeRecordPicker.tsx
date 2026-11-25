import { ROBOOST_MERGE_CANDIDATES } from '@/roboost-app/merge/graphql/roboostMergeQueries';
import { formatRoboostDate } from '@/roboost-app/utils/formatRoboostDate';
import { Icon } from '@/roboost-ui/components/Icon';
import { MenuSearch } from '@/roboost-ui/components/MenuSearch';
import { Popover } from '@/roboost-ui/components/Popover';
import { useQuery } from '@apollo/client/react';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { useDebounce } from 'use-debounce';

type RoboostMergeCandidate = {
  id: string;
  name: string;
  keyText: string;
  createdAt: string;
};

type RoboostMergeRecordPickerProps = {
  objectName: string;
  excludeId: string;
  selectedId: string | null;
  selectedLabel: string;
  onSelect: (id: string) => void;
};

const RoboostMergeCandidateList = ({
  objectName,
  excludeId,
  onSelect,
}: {
  objectName: string;
  excludeId: string;
  onSelect: (id: string) => void;
}) => {
  const { t } = useLingui();
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebounce(search, 300);
  const { data, loading } = useQuery<{
    roboostMergeCandidates: RoboostMergeCandidate[];
  }>(ROBOOST_MERGE_CANDIDATES, {
    variables: { objectName, excludeId, search: debouncedSearch },
    fetchPolicy: 'network-only',
  });
  const candidates = data?.roboostMergeCandidates ?? [];

  return (
    <div className="rb-mg-picker-panel">
      <MenuSearch
        value={search}
        onChange={setSearch}
        placeholder={t`Search by name or key field`}
      />
      <div className="rb-mg-picker-list">
        {candidates.map((candidate) => (
          <button
            key={candidate.id}
            type="button"
            className="rb-mg-picker-item"
            onClick={() => onSelect(candidate.id)}
          >
            <span className="rb-mg-picker-name">{candidate.name}</span>
            <span className="rb-mg-picker-key">
              {[candidate.keyText, formatRoboostDate(candidate.createdAt)]
                .filter((part) => part !== '')
                .join(' · ')}
            </span>
          </button>
        ))}
        {!loading && candidates.length === 0 && (
          <div className="rb-mg-picker-empty">
            {t`No records you can merge match.`}
          </div>
        )}
      </div>
    </div>
  );
};

// Only records of the same object that the user may merge are offered
export const RoboostMergeRecordPicker = ({
  objectName,
  excludeId,
  selectedId,
  selectedLabel,
  onSelect,
}: RoboostMergeRecordPickerProps) => {
  const { t } = useLingui();

  return (
    <Popover
      align="left"
      ariaLabel={t`Select a record to merge`}
      trigger={({ toggle, isOpen }) => (
        <button
          type="button"
          className="rb-mg-picker-trigger"
          aria-expanded={isOpen}
          onClick={toggle}
        >
          <span className="rb-truncate">
            {selectedId !== null && selectedLabel !== ''
              ? selectedLabel
              : t`Search for a record`}
          </span>
          <Icon name="caret" size={12} />
        </button>
      )}
    >
      {({ close }) => (
        <RoboostMergeCandidateList
          objectName={objectName}
          excludeId={excludeId}
          onSelect={(id) => {
            onSelect(id);
            close();
          }}
        />
      )}
    </Popover>
  );
};
