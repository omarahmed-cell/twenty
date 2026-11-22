import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { useAggregateRecords } from '@/object-record/hooks/useAggregateRecords';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { RoboostBoardCard } from '@/roboost-app/board/components/RoboostBoardCard';
import { type RoboostPipelineStage } from '@/roboost-app/board/hooks/useRoboostPipelines';
import { formatRoboostMoney } from '@/roboost-app/board/utils/formatRoboostMoney';
import { useOpenRoboostCreatePanel } from '@/roboost-app/hooks/useOpenRoboostCreatePanel';
import { getRoboostOptionTone } from '@/roboost-app/utils/getRoboostOptionTone';
import { Icon } from '@/roboost-ui/components/Icon';
import { Menu } from '@/roboost-ui/components/Menu';
import { Tag } from '@/roboost-ui/components/Tag';
import { cx } from '@/roboost-ui/utils/cx';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import {
  AggregateOperations,
  type RecordGqlFields,
  type RecordGqlOperationFilter,
} from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

const COLUMN_RECORD_LIMIT = 100;

type RoboostBoardColumnProps = {
  objectMetadataItem: EnrichedObjectMetadataItem;
  stage: RoboostPipelineStage;
  pipelineKey: string;
  filter: RecordGqlOperationFilter;
  recordGqlFields: RecordGqlFields;
  cardFields: FieldMetadataItem[];
  ownerField: FieldMetadataItem | undefined;
  hasAmount: boolean;
  draggedRecordId: string | null;
  onDragStart: (recordId: string, fromStage: string) => void;
  onDragEnd: () => void;
  onDropRecord: (toStage: string) => void;
};

export const RoboostBoardColumn = ({
  objectMetadataItem,
  stage,
  pipelineKey,
  filter,
  recordGqlFields,
  cardFields,
  ownerField,
  hasAmount,
  draggedRecordId,
  onDragStart,
  onDragEnd,
  onDropRecord,
}: RoboostBoardColumnProps) => {
  const { t } = useLingui();
  const openCreatePanel = useOpenRoboostCreatePanel();
  const [isOver, setIsOver] = useState(false);
  const columnFilter: RecordGqlOperationFilter = {
    and: [filter, { stage: { eq: stage.value } }],
  };

  const { records, totalCount, loading } = useFindManyRecords<ObjectRecord>({
    objectNameSingular: objectMetadataItem.nameSingular,
    filter: columnFilter,
    recordGqlFields,
    orderBy: [{ position: 'AscNullsLast' }, { createdAt: 'DescNullsLast' }],
    limit: COLUMN_RECORD_LIMIT,
  });

  const { data: aggregate } = useAggregateRecords<{
    amount?: { [AggregateOperations.SUM]?: number };
  }>({
    objectNameSingular: objectMetadataItem.nameSingular,
    filter: columnFilter,
    recordGqlFieldsAggregate: { amount: [AggregateOperations.SUM] },
    skip: !hasAmount,
  });

  const currencyCode =
    (records[0]?.amount as { currencyCode?: string } | undefined)
      ?.currencyCode ?? 'USD';
  const totalMicros = Number(aggregate.amount?.[AggregateOperations.SUM] ?? 0);
  const probability = stage.probability;
  const tone = getRoboostOptionTone({
    value: stage.value,
    color: stage.color,
  }).tone;

  return (
    <section
      className={cx('rb-bcol', isOver && 'is-over')}
      aria-label={stage.label}
      onDragOver={(event) => {
        if (isDefined(draggedRecordId)) {
          event.preventDefault();
          setIsOver(true);
        }
      }}
      onDragLeave={() => setIsOver(false)}
      onDrop={(event) => {
        event.preventDefault();
        setIsOver(false);
        onDropRecord(stage.value);
      }}
    >
      <div className="rb-bcol-head">
        <Tag tone={tone}>{stage.label}</Tag>
        <span className="rb-bcol-count">{totalCount ?? records.length}</span>
        <span className="rb-sp" />
        <Menu
          align="right"
          entries={[
            {
              id: 'add',
              label: t`Add ${objectMetadataItem.labelSingular.toLowerCase()} here`,
              icon: 'plus',
              onSelect: () =>
                openCreatePanel({
                  objectNameSingular: objectMetadataItem.nameSingular,
                  presetValues: {
                    stage: stage.value,
                    ...(pipelineKey !== '' ? { pipeline: pipelineKey } : {}),
                  },
                }),
            },
          ]}
          trigger={({ toggle, isOpen }) => (
            <button
              type="button"
              className="rb-rc-iconbtn"
              aria-label={t`${stage.label} options`}
              aria-expanded={isOpen}
              onClick={toggle}
            >
              <Icon name="more" size={14} />
            </button>
          )}
        />
      </div>
      <div className="rb-bcol-cards">
        {records.map((record) => (
          <RoboostBoardCard
            key={record.id}
            record={record}
            objectMetadataItem={objectMetadataItem}
            cardFields={cardFields}
            ownerField={ownerField}
            isDragging={draggedRecordId === record.id}
            onDragStart={() => onDragStart(record.id, stage.value)}
            onDragEnd={onDragEnd}
          />
        ))}
        {records.length === 0 && (
          <div className="rb-bcol-empty">
            {loading ? t`Loading…` : t`Nothing in this stage.`}
          </div>
        )}
        {(totalCount ?? 0) > records.length && (
          <div className="rb-bcol-more">
            {t`Showing ${records.length} of ${totalCount}. Narrow with filters to see the rest.`}
          </div>
        )}
      </div>
      {hasAmount && (
        <div className="rb-bcol-foot">
          <div>
            <b>{formatRoboostMoney(totalMicros, currencyCode)}</b>{' '}
            {t`Total amount`}
          </div>
          {isDefined(probability) && (
            <div>
              <b>
                {formatRoboostMoney(
                  (totalMicros * probability) / 100,
                  currencyCode,
                )}
              </b>{' '}
              ({probability}%) {t`Weighted amount`}
            </div>
          )}
        </div>
      )}
    </section>
  );
};
