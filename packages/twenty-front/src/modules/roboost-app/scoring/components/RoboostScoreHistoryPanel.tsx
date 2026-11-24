import { RoboostScoreCriteriaTab } from '@/roboost-app/scoring/components/RoboostScoreCriteriaTab';
import {
  RoboostScoreEditorContext,
  useRoboostScoreEditor,
} from '@/roboost-app/scoring/components/RoboostScoreEditorContext';
import { ROBOOST_SCORE_VERSIONS } from '@/roboost-app/scoring/graphql/roboostScoreQueries';
import { type RoboostScoreVersion } from '@/roboost-app/scoring/types/RoboostScore';
import { formatRoboostDateTime } from '@/roboost-app/utils/formatRoboostDateTime';
import { Button } from '@/roboost-ui/components/Button';
import { Modal } from '@/roboost-ui/components/Modal';
import { SidePanel } from '@/roboost-ui/components/SidePanel';
import { useQuery } from '@apollo/client/react';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import {
  isDefined,
  parseRoboostScoreCriteria,
  validateRoboostScoreCriteria,
} from 'twenty-shared/utils';

type RoboostScoreHistoryPanelProps = {
  scoreId: string;
  currentVersionNumber: number | null;
  onClose: () => void;
  onRestore: (version: RoboostScoreVersion) => void;
};

export const RoboostScoreHistoryPanel = ({
  scoreId,
  currentVersionNumber,
  onClose,
  onRestore,
}: RoboostScoreHistoryPanelProps) => {
  const { t } = useLingui();
  const editor = useRoboostScoreEditor();
  const [viewed, setViewed] = useState<RoboostScoreVersion | null>(null);
  const { data, loading } = useQuery<{
    roboostScoreVersions: RoboostScoreVersion[];
  }>(ROBOOST_SCORE_VERSIONS, {
    variables: { scoreId },
    fetchPolicy: 'network-only',
  });
  const versions = data?.roboostScoreVersions ?? [];
  const viewedCriteria = isDefined(viewed)
    ? parseRoboostScoreCriteria(viewed.criteria)
    : null;
  const viewedNumber = viewed?.version ?? 0;

  return (
    <>
      <SidePanel title={t`Version history`} width={440} onClose={onClose}>
        <div className="rb-sch">
          {versions.length === 0 && (
            <p className="rb-sc-hint">
              {loading ? t`Loading` : t`No version has been published yet.`}
            </p>
          )}
          {versions.map((version) => {
            const versionNumber = version.version;
            const publishedAt = formatRoboostDateTime(version.publishedAt);
            const publishedBy = version.publishedByName ?? t`Unknown`;

            return (
              <div key={version.id} className="rb-sch-item">
                <div className="rb-sch-head">
                  <strong>{t`v${versionNumber}`}</strong>
                  {versionNumber === currentVersionNumber && (
                    <span className="rb-sc-badge is-current">{t`Published`}</span>
                  )}
                  <span className="rb-sp" />
                  <span className="rb-dt-muted">{publishedAt}</span>
                </div>
                <div className="rb-dt-muted">{t`by ${publishedBy}`}</div>
                {isDefined(version.note) && (
                  <p className="rb-sch-note">{version.note}</p>
                )}
                <div className="rb-sch-actions">
                  <Button
                    size="sm"
                    variant="secondary"
                    icon="eye"
                    onClick={() => setViewed(version)}
                  >
                    {t`View`}
                  </Button>
                  {editor.canEdit && (
                    <Button
                      size="sm"
                      variant="secondary"
                      icon="history"
                      onClick={() => onRestore(version)}
                    >
                      {t`Restore as draft`}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </SidePanel>
      {isDefined(viewed) && isDefined(viewedCriteria) && (
        <Modal
          title={t`Version ${viewedNumber}`}
          subtitle={t`Read only`}
          width={1040}
          className="rb-sch-view"
          onClose={() => setViewed(null)}
        >
          <RoboostScoreEditorContext.Provider
            value={{
              ...editor,
              canEdit: false,
              testResult: null,
              validation: validateRoboostScoreCriteria(viewedCriteria),
              updateDraft: () => undefined,
            }}
          >
            <RoboostScoreCriteriaTab draft={viewedCriteria} />
          </RoboostScoreEditorContext.Provider>
        </Modal>
      )}
    </>
  );
};
