import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { isNonEmptyString } from '@sniptt/guards';
import { useState } from 'react';
import { CoreObjectNameSingular } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';
import { IconPlaylistAdd, IconMinus } from 'twenty-ui/icon';
import { Button } from 'twenty-ui/primitives/input';
import { themeCssVariables } from 'twenty-ui/theme';

import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { useSidePanelMenu } from '@/side-panel/hooks/useSidePanelMenu';
import { useUpdateSegmentMembership } from '@/side-panel/pages/segment-membership/hooks/useUpdateSegmentMembership';
import { segmentMembershipRequestComponentState } from '@/side-panel/pages/segment-membership/states/segmentMembershipRequestComponentState';
import { getSegmentTargetObject } from '@/side-panel/pages/segment-membership/utils/getSegmentTargetObject';
import { Select } from '@/ui/input/components/Select';
import { SidePanelFooter } from '@/ui/layout/side-panel/components/SidePanelFooter';
import { useAtomComponentStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomComponentStateValue';

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

type SegmentOptionRecord = {
  id: string;
  name: string | null;
  __typename: 'Segment';
};

export const SidePanelSegmentMembershipPage = () => {
  const segmentMembershipRequest = useAtomComponentStateValue(
    segmentMembershipRequestComponentState,
  );

  const [segmentId, setSegmentId] = useState<string | null>(null);

  const { t } = useLingui();
  const { closeSidePanelMenu } = useSidePanelMenu();

  const targetObject = getSegmentTargetObject(segmentMembershipRequest.objectNameSingular);

  const { records: segments, loading } =
    useFindManyRecords<SegmentOptionRecord>({
      objectNameSingular: CoreObjectNameSingular.Segment,
      filter: { targetObject: { eq: targetObject } },
      orderBy: [{ name: 'AscNullsLast' }],
      recordGqlFields: { id: true, name: true },
      skip: !isDefined(targetObject),
    });

  const { updateSegmentMembership, isUpdating } = useUpdateSegmentMembership({
    segmentId,
    request: segmentMembershipRequest,
    onCompleted: closeSidePanelMenu,
  });

  const isAdd = segmentMembershipRequest.operation === 'ADD';

  return (
    <StyledContainer>
      <StyledContent>
        <Select
          dropdownId="segment-membership-segment-select"
          label={t`Segment`}
          fullWidth
          withSearchInput
          disabled={isUpdating || segments.length === 0}
          value={segmentId ?? undefined}
          emptyOption={{ label: t`Pick a segment`, value: '' }}
          options={segments.map((segment) => ({
            label: isNonEmptyString(segment.name)
              ? segment.name
              : t`Untitled segment`,
            value: segment.id,
          }))}
          onChange={(value) =>
            setSegmentId(isNonEmptyString(value) ? value : null)
          }
        />
        {!loading && segments.length === 0 && (
          <StyledHint>
            {t`No segment targets this object yet. Create one in Segments first.`}
          </StyledHint>
        )}
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
            key="update-segment-membership"
            size="sm"
            startIcon={isAdd ? <IconPlaylistAdd /> : <IconMinus />}
            loading={isUpdating}
            disabled={isUpdating || !isDefined(segmentId)}
            onClick={updateSegmentMembership}
            variant="solid"
            color={isAdd ? 'accent' : 'danger'}
          >
            {isAdd ? t`Add to segment` : t`Remove from segment`}
          </Button>,
        ]}
      />
    </StyledContainer>
  );
};
