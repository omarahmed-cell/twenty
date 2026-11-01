import { CombinedGraphQLErrors } from '@apollo/client/errors';
import { useMutation } from '@apollo/client/react';
import { plural, t } from '@lingui/core/macro';
import { isDefined } from 'twenty-shared/utils';
import { useToast } from 'twenty-ui/components';

import { type SegmentMembershipRequest } from '@/side-panel/pages/segment-membership/types/SegmentMembershipRequest';
import {
  AddRecordsToSegmentDocument,
  RemoveRecordsFromSegmentDocument,
} from '~/generated-metadata/graphql';
import { getErrorMessageFromApolloError } from '~/utils/get-error-message-from-apollo-error.util';

type UseUpdateSegmentMembershipArgs = {
  onCompleted: () => void;
};

export const useUpdateSegmentMembership = ({
  onCompleted,
}: UseUpdateSegmentMembershipArgs) => {
  const { enqueueToast } = useToast();

  const [addRecordsToSegment, { loading: isAdding }] = useMutation(
    AddRecordsToSegmentDocument,
  );
  const [removeRecordsFromSegment, { loading: isRemoving }] = useMutation(
    RemoveRecordsFromSegmentDocument,
  );

  const updateSegmentMembership = async ({
    segmentId,
    request,
  }: {
    segmentId: string | null;
    request: SegmentMembershipRequest;
  }): Promise<void> => {
    if (!isDefined(segmentId)) {
      return;
    }

    const input = {
      segmentId,
      objectNameSingular: request.objectNameSingular,
      recordFilter: request.recordFilter,
    };

    try {
      if (request.operation === 'ADD') {
        const { data } = await addRecordsToSegment({ variables: { input } });
        const affectedRecordCount =
          data?.addRecordsToSegment.affectedRecordCount ?? 0;

        enqueueToast({
          status: 'success',
          children: plural(affectedRecordCount, {
            one: '# record added to the segment',
            other: '# records added to the segment',
          }),
        });
      } else {
        const { data } = await removeRecordsFromSegment({
          variables: { input },
        });
        const affectedRecordCount =
          data?.removeRecordsFromSegment.affectedRecordCount ?? 0;

        enqueueToast({
          status: 'success',
          children: plural(affectedRecordCount, {
            one: '# record removed from the segment',
            other: '# records removed from the segment',
          }),
        });
      }

      onCompleted();
    } catch (error) {
      enqueueToast({
        status: 'error',
        children: CombinedGraphQLErrors.is(error)
          ? getErrorMessageFromApolloError(error)
          : t`Failed to update the segment. Please try again.`,
      });
    }
  };

  return {
    updateSegmentMembership,
    isUpdating: isAdding || isRemoving,
  };
};
