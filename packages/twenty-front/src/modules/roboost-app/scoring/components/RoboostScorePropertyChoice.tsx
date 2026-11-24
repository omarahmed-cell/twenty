import { ROBOOST_SCORE_ELIGIBLE_FIELDS } from '@/roboost-app/scoring/graphql/roboostScoreQueries';
import { Icon } from '@/roboost-ui/components/Icon';
import { Input } from '@/roboost-ui/components/Input';
import { Select } from '@/roboost-ui/components/Select';
import { cx } from '@/roboost-ui/utils/cx';
import { useQuery } from '@apollo/client/react';
import { useLingui } from '@lingui/react/macro';
import { type RoboostScoreObjectName } from 'twenty-shared/utils';

export type RoboostScorePropertyChoiceValue = {
  mode: 'new' | 'existing';
  label: string;
  fieldMetadataId: string;
};

type RoboostScorePropertyChoiceProps = {
  objectName: RoboostScoreObjectName;
  objectLabel: string;
  value: RoboostScorePropertyChoiceValue;
  onChange: (value: RoboostScorePropertyChoiceValue) => void;
};

export const isRoboostScorePropertyChoiceComplete = (
  value: RoboostScorePropertyChoiceValue,
) =>
  value.mode === 'new'
    ? value.label.trim() !== ''
    : value.fieldMetadataId !== '';

export const RoboostScorePropertyChoice = ({
  objectName,
  objectLabel,
  value,
  onChange,
}: RoboostScorePropertyChoiceProps) => {
  const { t } = useLingui();
  const { data } = useQuery<{
    roboostScoreEligibleFields: { id: string; label: string }[];
  }>(ROBOOST_SCORE_ELIGIBLE_FIELDS, {
    variables: { objectName },
    fetchPolicy: 'network-only',
  });
  const eligibleFields = data?.roboostScoreEligibleFields ?? [];

  return (
    <div className="rb-sc-radios" role="radiogroup">
      <label
        className={cx('rb-sc-radio', value.mode === 'new' && 'is-selected')}
      >
        <input
          type="radio"
          name="rb-score-property"
          checked={value.mode === 'new'}
          onChange={() => onChange({ ...value, mode: 'new' })}
        />
        <span className="rb-sc-radio-body">
          <span className="rb-sc-radio-title">{t`Create a new property`}</span>
          <span className="rb-sc-radio-hint">
            {t`A read-only Number property on ${objectLabel}, in the Scores group.`}
          </span>
          {value.mode === 'new' && (
            <Input
              size="sm"
              aria-label={t`Property name`}
              placeholder={t`Property name`}
              invalid={value.label.trim() === ''}
              value={value.label}
              onChange={(event) =>
                onChange({ ...value, label: event.target.value })
              }
            />
          )}
        </span>
      </label>
      <label
        className={cx(
          'rb-sc-radio',
          value.mode === 'existing' && 'is-selected',
        )}
      >
        <input
          type="radio"
          name="rb-score-property"
          checked={value.mode === 'existing'}
          onChange={() => onChange({ ...value, mode: 'existing' })}
        />
        <span className="rb-sc-radio-body">
          <span className="rb-sc-radio-title">
            {t`Use an existing property`}
          </span>
          <span className="rb-sc-radio-hint">
            {t`Number properties on ${objectLabel} that no other score uses.`}
          </span>
          {value.mode === 'existing' && (
            <>
              <Select
                aria-label={t`Existing property`}
                placeholder={
                  eligibleFields.length === 0
                    ? t`No Number property available`
                    : t`Choose a property`
                }
                isSearchable
                value={value.fieldMetadataId}
                options={eligibleFields.map((field) => ({
                  value: field.id,
                  label: field.label,
                }))}
                onChange={(fieldMetadataId) =>
                  onChange({ ...value, fieldMetadataId })
                }
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
  );
};
