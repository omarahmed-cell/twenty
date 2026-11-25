import { useObjectMetadataItems } from '@/object-metadata/hooks/useObjectMetadataItems';
import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { useFindOneRecord } from '@/object-record/hooks/useFindOneRecord';
import { getRoboostRecordLabel } from '@/roboost-app/fields/getRoboostRecordLabel';
import { RoboostListCellValue } from '@/roboost-app/list/components/RoboostListCellValue';
import { getRoboostListRecordGqlFields } from '@/roboost-app/list/utils/getRoboostListRecordGqlFields';
import { RoboostMergeCompanyConflictModal } from '@/roboost-app/merge/components/RoboostMergeCompanyConflictModal';
import { RoboostMergeRecordPicker } from '@/roboost-app/merge/components/RoboostMergeRecordPicker';
import {
  ROBOOST_MERGE_PREVIEW,
  ROBOOST_MERGE_RECORDS,
} from '@/roboost-app/merge/graphql/roboostMergeQueries';
import { formatRoboostDate } from '@/roboost-app/utils/formatRoboostDate';
import { Button } from '@/roboost-ui/components/Button';
import { Icon } from '@/roboost-ui/components/Icon';
import { Input } from '@/roboost-ui/components/Input';
import { Modal } from '@/roboost-ui/components/Modal';
import { Toggle } from '@/roboost-ui/components/Toggle';
import { cx } from '@/roboost-ui/utils/cx';
import { useMutation, useQuery } from '@apollo/client/react';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { type RoboostMergeFieldPlan } from 'twenty-shared/constants';
import { AppPath } from 'twenty-shared/types';
import { getAppPath, isDefined } from 'twenty-shared/utils';
import { useToast } from 'twenty-ui/components/feedback';
import { FieldMetadataType, RelationType } from '~/generated-metadata/graphql';

type RoboostMergePreview = {
  plan: RoboostMergeFieldPlan[];
  blockers: string[];
  companyConflict: {
    primaryCompanyId: string;
    secondaryCompanyId: string;
  } | null;
  primaryKeyText: string;
  secondaryKeyText: string;
};

type RoboostMergeModalProps = {
  objectMetadataItem: EnrichedObjectMetadataItem;
  startRecordId: string;
  initialOtherRecordId?: string;
  onClose: () => void;
  onMerged: (primaryId: string) => void;
};

type Side = 'primary' | 'secondary';

const useMergeRecord = (
  objectMetadataItem: EnrichedObjectMetadataItem,
  recordId: string | null,
) => {
  const { objectMetadataItems } = useObjectMetadataItems();
  const fields = objectMetadataItem.fields.filter(
    (field) =>
      field.isActive &&
      !(
        field.type === FieldMetadataType.RELATION &&
        field.relation?.type === RelationType.ONE_TO_MANY
      ) &&
      field.type !== FieldMetadataType.TS_VECTOR,
  );
  const { record } = useFindOneRecord({
    objectNameSingular: objectMetadataItem.nameSingular,
    objectRecordId: recordId ?? '',
    recordGqlFields: getRoboostListRecordGqlFields(
      objectMetadataItem,
      fields,
      objectMetadataItems,
    ),
    skip: !isDefined(recordId),
  });

  return record as (Record<string, unknown> & { id: string }) | undefined;
};

// "Merge duplicate records": pick the other record, choose the surviving value of every property, then merge
export const RoboostMergeModal = ({
  objectMetadataItem,
  startRecordId,
  initialOtherRecordId,
  onClose,
  onMerged,
}: RoboostMergeModalProps) => {
  const { t } = useLingui();
  const { enqueueToast } = useToast();
  const { objectMetadataItems } = useObjectMetadataItems();
  const [primaryId, setPrimaryId] = useState(startRecordId);
  const [secondaryId, setSecondaryId] = useState<string | null>(
    initialOtherRecordId ?? null,
  );
  const [overrides, setOverrides] = useState<Record<string, Side>>({});
  const [isOnlyDifferences, setIsOnlyDifferences] = useState(true);
  const [search, setSearch] = useState('');
  const [isConflictOpen, setIsConflictOpen] = useState(false);
  const [isMerging, setIsMerging] = useState(false);
  const objectName = objectMetadataItem.nameSingular;
  const primary = useMergeRecord(objectMetadataItem, primaryId);
  const secondary = useMergeRecord(objectMetadataItem, secondaryId);
  const { data, loading } = useQuery<{
    roboostMergePreview: RoboostMergePreview;
  }>(ROBOOST_MERGE_PREVIEW, {
    variables: { objectName, primaryId, secondaryId },
    skip: !isDefined(secondaryId),
    fetchPolicy: 'network-only',
  });
  const [mergeRecords] = useMutation(ROBOOST_MERGE_RECORDS);
  const preview = isDefined(secondaryId)
    ? data?.roboostMergePreview
    : undefined;
  const fieldsByName = new Map(
    objectMetadataItem.fields.map((field) => [field.name, field]),
  );
  const sideOf = (entry: RoboostMergeFieldPlan): Side =>
    entry.mode === 'choice'
      ? (overrides[entry.name] ?? entry.defaultSide)
      : 'primary';
  const term = search.trim().toLowerCase();
  const visiblePlan = (preview?.plan ?? []).filter((entry) => {
    const label = fieldsByName.get(entry.name)?.label ?? entry.name;

    return (
      (!isOnlyDifferences || entry.isDifferent) &&
      (term === '' || label.toLowerCase().includes(term))
    );
  });
  const primaryName = getRoboostRecordLabel(primary, objectMetadataItem);
  const secondaryName = getRoboostRecordLabel(secondary, objectMetadataItem);
  const canMerge =
    isDefined(preview) &&
    preview.blockers.length === 0 &&
    isDefined(primary) &&
    isDefined(secondary) &&
    !isMerging;

  const swap = () => {
    if (!isDefined(secondaryId)) {
      return;
    }
    setPrimaryId(secondaryId);
    setSecondaryId(primaryId);
    setOverrides({});
  };

  const runMerge = async (companySide?: Side) => {
    if (!isDefined(preview) || !isDefined(secondaryId)) {
      return;
    }
    const secondaryFieldNames = preview.plan
      .filter((entry) =>
        entry.name === 'company' && isDefined(companySide)
          ? companySide === 'secondary'
          : sideOf(entry) === 'secondary',
      )
      .map((entry) => entry.name);

    setIsMerging(true);
    try {
      await mergeRecords({
        variables: { objectName, primaryId, secondaryId, secondaryFieldNames },
      });
      enqueueToast({
        status: 'success',
        children: t`${secondaryName} was merged into ${primaryName}`,
      });
      onMerged(primaryId);
    } catch (error) {
      enqueueToast({
        status: 'error',
        children: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setIsMerging(false);
    }
  };

  const companyPlan = preview?.plan.find((entry) => entry.name === 'company');
  const hasCompanyConflict =
    isDefined(preview?.companyConflict) && isDefined(companyPlan);

  const renderValue = (
    record: (Record<string, unknown> & { id: string }) | undefined,
    fieldName: string,
  ) => {
    const field = fieldsByName.get(fieldName);

    return isDefined(field) && isDefined(record) ? (
      <RoboostListCellValue
        field={field}
        record={record}
        objectMetadataItems={objectMetadataItems}
      />
    ) : (
      <span className="rb-lt-muted">—</span>
    );
  };

  const renderCard = (
    side: Side,
    record: (Record<string, unknown> & { id: string }) | undefined,
    keyText: string | undefined,
  ) => (
    <div className={cx('rb-mg-card', side === 'primary' && 'is-primary')}>
      <label className="rb-mg-card-radio">
        <input
          type="radio"
          name="rb-mg-primary"
          checked={side === 'primary'}
          disabled={!isDefined(secondaryId)}
          onChange={() => side === 'secondary' && swap()}
        />
        <span>{t`Primary`}</span>
      </label>
      <div className="rb-mg-card-name">
        {isDefined(record)
          ? getRoboostRecordLabel(record, objectMetadataItem)
          : '…'}
      </div>
      <div className="rb-mg-card-key">{keyText || '—'}</div>
      <div className="rb-mg-card-meta">
        <span>
          {t`Created`}{' '}
          {formatRoboostDate(record?.createdAt as string | undefined)}
        </span>
        {isDefined(record) && (
          <a
            className="rb-link"
            href={getAppPath(AppPath.RecordShowPage, {
              objectNameSingular: objectName,
              objectRecordId: record.id,
            })}
            target="_blank"
            rel="noreferrer"
          >
            {t`View record`} <Icon name="external-link" size={11} />
          </a>
        )}
      </div>
    </div>
  );

  return (
    <>
      <Modal
        title={t`Merge duplicate records`}
        width={1180}
        className="rb-mg-modal"
        onClose={onClose}
        footer={
          <>
            {isDefined(preview) && preview.blockers.length > 0 && (
              <span className="rb-mg-blocker">
                <Icon name="alert-triangle" size={14} />
                {preview.blockers.join(' ')}
              </span>
            )}
            <span className="rb-sp" />
            <Button variant="secondary" onClick={onClose}>
              {t`Cancel`}
            </Button>
            <Button
              variant="primary"
              disabled={!canMerge}
              onClick={() =>
                hasCompanyConflict ? setIsConflictOpen(true) : runMerge()
              }
            >
              {t`Merge`}
            </Button>
          </>
        }
      >
        <div className="rb-mg">
          <div className="rb-mg-pick">
            <span className="rb-mg-label">{t`Select a record to merge`}</span>
            <RoboostMergeRecordPicker
              objectName={objectName}
              excludeId={primaryId}
              selectedId={secondaryId}
              selectedLabel={secondaryName}
              onSelect={(id) => {
                setSecondaryId(id);
                setOverrides({});
              }}
            />
          </div>
          <div className="rb-mg-cards">
            <div className="rb-mg-card-col">
              <span className="rb-mg-label">{t`Primary (Survivor)`}</span>
              {renderCard('primary', primary, preview?.primaryKeyText)}
            </div>
            <div className="rb-mg-card-arrow" aria-hidden>
              <Icon name="chevron-left" size={18} />
            </div>
            <div className="rb-mg-card-col">
              <span className="rb-mg-label">{t`Secondary (Fade away)`}</span>
              {isDefined(secondaryId) ? (
                renderCard('secondary', secondary, preview?.secondaryKeyText)
              ) : (
                <div className="rb-mg-card is-empty">
                  {t`Pick the record to merge into this one`}
                </div>
              )}
            </div>
          </div>
          {isDefined(secondaryId) && (
            <div className="rb-mg-body">
              <div className="rb-mg-props">
                <div className="rb-mg-props-head">
                  <span className="rb-mg-section-title">
                    {t`Customize properties`}
                  </span>
                  <span className="rb-sp" />
                  <span className="rb-mg-toggle">
                    <Toggle
                      aria-label={t`Show only differences`}
                      checked={isOnlyDifferences}
                      onChange={setIsOnlyDifferences}
                    />
                    {t`Show only differences`}
                  </span>
                  <Input
                    variant="search"
                    size="sm"
                    placeholder={t`Search properties`}
                    aria-label={t`Search properties`}
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </div>
                <div className="rb-mg-props-list">
                  {loading && !isDefined(preview) && (
                    <div className="rb-dt-empty">{t`Comparing records…`}</div>
                  )}
                  {visiblePlan.map((entry) => {
                    const label =
                      fieldsByName.get(entry.name)?.label ?? entry.name;
                    const side = sideOf(entry);
                    const isChoice = entry.mode === 'choice';

                    return (
                      <div
                        key={entry.name}
                        className={cx('rb-mg-prop', !isChoice && 'is-locked')}
                      >
                        <div className="rb-mg-prop-label">
                          <span>{label}</span>
                          {isDefined(entry.note) && (
                            <span className="rb-mg-prop-note">
                              {entry.note}
                            </span>
                          )}
                        </div>
                        <div className="rb-mg-prop-values">
                          <label
                            className={cx(
                              'rb-mg-value',
                              side === 'primary' && 'is-chosen',
                            )}
                          >
                            <input
                              type="radio"
                              name={`rb-mg-${entry.name}`}
                              checked={side === 'primary'}
                              disabled={!isChoice}
                              onChange={() =>
                                setOverrides((current) => ({
                                  ...current,
                                  [entry.name]: 'primary',
                                }))
                              }
                            />
                            {renderValue(primary, entry.name)}
                          </label>
                          <span className="rb-mg-wire" aria-hidden>
                            <Icon
                              name={
                                side === 'primary'
                                  ? 'chevron-left'
                                  : 'chevron-right'
                              }
                              size={14}
                            />
                          </span>
                          <label
                            className={cx(
                              'rb-mg-value',
                              side === 'secondary' && 'is-chosen',
                            )}
                          >
                            <input
                              type="radio"
                              name={`rb-mg-${entry.name}`}
                              checked={side === 'secondary'}
                              disabled={!isChoice}
                              onChange={() =>
                                setOverrides((current) => ({
                                  ...current,
                                  [entry.name]: 'secondary',
                                }))
                              }
                            />
                            {renderValue(secondary, entry.name)}
                          </label>
                        </div>
                      </div>
                    );
                  })}
                  {isDefined(preview) && visiblePlan.length === 0 && (
                    <div className="rb-dt-empty">
                      {isOnlyDifferences
                        ? t`No differences. Turn off Show only differences to see every property.`
                        : t`No properties match.`}
                    </div>
                  )}
                </div>
              </div>
              <aside className="rb-mg-preview">
                <div className="rb-mg-section-title">
                  {t`Merged record preview`}
                </div>
                <div className="rb-mg-preview-name">{primaryName}</div>
                {(preview?.plan ?? [])
                  .filter((entry) => entry.mode !== 'kept')
                  .map((entry) => (
                    <div key={entry.name} className="rb-mg-preview-row">
                      <span className="rb-mg-preview-label">
                        {fieldsByName.get(entry.name)?.label ?? entry.name}
                      </span>
                      <span className="rb-mg-preview-value">
                        {entry.mode === 'fixed' && entry.isDifferent ? (
                          <span className="rb-dt-muted">{entry.note}</span>
                        ) : (
                          renderValue(
                            sideOf(entry) === 'primary' ? primary : secondary,
                            entry.name,
                          )
                        )}
                      </span>
                    </div>
                  ))}
              </aside>
            </div>
          )}
        </div>
      </Modal>
      {isConflictOpen && isDefined(preview?.companyConflict) && (
        <RoboostMergeCompanyConflictModal
          primaryRecord={primary}
          secondaryRecord={secondary}
          initialSide={companyPlan ? sideOf(companyPlan) : 'primary'}
          onClose={() => setIsConflictOpen(false)}
          onConfirm={(side) => {
            setIsConflictOpen(false);
            runMerge(side);
          }}
        />
      )}
    </>
  );
};
