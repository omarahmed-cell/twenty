import { useObjectMetadataItem } from '@/object-metadata/hooks/useObjectMetadataItem';
import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { RoboostScoreActiveConfirmModal } from '@/roboost-app/scoring/components/RoboostScoreActiveConfirmModal';
import { RoboostScoreCriteriaTab } from '@/roboost-app/scoring/components/RoboostScoreCriteriaTab';
import {
  RoboostScoreEditorContext,
  type RoboostScoreDragItem,
} from '@/roboost-app/scoring/components/RoboostScoreEditorContext';
import { RoboostScoreHistoryPanel } from '@/roboost-app/scoring/components/RoboostScoreHistoryPanel';
import { RoboostScoreSettingsTab } from '@/roboost-app/scoring/components/RoboostScoreSettingsTab';
import {
  RoboostScoreTestPicker,
  type RoboostScoreTestRecord,
} from '@/roboost-app/scoring/components/RoboostScoreTestPicker';
import { RoboostScoreUpdateModal } from '@/roboost-app/scoring/components/RoboostScoreUpdateModal';
import {
  ROBOOST_PUBLISH_SCORE,
  ROBOOST_RESTORE_SCORE_VERSION,
  ROBOOST_SAVE_SCORE,
  ROBOOST_SCORE,
  ROBOOST_SET_SCORE_ACTIVE,
  ROBOOST_TEST_SCORE,
} from '@/roboost-app/scoring/graphql/roboostScoreQueries';
import { useRoboostScoreFields } from '@/roboost-app/scoring/hooks/useRoboostScoreFields';
import { useRoboostMemberLabels } from '@/roboost-app/scoring/hooks/useRoboostMemberLabels';
import { useRoboostScoreObjectLabels } from '@/roboost-app/scoring/hooks/useRoboostScoreObjectLabels';
import {
  type RoboostScore,
  type RoboostScoreTestResult,
} from '@/roboost-app/scoring/types/RoboostScore';
import { formatRoboostDateTime } from '@/roboost-app/utils/formatRoboostDateTime';
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
import { useDebounce } from 'use-debounce';

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
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [testRecord, setTestRecord] = useState<RoboostScoreTestRecord | null>(
    null,
  );
  const [testedCriteria] = useDebounce(draft, 400);
  const memberLabels = useRoboostMemberLabels();
  const { data: testData, loading: isTesting } = useQuery<{
    roboostTestScore: RoboostScoreTestResult;
  }>(ROBOOST_TEST_SCORE, {
    variables: {
      scoreId: score.id,
      criteria: testedCriteria,
      recordId: testRecord?.id,
    },
    skip: !isDefined(testRecord),
    fetchPolicy: 'network-only',
  });
  const testResult = isDefined(testRecord)
    ? (testData?.roboostTestScore ?? null)
    : null;
  const [restoreVersion] = useMutation<{
    roboostRestoreScoreVersion: RoboostScore;
  }>(ROBOOST_RESTORE_SCORE_VERSION);
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
  const recalcDone = (score.recalcDone ?? 0).toLocaleString('en-US');
  const recalcTotal = (score.recalcTotal ?? 0).toLocaleString('en-US');
  const formatScore = (value: number) =>
    value.toLocaleString('en-US', { maximumFractionDigits: 1 });
  const matchedCount = testResult?.breakdown.matchedRuleSetCount ?? 0;
  const ruleSetCount = testResult?.breakdown.ruleSetCount ?? 0;
  const testScore = isDefined(testResult)
    ? formatScore(testResult.breakdown.total)
    : '';
  const publishedScore = isDefined(testResult?.publishedValue)
    ? formatScore(testResult.publishedValue)
    : '';
  const frozenVersion = testResult?.frozenVersionNumber ?? '';
  const frozenDate = isDefined(testResult?.frozenAt)
    ? formatRoboostDateTime(testResult.frozenAt)
    : '';

  return (
    <RoboostScoreEditorContext.Provider
      value={{
        objectMetadataItem: objectMetadataItem as EnrichedObjectMetadataItem,
        fieldOptions,
        fieldsByName,
        canEdit,
        validation,
        updateDraft: (update) => setDraft((current) => update(current)),
        testResult,
        memberLabels,
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
            {!isNew && (
              <button
                type="button"
                className="rb-hbtn rb-sce-topbtn rb-hbtn-ghost"
                onClick={() => setIsHistoryOpen(true)}
              >
                <Icon name="history" size={14} />
                {t`History`}
              </button>
            )}
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
            {score.recalcStatus === 'RUNNING' && (
              <span className="rb-sce-recalc">
                <Icon name="refresh" size={13} />
                {t`Recalculating ${recalcDone} of ${recalcTotal}`}
              </span>
            )}
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
            {isDefined(testRecord) ? (
              <button
                type="button"
                className="rb-hbtn"
                onClick={() => setTestRecord(null)}
              >
                {t`Stop testing`}
              </button>
            ) : (
              <RoboostScoreTestPicker
                objectName={score.objectName}
                onPick={setTestRecord}
                trigger={({ ref, toggle, isOpen }) => (
                  <button
                    ref={ref}
                    type="button"
                    className="rb-hbtn"
                    aria-expanded={isOpen}
                    onClick={toggle}
                  >
                    {objectLabels[score.objectName].testLabel}
                  </button>
                )}
              />
            )}
          </div>
        </div>
        {isDefined(testRecord) && (
          <div className="rb-sce-testbar">
            <RoboostScoreTestPicker
              objectName={score.objectName}
              onPick={setTestRecord}
              trigger={({ ref, toggle, isOpen }) => (
                <button
                  ref={ref}
                  type="button"
                  className="rb-sce-testrecord"
                  aria-expanded={isOpen}
                  onClick={toggle}
                >
                  <span className="rb-truncate">{testRecord.label}</span>
                  <Icon name="caret" size={14} />
                </button>
              )}
            />
            {isDefined(testResult) ? (
              <>
                <span className="rb-sce-testsep" />
                <span>
                  {t`Matches:`}{' '}
                  <strong>{t`${matchedCount} of ${ruleSetCount} rule sets`}</strong>
                </span>
                <span className="rb-sce-testsep" />
                <span>
                  {t`Score:`} <strong>{testScore}</strong> {t`(draft)`}
                </span>
                {isDefined(testResult.publishedValue) &&
                  testResult.publishedValue !== testResult.breakdown.total && (
                    <>
                      <span className="rb-sce-testsep" />
                      <span>
                        {t`Published score:`} <strong>{publishedScore}</strong>
                      </span>
                    </>
                  )}
                {testResult.frozen && (
                  <>
                    <span className="rb-sce-testsep" />
                    <span className="rb-sce-frozen">
                      <Icon name="info" size={13} />
                      {t`Frozen at ${publishedScore} (v${frozenVersion}, ${frozenDate})`}
                    </span>
                  </>
                )}
              </>
            ) : (
              <span className="rb-sce-testing">
                {isTesting ? t`Testing` : ''}
              </span>
            )}
          </div>
        )}
        <div className="rb-sce-scroll">
          <div className="rb-sce-content">
            {tab === 'criteria' ? (
              <RoboostScoreCriteriaTab draft={draft} />
            ) : (
              <RoboostScoreSettingsTab
                score={score}
                canEdit={canEdit}
                name={name}
                onNameChange={setName}
                onScoreChange={onScoreChange}
              />
            )}
          </div>
        </div>
      </div>
      {isHistoryOpen && (
        <RoboostScoreHistoryPanel
          scoreId={score.id}
          currentVersionNumber={score.publishedVersionNumber}
          onClose={() => setIsHistoryOpen(false)}
          onRestore={async (version) => {
            const { data } = await restoreVersion({
              variables: { scoreId: score.id, versionId: version.id },
            });

            if (isDefined(data?.roboostRestoreScoreVersion)) {
              setDraft(
                parseRoboostScoreCriteria(
                  data.roboostRestoreScoreVersion.draft,
                ),
              );
              applySaved(data.roboostRestoreScoreVersion);
              setTab('criteria');
              setIsHistoryOpen(false);
              const versionNumber = version.version;

              enqueueToast({
                status: 'success',
                children: t`Version ${versionNumber} restored as the draft. Update to publish it again.`,
              });
            }
          }}
        />
      )}
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
    fetchPolicy: 'cache-and-network',
    pollInterval: 4000,
  });
  // Mutations return the full score, so the normalized cache already holds the latest one
  const shownScore = data?.roboostScore ?? null;

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
      onScoreChange={() => undefined}
    />
  );
};
