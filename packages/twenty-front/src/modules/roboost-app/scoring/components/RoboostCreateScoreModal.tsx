import { RoboostScorePropertyChoice } from '@/roboost-app/scoring/components/RoboostScorePropertyChoice';
import { ROBOOST_CREATE_SCORE } from '@/roboost-app/scoring/graphql/roboostScoreQueries';
import { useRoboostScoreObjectLabels } from '@/roboost-app/scoring/hooks/useRoboostScoreObjectLabels';
import { type RoboostScore } from '@/roboost-app/scoring/types/RoboostScore';
import { useInvalidateMetadataStore } from '@/metadata-store/hooks/useInvalidateMetadataStore';
import { Button } from '@/roboost-ui/components/Button';
import { Field } from '@/roboost-ui/components/Field';
import { Icon } from '@/roboost-ui/components/Icon';
import { Input } from '@/roboost-ui/components/Input';
import { Modal } from '@/roboost-ui/components/Modal';
import { type RoboostIconName } from '@/roboost-ui/types/RoboostIconName';
import { cx } from '@/roboost-ui/utils/cx';
import { useMutation } from '@apollo/client/react';
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
  const cloneSourceName = cloneSource?.name ?? '';
  const [name, setName] = useState(
    isClone ? t`Copy of ${cloneSourceName}` : '',
  );
  const [propertyMode, setPropertyMode] = useState<'new' | 'existing'>('new');
  const [propertyLabel, setPropertyLabel] = useState('');
  const [isPropertyLabelEdited, setIsPropertyLabelEdited] = useState(isClone);
  const [fieldMetadataId, setFieldMetadataId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createScore] = useMutation<{ roboostCreateScore: RoboostScore }>(
    ROBOOST_CREATE_SCORE,
  );
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
          {isDefined(objectName) && (
            <RoboostScorePropertyChoice
              objectName={objectName}
              objectLabel={objectLabel}
              value={{
                mode: propertyMode,
                label: shownPropertyLabel,
                fieldMetadataId,
              }}
              onChange={(next) => {
                setPropertyMode(next.mode);
                setFieldMetadataId(next.fieldMetadataId);
                if (next.label !== shownPropertyLabel) {
                  setIsPropertyLabelEdited(true);
                  setPropertyLabel(next.label);
                }
              }}
            />
          )}
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
