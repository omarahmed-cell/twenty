import { useInvalidateMetadataStore } from '@/metadata-store/hooks/useInvalidateMetadataStore';
import { useObjectMetadataItem } from '@/object-metadata/hooks/useObjectMetadataItem';
import {
  isRoboostScorePropertyChoiceComplete,
  RoboostScorePropertyChoice,
  type RoboostScorePropertyChoiceValue,
} from '@/roboost-app/scoring/components/RoboostScorePropertyChoice';
import {
  ROBOOST_CHANGE_SCORE_PROPERTY,
  ROBOOST_RECALCULATE_SCORE,
  ROBOOST_SAVE_SCORE,
} from '@/roboost-app/scoring/graphql/roboostScoreQueries';
import { useRoboostScoreObjectLabels } from '@/roboost-app/scoring/hooks/useRoboostScoreObjectLabels';
import { type RoboostScore } from '@/roboost-app/scoring/types/RoboostScore';
import { formatRoboostDateTime } from '@/roboost-app/utils/formatRoboostDateTime';
import { Button } from '@/roboost-ui/components/Button';
import { Field } from '@/roboost-ui/components/Field';
import { Icon } from '@/roboost-ui/components/Icon';
import { Input } from '@/roboost-ui/components/Input';
import { Modal } from '@/roboost-ui/components/Modal';
import { Toggle } from '@/roboost-ui/components/Toggle';
import { useMutation } from '@apollo/client/react';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { isDefined } from 'twenty-shared/utils';
import { useToast } from 'twenty-ui/components/feedback';

type RoboostScoreSettingsTabProps = {
  score: RoboostScore;
  canEdit: boolean;
  name: string;
  onNameChange: (name: string) => void;
  onScoreChange: (score: RoboostScore) => void;
};

export const RoboostScoreSettingsTab = ({
  score,
  canEdit,
  name,
  onNameChange,
  onScoreChange,
}: RoboostScoreSettingsTabProps) => {
  const { t } = useLingui();
  const { enqueueToast } = useToast();
  const objectLabels = useRoboostScoreObjectLabels();
  const { invalidateMetadataStore } = useInvalidateMetadataStore();
  const { objectMetadataItem } = useObjectMetadataItem({
    objectNameSingular: score.objectName,
  });
  const [description, setDescription] = useState(score.description ?? '');
  const [isChangeOpen, setIsChangeOpen] = useState(false);
  const [isChangeConfirmOpen, setIsChangeConfirmOpen] = useState(false);
  const [choice, setChoice] = useState<RoboostScorePropertyChoiceValue>({
    mode: 'new',
    label: '',
    fieldMetadataId: '',
  });
  const [saveScore] = useMutation<{ roboostSaveScore: RoboostScore }>(
    ROBOOST_SAVE_SCORE,
  );
  const [changeProperty, { loading: isChanging }] = useMutation<{
    roboostChangeScoreProperty: RoboostScore;
  }>(ROBOOST_CHANGE_SCORE_PROPERTY);
  const [recalculate, { loading: isRecalculating }] = useMutation<{
    roboostRecalculateScore: RoboostScore;
  }>(ROBOOST_RECALCULATE_SCORE);
  const linkedField = objectMetadataItem.fields.find(
    (field) => field.id === score.linkedFieldMetadataId,
  );
  const objectLabel = objectLabels[score.objectName].plural;
  const linkedLabel = linkedField?.label ?? t`No property`;
  const isRunning = score.recalcStatus === 'RUNNING';
  const done = (score.recalcDone ?? 0).toLocaleString('en-US');
  const total = (score.recalcTotal ?? 0).toLocaleString('en-US');
  const lastFull = isDefined(score.lastFullRecalcAt)
    ? formatRoboostDateTime(score.lastFullRecalcAt)
    : null;
  const lastVerified = isDefined(score.lastVerifiedAt)
    ? formatRoboostDateTime(score.lastVerifiedAt)
    : null;
  const driftCount = score.lastDriftCount ?? 0;

  const saveSettings = async (variables: {
    description?: string;
    freezeOnClosedWon?: boolean;
  }) => {
    try {
      const { data } = await saveScore({
        variables: { scoreId: score.id, ...variables },
      });

      if (isDefined(data?.roboostSaveScore)) {
        onScoreChange(data.roboostSaveScore);
      }
    } catch (error) {
      enqueueToast({
        status: 'error',
        children: error instanceof Error ? error.message : t`Could not save`,
      });
    }
  };

  return (
    <div className="rb-scs">
      <section className="rb-dt-card">
        <h3 className="rb-dt-title">{t`Score`}</h3>
        <Field label={t`Score name`} required>
          <Input
            aria-label={t`Score name`}
            value={name}
            disabled={!canEdit}
            invalid={name.trim() === ''}
            onChange={(event) => onNameChange(event.target.value)}
          />
        </Field>
        <Field
          label={t`Description`}
          hint={t`Optional. Saved when you leave the box.`}
        >
          <Input
            aria-label={t`Description`}
            value={description}
            disabled={!canEdit}
            placeholder={t`What this score measures`}
            onChange={(event) => setDescription(event.target.value)}
            onBlur={() => {
              if (description !== (score.description ?? '')) {
                saveSettings({ description });
              }
            }}
          />
        </Field>
        <div className="rb-scs-row">
          <span className="rb-scs-label">{t`Scored object`}</span>
          <span>{objectLabel}</span>
        </div>
      </section>

      <section className="rb-dt-card">
        <h3 className="rb-dt-title">{t`Score property`}</h3>
        <div className="rb-scs-row">
          <span className="rb-scs-label">{t`Property`}</span>
          {isDefined(linkedField) ? (
            <Link
              className="rb-link"
              to={`/settings/objects/${objectMetadataItem.namePlural}/${linkedField.name}`}
            >
              {linkedLabel}
              <Icon name="external-link" size={12} />
            </Link>
          ) : (
            <span>{linkedLabel}</span>
          )}
          <span className="rb-sp" />
          {canEdit && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setChoice({ mode: 'new', label: '', fieldMetadataId: '' });
                setIsChangeOpen(true);
              }}
            >
              {t`Change property`}
            </Button>
          )}
        </div>
        <p className="rb-sc-hint">
          {t`A read-only Number property, calculated automatically. People cannot edit it.`}
        </p>
      </section>

      {score.objectName === 'opportunity' && (
        <section className="rb-dt-card">
          <label className="rb-scs-toggle">
            <Toggle
              aria-label={t`Freeze the score when the deal is Closed Won`}
              checked={score.freezeOnClosedWon}
              disabled={!canEdit}
              onChange={(checked) =>
                saveSettings({ freezeOnClosedWon: checked })
              }
            />
            <span>
              <span className="rb-scs-toggle-title">
                {t`Freeze the score when the deal is Closed Won`}
              </span>
              <span className="rb-sc-hint">
                {t`Protects commissions on won deals: once a deal is Closed Won its score and version stay fixed, even when the criteria change. It is recalculated only if the deal leaves Closed Won.`}
              </span>
            </span>
          </label>
        </section>
      )}

      <section className="rb-dt-card">
        <div className="rb-dt-card-head">
          <div>
            <h3 className="rb-dt-title">{t`Recalculation`}</h3>
            <p className="rb-dt-sub">
              {isRunning
                ? t`Recalculating: ${done} of ${total} records`
                : isDefined(lastFull)
                  ? t`Last full recalculation: ${lastFull}`
                  : t`Not recalculated yet`}
            </p>
            {isDefined(lastVerified) && (
              <p className="rb-dt-sub">
                {driftCount === 0
                  ? t`Nightly check ${lastVerified}: no differences`
                  : t`Nightly check ${lastVerified}: fixed ${driftCount} differences`}
              </p>
            )}
          </div>
          {canEdit && (
            <Button
              size="sm"
              variant="secondary"
              icon="refresh"
              disabled={isRunning || isRecalculating || !score.isActive}
              title={score.isActive ? undefined : t`Turn the score on first`}
              onClick={async () => {
                const { data } = await recalculate({
                  variables: { scoreId: score.id },
                });

                if (isDefined(data?.roboostRecalculateScore)) {
                  onScoreChange(data.roboostRecalculateScore);
                }
              }}
            >
              {t`Recalculate all now`}
            </Button>
          )}
        </div>
        {isRunning && (
          <div className="rb-scs-progress" role="progressbar">
            <span
              style={{
                width: `${Math.min(100, Math.round(((score.recalcDone ?? 0) / Math.max(1, score.recalcTotal ?? 1)) * 100))}%`,
              }}
            />
          </div>
        )}
      </section>

      {isChangeOpen && (
        <Modal
          title={t`Change the score property`}
          width={560}
          onClose={() => setIsChangeOpen(false)}
          footer={
            <>
              <span className="rb-sp" />
              <Button
                variant="secondary"
                onClick={() => setIsChangeOpen(false)}
              >
                {t`Cancel`}
              </Button>
              <Button
                variant="primary"
                disabled={!isRoboostScorePropertyChoiceComplete(choice)}
                onClick={() => {
                  setIsChangeOpen(false);
                  setIsChangeConfirmOpen(true);
                }}
              >
                {t`Continue`}
              </Button>
            </>
          }
        >
          <RoboostScorePropertyChoice
            objectName={score.objectName}
            objectLabel={objectLabel}
            value={choice}
            onChange={setChoice}
          />
        </Modal>
      )}
      {isChangeConfirmOpen && (
        <Modal
          title={t`Change the property?`}
          subtitle={t`${linkedLabel} keeps its values and stops updating. The new property is filled on the next Update.`}
          width={480}
          onClose={() => setIsChangeConfirmOpen(false)}
          footer={
            <>
              <span className="rb-sp" />
              <Button
                variant="secondary"
                onClick={() => setIsChangeConfirmOpen(false)}
              >
                {t`Cancel`}
              </Button>
              <Button
                variant="primary"
                disabled={isChanging}
                onClick={async () => {
                  try {
                    const { data } = await changeProperty({
                      variables: {
                        scoreId: score.id,
                        propertyMode: choice.mode,
                        propertyLabel:
                          choice.mode === 'new' ? choice.label.trim() : null,
                        fieldMetadataId:
                          choice.mode === 'existing'
                            ? choice.fieldMetadataId
                            : null,
                      },
                    });

                    invalidateMetadataStore();
                    if (isDefined(data?.roboostChangeScoreProperty)) {
                      onScoreChange(data.roboostChangeScoreProperty);
                    }
                    setIsChangeConfirmOpen(false);
                  } catch (error) {
                    enqueueToast({
                      status: 'error',
                      children:
                        error instanceof Error
                          ? error.message
                          : t`Could not change the property`,
                    });
                  }
                }}
              >
                {t`Change property`}
              </Button>
            </>
          }
        />
      )}
    </div>
  );
};
