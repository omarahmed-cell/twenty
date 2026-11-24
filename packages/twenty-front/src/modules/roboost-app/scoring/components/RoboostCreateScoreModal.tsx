import {
  ROBOOST_CREATE_SCORE,
  ROBOOST_SCORE_ELIGIBLE_FIELDS,
} from '@/roboost-app/scoring/graphql/roboostScoreQueries';
import { useRoboostScoreObjectLabels } from '@/roboost-app/scoring/hooks/useRoboostScoreObjectLabels';
import { type RoboostScore } from '@/roboost-app/scoring/types/RoboostScore';
import { useInvalidateMetadataStore } from '@/metadata-store/hooks/useInvalidateMetadataStore';
import { Button } from '@/roboost-ui/components/Button';
import { Field } from '@/roboost-ui/components/Field';
import { Icon } from '@/roboost-ui/components/Icon';
import { Input } from '@/roboost-ui/components/Input';
import { Modal } from '@/roboost-ui/components/Modal';
import { Select } from '@/roboost-ui/components/Select';
import { type RoboostIconName } from '@/roboost-ui/types/RoboostIconName';
import { cx } from '@/roboost-ui/utils/cx';
import { useMutation, useQuery } from '@apollo/client/react';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import {
  isDefined,
  ROBOOST_SCORE_OBJECT_NAMES,
  type RoboostScoreObjectName,
} from 'twenty-shared/utils';

const OBJECT_ICONS: Record<RoboostScoreObjectName, RoboostIconName> = {
  person: 'contacts',
  company: 'building',
  opportunity: 'deals',
};

type RoboostCreateScoreModalProps = {
  cloneSource?: RoboostScore;
  onClose: () => void;
  onCreated: (score: RoboostScore) => void;
};

export const RoboostCreateScoreModal = ({
  cloneSource,
  onClose,
  onCreated,
}: RoboostCreateScoreModalProps) => {
  const { t } = useLingui();
  const objectLabels = useRoboostScoreObjectLabels();
  const { invalidateMetadataStore } = useInvalidateMetadataStore();
  const isClone = isDefined(cloneSource);
  const [step, setStep] = useState<1 | 2>(isClone ? 2 : 1);
  const [objectName, setObjectName] = useState<RoboostScoreObjectName | null>(
    cloneSource?.objectName ?? null,
  );
  const [name, setName] = useState(
    isClone ? t`Copy of ${cloneSource.name}` : '',
  );
  const [propertyMode, setPropertyMode] = useState<'new' | 'existing'>('new');
  const [propertyLabel, setPropertyLabel] = useState('');
  const [isPropertyLabelEdited, setIsPropertyLabelEdited] = useState(isClone);
  const [fieldMetadataId, setFieldMetadataId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data: eligibleData } = useQuery<{
    roboostScoreEligibleFields: { id: string; label: string }[];
  }>(ROBOOST_SCORE_ELIGIBLE_FIELDS, {
    variables: { objectName },
    skip: !isDefined(objectName) || step !== 2,
    fetchPolicy: 'network-only',
  });
  const [createScore] = useMutation<{ roboostCreateScore: RoboostScore }>(
    ROBOOST_CREATE_SCORE,
  );
  const eligibleFields = eligibleData?.roboostScoreEligibleFields ?? [];
  const shownPropertyLabel = isPropertyLabelEdited ? propertyLabel : name;
  const canCreate =
    name.trim() !== '' &&
    isDefined(objectName) &&
    (propertyMode === 'new'
      ? shownPropertyLabel.trim() !== ''
      : fieldMetadataId !== '');

  const submit = async () => {
    if (!canCreate || isSubmitting) {
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const { data } = await createScore({
        variables: {
          name: name.trim(),
          objectName,
          propertyMode,
          propertyLabel:
            propertyMode === 'new' ? shownPropertyLabel.trim() : null,
          fieldMetadataId: propertyMode === 'existing' ? fieldMetadataId : null,
          cloneFromScoreId: cloneSource?.id ?? null,
          defaultGroupName: t`New scoring group`,
        },
      });

      invalidateMetadataStore();
      if (isDefined(data?.roboostCreateScore)) {
        onCreated(data.roboostCreateScore);
      }
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : t`The score was not created.`,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const objectLabel = isDefined(objectName)
    ? objectLabels[objectName].plural
    : '';

  return (
    <Modal
      title={step === 1 ? t`What do you want to score?` : t`Name your score`}
      subtitle={
        step === 1
          ? t`Step 1 of 2`
          : isClone
            ? t`The copy starts off, with the same criteria as a draft and its own property.`
            : t`Step 2 of 2`
      }
      width={560}
      onClose={onClose}
      footer={
        <>
          {step === 2 && !isClone && (
            <Button variant="ghost" onClick={() => setStep(1)}>
              {t`Back`}
            </Button>
          )}
          <span className="rb-sp" />
          <Button variant="secondary" onClick={onClose}>
            {t`Cancel`}
          </Button>
          {step === 1 ? (
            <Button
              variant="primary"
              disabled={!isDefined(objectName)}
              onClick={() => setStep(2)}
            >
              {t`Next`}
            </Button>
          ) : (
            <Button
              variant="primary"
              disabled={!canCreate || isSubmitting}
              onClick={submit}
            >
              {isClone ? t`Clone` : t`Create`}
            </Button>
          )}
        </>
      }
    >
      {step === 1 ? (
        <div className="rb-sc-object-cards" role="radiogroup">
          {ROBOOST_SCORE_OBJECT_NAMES.map((candidate) => (
            <button
              key={candidate}
              type="button"
              role="radio"
              aria-checked={objectName === candidate}
              className={cx(
                'rb-sc-object-card',
                objectName === candidate && 'is-selected',
              )}
              onClick={() => setObjectName(candidate)}
              onDoubleClick={() => {
                setObjectName(candidate);
                setStep(2);
              }}
            >
              <Icon name={OBJECT_ICONS[candidate]} size={22} />
              <span>{objectLabels[candidate].plural}</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="rb-sc-form">
          <Field label={t`Score name`} required>
            <Input
              aria-label={t`Score name`}
              value={name}
              placeholder={t`e.g. Deal quality`}
              onChange={(event) => setName(event.target.value)}
            />
          </Field>
          <div className="rb-sc-form-label">{t`Score property`}</div>
          <div className="rb-sc-radios" role="radiogroup">
            <label
              className={cx(
                'rb-sc-radio',
                propertyMode === 'new' && 'is-selected',
              )}
            >
              <input
                type="radio"
                name="rb-score-property"
                checked={propertyMode === 'new'}
                onChange={() => setPropertyMode('new')}
              />
              <span className="rb-sc-radio-body">
                <span className="rb-sc-radio-title">
                  {t`Create a new property`}
                </span>
                <span className="rb-sc-radio-hint">
                  {t`A read-only Number property on ${objectLabel}, in the Scores group.`}
                </span>
                {propertyMode === 'new' && (
                  <Input
                    size="sm"
                    aria-label={t`Property name`}
                    placeholder={t`Property name`}
                    invalid={shownPropertyLabel.trim() === ''}
                    value={shownPropertyLabel}
                    onChange={(event) => {
                      setIsPropertyLabelEdited(true);
                      setPropertyLabel(event.target.value);
                    }}
                  />
                )}
              </span>
            </label>
            <label
              className={cx(
                'rb-sc-radio',
                propertyMode === 'existing' && 'is-selected',
              )}
            >
              <input
                type="radio"
                name="rb-score-property"
                checked={propertyMode === 'existing'}
                onChange={() => setPropertyMode('existing')}
              />
              <span className="rb-sc-radio-body">
                <span className="rb-sc-radio-title">
                  {t`Use an existing property`}
                </span>
                <span className="rb-sc-radio-hint">
                  {t`Number properties on ${objectLabel} that no other score uses.`}
                </span>
                {propertyMode === 'existing' && (
                  <>
                    <Select
                      aria-label={t`Existing property`}
                      placeholder={
                        eligibleFields.length === 0
                          ? t`No Number property available`
                          : t`Choose a property`
                      }
                      isSearchable
                      value={fieldMetadataId}
                      options={eligibleFields.map((field) => ({
                        value: field.id,
                        label: field.label,
                      }))}
                      onChange={setFieldMetadataId}
                    />
                    <span className="rb-sc-warning">
                      <Icon name="alert-triangle" size={14} />
                      {t`Its current values will be overwritten when the score is published.`}
                    </span>
                  </>
                )}
              </span>
            </label>
          </div>
          {isDefined(error) && (
            <div className="rb-sc-error" role="alert">
              {error}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};
