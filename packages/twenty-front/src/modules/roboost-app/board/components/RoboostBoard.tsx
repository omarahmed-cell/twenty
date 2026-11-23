import { useApolloCoreClient } from '@/object-metadata/hooks/useApolloCoreClient';
import { useObjectMetadataItems } from '@/object-metadata/hooks/useObjectMetadataItems';
import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { useUpdateOneRecord } from '@/object-record/hooks/useUpdateOneRecord';
import { RoboostBoardColumn } from '@/roboost-app/board/components/RoboostBoardColumn';
import { type RoboostPipeline } from '@/roboost-app/board/hooks/useRoboostPipelines';
import { getRoboostLabelIdentifierFieldName } from '@/roboost-app/fields/getRoboostRecordLabel';
import { useRoboostRequiredFieldsCheck } from '@/roboost-app/fields/hooks/useRoboostRequiredFieldsCheck';
import { getRoboostListRecordGqlFields } from '@/roboost-app/list/utils/getRoboostListRecordGqlFields';
import { Icon } from '@/roboost-ui/components/Icon';
import { useLingui } from '@lingui/react/macro';
import { isNonEmptyString } from '@sniptt/guards';
import { useState } from 'react';
import {
  type RecordGqlFields,
  type RecordGqlOperationFilter,
} from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

type RoboostBoardProps = {
  objectMetadataItem: EnrichedObjectMetadataItem;
  pipeline: RoboostPipeline;
  filter: RecordGqlOperationFilter;
  cardFields: FieldMetadataItem[];
  ownerField: FieldMetadataItem | undefined;
};

// Grey stage columns, each with its own scroll; moves go through the server's pipeline rules
export const RoboostBoard = ({
  objectMetadataItem,
  pipeline,
  filter,
  cardFields,
  ownerField,
}: RoboostBoardProps) => {
  const { t } = useLingui();
  const { objectMetadataItems } = useObjectMetadataItems();
  const apolloCoreClient = useApolloCoreClient();
  const { completeChange } = useRoboostRequiredFieldsCheck(objectMetadataItem);
  const { updateOneRecord } = useUpdateOneRecord();
  const [dragged, setDragged] = useState<{
    recordId: string;
    fromStage: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isMoving, setIsMoving] = useState(false);

  const findField = (name: string) =>
    objectMetadataItem.fields.find(
      (field) => field.name === name && field.isActive,
    );
  const labelField = findField(
    getRoboostLabelIdentifierFieldName(objectMetadataItem),
  );
  const hasAmount = isDefined(findField('amount'));
  const recordGqlFields: RecordGqlFields = {
    ...getRoboostListRecordGqlFields(
      objectMetadataItem,
      [
        labelField,
        ownerField,
        findField('amount'),
        findField('stage'),
        ...cardFields,
      ].filter(isDefined),
      objectMetadataItems,
    ),
    ...(isDefined(findField('lastActivityDate'))
      ? { lastActivityDate: true }
      : {}),
    ...(isDefined(findField('nextActivityDate'))
      ? { nextActivityDate: true }
      : {}),
  };

  const pipelineFilter: RecordGqlOperationFilter =
    pipeline.key !== ''
      ? { and: [filter, { pipeline: { eq: pipeline.key } }] }
      : filter;

  const moveTo = async (toStage: string) => {
    if (!isDefined(dragged) || dragged.fromStage === toStage) {
      setDragged(null);
      return;
    }
    const { recordId } = dragged;

    setDragged(null);
    setError(null);
    setIsMoving(true);
    try {
      const input = await completeChange({
        recordId,
        record: { id: recordId },
        changes: { stage: toStage },
        pipelineKey: pipeline.key !== '' ? pipeline.key : undefined,
      });

      if (input === null) {
        return;
      }
      await updateOneRecord({
        objectNameSingular: objectMetadataItem.nameSingular,
        idToUpdate: recordId,
        updateOneRecordInput: input,
      });
    } catch (moveError) {
      setError(
        moveError instanceof Error && isNonEmptyString(moveError.message)
          ? moveError.message
          : t`This move is not allowed.`,
      );
    } finally {
      await apolloCoreClient.refetchQueries({ include: 'active' });
      setIsMoving(false);
    }
  };

  return (
    <div className="rb-board-wrap">
      {isNonEmptyString(error) && (
        <div className="rb-board-error" role="alert">
          <Icon name="info" size={15} />
          <span>{error}</span>
          <button
            type="button"
            className="rb-rc-iconbtn"
            aria-label={t`Dismiss`}
            onClick={() => setError(null)}
          >
            <Icon name="x" size={14} />
          </button>
        </div>
      )}
      <div className={isMoving ? 'rb-board is-moving' : 'rb-board'}>
        {pipeline.stages.map((stage) => (
          <RoboostBoardColumn
            key={`${pipeline.key}-${stage.value}`}
            objectMetadataItem={objectMetadataItem}
            stage={stage}
            pipelineKey={pipeline.key}
            filter={pipelineFilter}
            recordGqlFields={recordGqlFields}
            cardFields={cardFields}
            ownerField={ownerField}
            hasAmount={hasAmount}
            draggedRecordId={dragged?.recordId ?? null}
            onDragStart={(recordId, fromStage) =>
              setDragged({ recordId, fromStage })
            }
            onDragEnd={() => setDragged(null)}
            onDropRecord={moveTo}
          />
        ))}
      </div>
    </div>
  );
};
