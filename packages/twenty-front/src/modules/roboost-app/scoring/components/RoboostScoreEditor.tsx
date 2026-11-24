import { useObjectMetadataItem } from '@/object-metadata/hooks/useObjectMetadataItem';
import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { RoboostScoreActiveConfirmModal } from '@/roboost-app/scoring/components/RoboostScoreActiveConfirmModal';
import { RoboostScoreCriteriaTab } from '@/roboost-app/scoring/components/RoboostScoreCriteriaTab';
import {
  RoboostScoreEditorContext,
  type RoboostScoreDragItem,
} from '@/roboost-app/scoring/components/RoboostScoreEditorContext';
import { RoboostScoreUpdateModal } from '@/roboost-app/scoring/components/RoboostScoreUpdateModal';
import {
  ROBOOST_PUBLISH_SCORE,
  ROBOOST_SAVE_SCORE,
  ROBOOST_SCORE,
  ROBOOST_SET_SCORE_ACTIVE,
} from '@/roboost-app/scoring/graphql/roboostScoreQueries';
import { useRoboostScoreFields } from '@/roboost-app/scoring/hooks/useRoboostScoreFields';
import { useRoboostScoreObjectLabels } from '@/roboost-app/scoring/hooks/useRoboostScoreObjectLabels';
import { type RoboostScore } from '@/roboost-app/scoring/types/RoboostScore';
import { Button } from '@/roboost-ui/components/Button';
import { Icon } from '@/roboost-ui/components/Icon';
import { Input } from '@/roboost-ui/components/Input';
import { Modal } from '@/roboost-ui/components/Modal';
import { cx } from '@/roboost-ui/utils/cx';
import { useMutation, useQuery } from '@apollo/client/react';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { Link, useBlocker } from 'react-router-dom';
import {
  isDefined,
  parseRoboostScoreCriteria,
  type RoboostScoreCriteria,
  validateRoboostScoreCriteria,
} from 'twenty-shared/utils';
import { useToast } from 'twenty-ui/components/feedback';

type RoboostScoreEditorProps = {
  scoreId: string;
};

type Tab = 'criteria' | 'settings';

// Collapsed flags are view state; they are saved but never count as an unsaved change
const comparable = (criteria: RoboostScoreCriteria) =>
  JSON.stringify({
    ...criteria,
    groups: criteria.groups.map((group) => ({
      ...group,
      collapsed: false,
      ruleSets: group.ruleSets.map((ruleSet) => ({
        ...ruleSet,
        collapsed: false,
      })),
    })),
  });

const RoboostScoreEditorBody = ({
  score,
  canEdit,
  onScoreChange,
}: {
  score: RoboostScore;
  canEdit: boolean;
  onScoreChange: (score: RoboostScore) => void;
}) => {
  const { t } = useLingui();
  const { enqueueToast } = useToast();
  const objectLabels = useRoboostScoreObjectLabels();
  const { objectMetadataItem } = useObjectMetadataItem({
    objectNameSingular: score.objectName,
  });
  const { fieldOptions, fieldsByName } = useRoboostScoreFields(
    objectMetadataItem as EnrichedObjectMetadataItem,
    score.linkedFieldMetadataId,
  );
  const [draft, setDraft] = useState<RoboostScoreCriteria>(() =>
    parseRoboostScoreCriteria(score.draft),
  );
  const [savedDraft, setSavedDraft] = useState(() =>
    comparable(parseRoboostScoreCriteria(score.draft)),
  );
  const [name, setName] = useState(score.name);
  const [nameDraft, setNameDraft] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('criteria');
  const [dragItem, setDragItem] = useState<RoboostScoreDragItem | null>(null);
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const [isToggleOpen, setIsToggleOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveScore] = useMutation<{ roboostSaveScore: RoboostScore }>(
    ROBOOST_SAVE_SCORE,
  );
  const [publishScore] = useMutation<{ roboostPublishScore: RoboostScore }>(
    ROBOOST_PUBLISH_SCORE,
  );
  const [setScoreActive] = useMutation<{ roboostSetScoreActive: RoboostScore }>(
    ROBOOST_SET_SCORE_ACTIVE,
  );
  const { totalCount: recordCount } = useFindManyRecords({
    objectNameSingular: score.objectName,
    recordGqlFields: { id: true },
    limit: 1,
  });
  const validation = validateRoboostScoreCriteria(
    draft,
    (fieldName) => fieldsByName.get(fieldName)?.type === 'MULTI_SELECT',
  );
  const isDirty = comparable(draft) !== savedDraft || name !== score.name;
  const isNew = !isDefined(score.publishedVersionNumber);
  const canSave = canEdit && validation.isValid && name.trim() !== '';
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty && currentLocation.pathname !== nextLocation.pathname,
  );

  const statusText = isDirty
    ? t`Unsaved changes`
    : isNew
      ? t`Saved as a draft`
      : score.hasDraftChanges
        ? t`Saved with draft changes`
        : t`Saved`;

  const applySaved = (saved: RoboostScore) => {
    const savedCriteria = parseRoboostScoreCriteria(saved.draft);

    setSavedDraft(comparable(savedCriteria));
    setName(saved.name);
    onScoreChange(saved);
  };

  const save = async () => {
    if (!canSave) {
      return false;
    }
    setIsSaving(true);
    try {
      const { data } = await saveScore({
        variables: { scoreId: score.id, draft, name: name.trim() },
      });

      if (isDefined(data?.roboostSaveScore)) {
        applySaved(data.roboostSaveScore);
      }

      return true;
    } catch (error) {
      enqueueToast({
        status: 'error',
        children: error instanceof Error ? error.message : t`Could not save`,
      });

      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const publish = async (note: string | null) => {
    setIsSaving(true);
    try {
      if (name !== score.name) {
        await saveScore({
          variables: { scoreId: score.id, name: name.trim() },
        });
      }
      const { data } = await publishScore({
        variables: { scoreId: score.id, draft, note },
      });

      if (isDefined(data?.roboostPublishScore)) {
        applySaved(data.roboostPublishScore);
        const versionNumber = data.roboostPublishScore.publishedVersionNumber;

        enqueueToast({
          status: 'success',
          children: t`Version ${versionNumber} published. Records are being recalculated.`,
        });
      }
      setIsUpdateOpen(false);
    } catch (error) {
      enqueueToast({
        status: 'error',
        children: error instanceof Error ? error.message : t`Could not publish`,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const commitName = () => {
    if (nameDraft !== null && nameDraft.trim() !== '') {
      setName(nameDraft.trim());
    }
    setNameDraft(null);
  };

  const shownRecordCount = recordCount ?? 0;

  return (
    <RoboostScoreEditorContext.Provider
      value={{
        objectMetadataItem: objectMetadataItem as EnrichedObjectMetadataItem,
        fieldOptions,
        fieldsByName,
        canEdit,
        validation,
        updateDraft: (update) => setDraft((current) => update(current)),
        testResult: null,
        memberLabels: {},
        dragItem,
        setDragItem,
      }}
    >
      <div className="rb-sce">
        <div className="rb-sce-top">
          <div className="rb-sce-top-left">
            <Link className="rb-hbtn rb-sce-topbtn" to="/scoring">
              {t`Exit`}
            </Link>
            {canEdit && (
              <button
                type="button"
                className="rb-hbtn rb-sce-topbtn"
                disabled={!canSave || isSaving || !isDirty}
                title={
                  validation.isValid
                    ? undefined
                    : t`Finish or remove the highlighted rules first`
                }
                onClick={save}
              >
                {t`Save`}
              </button>
            )}
            <span className={cx('rb-sce-status', isDirty && 'is-dirty')}>
              {statusText}
            </span>
          </div>
          <div className="rb-sce-title">
            {nameDraft !== null ? (
              <Input
                size="sm"
                aria-label={t`Score name`}
                value={nameDraft}
                onChange={(event) => setNameDraft(event.target.value)}
                onBlur={commitName}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    commitName();
                  }
                  if (event.key === 'Escape') {
                    setNameDraft(null);
                  }
                }}
              />
            ) : (
              <>
                <span className="rb-truncate">{name}</span>
                {canEdit && (
                  <button
                    type="button"
                    className="rb-sce-pencil"
                    aria-label={t`Rename score`}
                    onClick={() => setNameDraft(name)}
                  >
                    <Icon name="pencil" size={15} />
                  </button>
                )}
              </>
            )}
          </div>
          <div className="rb-sce-top-right">
            {canEdit &&
              (isNew ? (
                <button
                  type="button"
                  className="rb-hbtn rb-sce-primary"
                  disabled={!canSave || isSaving}
                  onClick={() => setIsUpdateOpen(true)}
                >
                  {t`Create`}
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    className="rb-hbtn rb-sce-topbtn"
                    onClick={() => setIsToggleOpen(true)}
                  >
                    {score.isActive ? t`Turn off` : t`Turn on`}
                  </button>
                  <button
                    type="button"
                    className="rb-hbtn rb-sce-primary"
                    disabled={
                      !canSave ||
                      isSaving ||
                      (!isDirty && !score.hasDraftChanges)
                    }
                    onClick={() => setIsUpdateOpen(true)}
                  >
                    {t`Update`}
                  </button>
                </>
              ))}
          </div>
        </div>
        <div className="rb-sce-tabs">
          <div className="rb-sce-tabs-left">
            {!score.isActive && !isNew && (
              <span className="rb-sce-off">
                <Icon name="info" size={13} />
                {t`Score is off`}
              </span>
            )}
          </div>
          <div className="rb-sce-tablist" role="tablist">
            {(['criteria', 'settings'] as Tab[]).map((candidate) => (
              <button
                key={candidate}
                type="button"
                role="tab"
                aria-selected={tab === candidate}
                className={cx('rb-sce-tab', tab === candidate && 'is-active')}
                onClick={() => setTab(candidate)}
              >
                {candidate === 'criteria' ? t`Criteria` : t`Settings`}
              </button>
            ))}
          </div>
          <div className="rb-sce-tabs-right">
            <span className="rb-sce-objectlabel">
              {objectLabels[score.objectName].plural}
            </span>
          </div>
        </div>
        <div className="rb-sce-scroll">
          <div className="rb-sce-content">
            {tab === 'criteria' ? (
              <RoboostScoreCriteriaTab draft={draft} />
            ) : (
              <div className="rb-dt-card">
                <p className="rb-dt-sub">{t`Settings come in the next update.`}</p>
              </div>
            )}
          </div>
        </div>
      </div>
      {isUpdateOpen && (
        <RoboostScoreUpdateModal
          isNew={isNew}
          recordCount={shownRecordCount}
          objectLabel={objectLabels[score.objectName].plural}
          isFreezingDeals={
            score.objectName === 'opportunity' && score.freezeOnClosedWon
          }
          isSaving={isSaving}
          onClose={() => setIsUpdateOpen(false)}
          onConfirm={publish}
        />
      )}
      {isToggleOpen && (
        <RoboostScoreActiveConfirmModal
          scoreName={score.name}
          nextIsActive={!score.isActive}
          onClose={() => setIsToggleOpen(false)}
          onConfirm={async () => {
            const { data } = await setScoreActive({
              variables: { scoreId: score.id, isActive: !score.isActive },
            });

            if (isDefined(data?.roboostSetScoreActive)) {
              onScoreChange(data.roboostSetScoreActive);
            }
            setIsToggleOpen(false);
          }}
        />
      )}
      {blocker.state === 'blocked' && (
        <Modal
          title={t`Save your changes?`}
          subtitle={t`This score has changes that are not saved.`}
          width={460}
          onClose={() => blocker.reset()}
          footer={
            <>
              <Button variant="ghost" onClick={() => blocker.reset()}>
                {t`Cancel`}
              </Button>
              <span className="rb-sp" />
              <Button variant="secondary" onClick={() => blocker.proceed()}>
                {t`Discard`}
              </Button>
              <Button
                variant="primary"
                disabled={!canSave}
                onClick={async () => {
                  if (await save()) {
                    blocker.proceed();
                  }
                }}
              >
                {t`Save`}
              </Button>
            </>
          }
        />
      )}
    </RoboostScoreEditorContext.Provider>
  );
};

export const RoboostScoreEditor = ({ scoreId }: RoboostScoreEditorProps) => {
  const { t } = useLingui();
  const { data, error } = useQuery<{
    roboostScore: RoboostScore;
    roboostScoringCanEdit: boolean;
  }>(ROBOOST_SCORE, {
    variables: { scoreId },
    fetchPolicy: 'network-only',
  });
  const [score, setScore] = useState<RoboostScore | null>(null);
  const shownScore = score ?? data?.roboostScore ?? null;

  if (!isDefined(shownScore)) {
    return (
      <div className="rb-sce">
        <div className="rb-sce-loading">
          {isDefined(error)
            ? t`This score could not be loaded.`
            : t`Loading score`}
        </div>
      </div>
    );
  }

  return (
    <RoboostScoreEditorBody
      score={shownScore}
      canEdit={data?.roboostScoringCanEdit === true}
      onScoreChange={setScore}
    />
  );
};
