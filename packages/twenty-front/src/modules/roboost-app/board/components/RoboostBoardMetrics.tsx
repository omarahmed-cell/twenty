import { useRoboostCurrencies } from '@/roboost-app/currencies/hooks/useRoboostCurrencies';
import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { useAggregateRecords } from '@/object-record/hooks/useAggregateRecords';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { formatRoboostMoney } from '@/roboost-app/board/utils/formatRoboostMoney';
import { useLingui } from '@lingui/react/macro';
import { isString } from '@sniptt/guards';
import {
  AggregateOperations,
  type RecordGqlOperationFilter,
} from 'twenty-shared/types';

const AGE_SAMPLE_LIMIT = 500;
const DAY_MS = 24 * 60 * 60 * 1000;

type SumData = { [fieldName: string]: { [AggregateOperations.SUM]?: number } };

const useSum = (
  objectNameSingular: string,
  fieldName: string,
  filter: RecordGqlOperationFilter,
  skip: boolean,
) => {
  const { data } = useAggregateRecords<SumData>({
    objectNameSingular,
    filter,
    recordGqlFieldsAggregate: { [fieldName]: [AggregateOperations.SUM] },
    skip,
  });

  return Number(data[fieldName]?.[AggregateOperations.SUM] ?? 0);
};

type RoboostBoardMetricsProps = {
  objectMetadataItem: EnrichedObjectMetadataItem;
  filter: RecordGqlOperationFilter;
};

// Pipeline totals over the deals the board currently shows
export const RoboostBoardMetrics = ({
  objectMetadataItem,
  filter,
}: RoboostBoardMetricsProps) => {
  const { t } = useLingui();
  const hasField = (name: string) =>
    objectMetadataItem.fields.some(
      (field) => field.name === name && field.isActive,
    );
  const objectName = objectMetadataItem.nameSingular;
  const hasOpenFlag = hasField('isOpen');
  const openFilter: RecordGqlOperationFilter = hasOpenFlag
    ? { and: [filter, { isOpen: { eq: true } }] }
    : filter;
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const total = useSum(objectName, 'amountInCompanyCurrency', filter, false);
  const weightedOpen = useSum(
    objectName,
    'weightedAmountInCompanyCurrency',
    openFilter,
    !hasField('weightedAmountInCompanyCurrency'),
  );
  const openValue = useSum(
    objectName,
    'amountInCompanyCurrency',
    openFilter,
    !hasOpenFlag,
  );
  const closedWon = useSum(
    objectName,
    'amountInCompanyCurrency',
    { and: [filter, { isClosedWon: { eq: true } }] },
    !hasField('isClosedWon'),
  );
  const newAmount = useSum(
    objectName,
    'amountInCompanyCurrency',
    { and: [filter, { createdAt: { gte: monthStart.toISOString() } }] },
    false,
  );
  const { records: openRecords } = useFindManyRecords<ObjectRecord>({
    objectNameSingular: objectName,
    filter: openFilter,
    recordGqlFields: { id: true, createdAt: true },
    limit: AGE_SAMPLE_LIMIT,
  });

  const { companyCurrency } = useRoboostCurrencies();
  const currencyCode = companyCurrency?.code ?? 'USD';
  const ages = openRecords
    .map((record) =>
      isString(record.createdAt)
        ? (now.getTime() - new Date(record.createdAt).getTime()) / DAY_MS
        : null,
    )
    .filter((age): age is number => age !== null);
  const averageAge =
    ages.length > 0 ? ages.reduce((sum, age) => sum + age, 0) / ages.length : 0;

  const metrics = [
    {
      id: 'total',
      label: t`Total deal amount`,
      value: formatRoboostMoney(total, currencyCode, true),
    },
    ...(hasField('weightedAmount')
      ? [
          {
            id: 'weighted',
            label: t`Weighted open pipeline`,
            value: formatRoboostMoney(weightedOpen, currencyCode, true),
          },
        ]
      : []),
    ...(hasOpenFlag
      ? [
          {
            id: 'open',
            label: t`Open pipeline value`,
            value: formatRoboostMoney(openValue, currencyCode, true),
          },
        ]
      : []),
    ...(hasField('isClosedWon')
      ? [
          {
            id: 'won',
            label: t`Closed won revenue`,
            value: formatRoboostMoney(closedWon, currencyCode, true),
          },
        ]
      : []),
    {
      id: 'new',
      label: t`New deal amount this month`,
      value: formatRoboostMoney(newAmount, currencyCode, true),
    },
    {
      id: 'age',
      label: t`Average deal age`,
      value: t`${averageAge.toFixed(1)} days`,
    },
  ];

  return (
    <div className="rb-metrics" role="list">
      {metrics.map((metric) => (
        <div key={metric.id} className="rb-metric" role="listitem">
          <span className="rb-metric-label">{metric.label}</span>
          <span className="rb-metric-value">{metric.value}</span>
        </div>
      ))}
    </div>
  );
};
