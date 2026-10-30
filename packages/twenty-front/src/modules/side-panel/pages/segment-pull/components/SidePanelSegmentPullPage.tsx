import { CombinedGraphQLErrors } from '@apollo/client/errors';
import { useMutation } from '@apollo/client/react';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { isNonEmptyString } from '@sniptt/guards';
import { useState } from 'react';
import { SEGMENT_TARGET_OBJECT_NAME_SINGULARS } from 'twenty-shared/constants';
import {
  AppPath,
  CoreObjectNameSingular,
  type SegmentTargetObject,
} from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';
import { useToast } from 'twenty-ui/components';
import { IconArrowMerge } from 'twenty-ui/icon';
import { Button } from 'twenty-ui/primitives/input';
import { themeCssVariables } from 'twenty-ui/theme';

import { useObjectMetadataItems } from '@/object-metadata/hooks/useObjectMetadataItems';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { useFindOneRecord } from '@/object-record/hooks/useFindOneRecord';
import { useSidePanelMenu } from '@/side-panel/hooks/useSidePanelMenu';
import { segmentPullSourceSegmentIdComponentState } from '@/side-panel/pages/segment-pull/states/segmentPullSourceSegmentIdComponentState';
import { getSegmentPullRelationOptions } from '@/side-panel/pages/segment-pull/utils/getSegmentPullRelationOptions';
import { getSegmentPullResultMessage } from '@/side-panel/pages/segment-pull/utils/getSegmentPullResultMessage';
import { Select } from '@/ui/input/components/Select';
import { TextInput } from '@/ui/input/components/TextInput';
import { SidePanelFooter } from '@/ui/layout/side-panel/components/SidePanelFooter';
import { useAtomComponentStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomComponentStateValue';
import { PullAssociatedRecordsIntoSegmentDocument } from '~/generated-metadata/graphql';
import { useNavigateApp } from '~/hooks/useNavigateApp';
import { getErrorMessageFromApolloError } from '~/utils/get-error-message-from-apollo-error.util';

const NEW_SEGMENT_OPTION_VALUE = 'new-segment';

const StyledContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const StyledContent = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[4]};
  overflow-y: auto;
  padding: ${themeCssVariables.spacing[4]};
`;

const StyledHint = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
`;

type SegmentRecord = {
  id: string;
  name: string | null;
  targetObject: SegmentTargetObject | null;
  __typename: 'Segment';
};

export const SidePanelSegmentPullPage = () => {
  const segmentPullSourceSegmentId = useAtomComponentStateValue(
    segmentPullSourceSegmentIdComponentState,
  );

  const [relationFieldMetadataId, setRelationFieldMetadataId] = useState<
    string | null
  >(null);
  const [targetSegmentId, setTargetSegmentId] = useState(
    NEW_SEGMENT_OPTION_VALUE,
  );
  const [newSegmentName, setNewSegmentName] = useState('');

  const { t } = useLingui();
  const { enqueueToast } = useToast();
  const { closeSidePanelMenu } = useSidePanelMenu();
  const navigate = useNavigateApp();
  const { objectMetadataItems } = useObjectMetadataItems();

  const { record: sourceSegment } = useFindOneRecord<SegmentRecord>({
    objectNameSingular: CoreObjectNameSingular.Segment,
    objectRecordId: segmentPullSourceSegmentId ?? undefined,
    recordGqlFields: { id: true, name: true, targetObject: true },
    skip: !isDefined(segmentPullSourceSegmentId),
  });

  const sourceObjectMetadataItem = isDefined(sourceSegment?.targetObject)
    ? objectMetadataItems.find(
        (objectMetadataItem) =>
          objectMetadataItem.nameSingular ===
          SEGMENT_TARGET_OBJECT_NAME_SINGULARS[sourceSegment.targetObject!],
      )
    : undefined;

  const relationOptions = isDefined(sourceObjectMetadataItem)
    ? getSegmentPullRelationOptions({
        sourceObjectMetadataItem,
        objectMetadataItems,
      })
    : [];

  const selectedRelationOption = relationOptions.find(
    (relationOption) => relationOption.value === relationFieldMetadataId,
  );

  const { records: targetSegments } = useFindManyRecords<SegmentRecord>({
    objectNameSingular: CoreObjectNameSingular.Segment,
    filter: {
      targetObject: { eq: selectedRelationOption?.targetObject },
      ...(isDefined(segmentPullSourceSegmentId)
        ? { id: { neq: segmentPullSourceSegmentId } }
        : {}),
    },
    orderBy: [{ name: 'AscNullsLast' }],
    recordGqlFields: { id: true, name: true },
    skip: !isDefined(selectedRelationOption),
  });

  const [pullAssociatedRecordsIntoSegment, { loading: isPulling }] =
    useMutation(PullAssociatedRecordsIntoSegmentDocument);

  const isNewSegment = targetSegmentId === NEW_SEGMENT_OPTION_VALUE;

  const canPull =
    isDefined(segmentPullSourceSegmentId) &&
    isDefined(selectedRelationOption) &&
    (!isNewSegment || isNonEmptyString(newSegmentName.trim()));

  const handleRelationChange = (value: string | null) => {
    const relationOption = relationOptions.find(
      (option) => option.value === value,
    );

    setRelationFieldMetadataId(relationOption?.value ?? null);
    setTargetSegmentId(NEW_SEGMENT_OPTION_VALUE);

    if (isDefined(relationOption) && isNonEmptyString(sourceSegment?.name)) {
      setNewSegmentName(`${sourceSegment.name} ${relationOption.fieldLabel}`);
    }
  };

  const handlePull = async () => {
    if (!canPull) {
      return;
    }

    try {
      const { data } = await pullAssociatedRecordsIntoSegment({
        variables: {
          input: {
            sourceSegmentId: segmentPullSourceSegmentId,
            relationFieldMetadataId: selectedRelationOption.value,
            targetSegmentId: isNewSegment ? null : targetSegmentId,
            newTargetSegmentName: isNewSegment ? newSegmentName.trim() : null,
          },
        },
      });

      const result = data?.pullAssociatedRecordsIntoSegment;

      if (!isDefined(result)) {
        return;
      }

      enqueueToast({
        status: 'success',
        children: getSegmentPullResultMessage(result),
      });

      closeSidePanelMenu();
      navigate(AppPath.RecordShowPage, {
        objectNameSingular: CoreObjectNameSingular.Segment,
        objectRecordId: result.targetSegmentId,
      });
    } catch (error) {
      enqueueToast({
        status: 'error',
        children: CombinedGraphQLErrors.is(error)
          ? getErrorMessageFromApolloError(error)
          : t`Failed to pull the associated records. Please try again.`,
      });
    }
  };

  return (
    <StyledContainer>
      <StyledContent>
        <Select
          dropdownId="segment-pull-relation-select"
          label={t`Relation`}
          fullWidth
          disabled={isPulling || relationOptions.length === 0}
          value={relationFieldMetadataId ?? undefined}
          emptyOption={{ label: t`Pick a relation`, value: '' }}
          options={relationOptions.map(({ label, value }) => ({
            label,
            value,
          }))}
          onChange={(value) =>
            handleRelationChange(isNonEmptyString(value) ? value : null)
          }
        />
        {isDefined(selectedRelationOption) && (
          <Select
            dropdownId="segment-pull-target-segment-select"
            label={t`Target segment`}
            fullWidth
            withSearchInput
            disabled={isPulling}
            value={targetSegmentId}
            options={[
              { label: t`New segment`, value: NEW_SEGMENT_OPTION_VALUE },
              ...targetSegments.map((segment) => ({
                label: isNonEmptyString(segment.name)
                  ? segment.name
                  : t`Untitled segment`,
                value: segment.id,
              })),
            ]}
            onChange={setTargetSegmentId}
          />
        )}
        {isDefined(selectedRelationOption) && isNewSegment && (
          <TextInput
            label={t`New segment name`}
            value={newSegmentName}
            onChange={setNewSegmentName}
            disabled={isPulling}
            fullWidth
          />
        )}
        <StyledHint>
          {t`Fills the target segment with the records linked to this segment's members. Run "Refresh pull" on the target segment to update it later.`}
        </StyledHint>
      </StyledContent>
      <SidePanelFooter
        actions={[
          <Button
            key="cancel"
            size="sm"
            variant="outline"
            onClick={closeSidePanelMenu}
          >{t`Cancel`}</Button>,
          <Button
            key="pull-associated-records"
            size="sm"
            startIcon={<IconArrowMerge />}
            loading={isPulling}
            disabled={isPulling || !canPull}
            onClick={handlePull}
            variant="solid"
            color="accent"
          >
            {t`Pull records`}
          </Button>,
        ]}
      />
    </StyledContainer>
  );
};
