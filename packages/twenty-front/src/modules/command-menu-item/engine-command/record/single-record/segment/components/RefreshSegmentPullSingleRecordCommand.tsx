import { HeadlessEngineCommandWrapperEffect } from '@/command-menu-item/engine-command/components/HeadlessEngineCommandWrapperEffect';
import { useHeadlessCommandContextApi } from '@/command-menu-item/engine-command/hooks/useHeadlessCommandContextApi';
import { getSegmentPullResultMessage } from '@/side-panel/pages/segment-pull/utils/getSegmentPullResultMessage';
import { CombinedGraphQLErrors } from '@apollo/client/errors';
import { useMutation } from '@apollo/client/react';
import { t } from '@lingui/core/macro';
import { doNotTranslate } from 'twenty-shared/i18n';
import { isDefined } from 'twenty-shared/utils';
import { useToast } from 'twenty-ui/components';
import { RefreshSegmentPullDocument } from '~/generated-metadata/graphql';
import { getErrorMessageFromApolloError } from '~/utils/get-error-message-from-apollo-error.util';

export const RefreshSegmentPullSingleRecordCommand = () => {
  const { selectedRecords } = useHeadlessCommandContextApi();
  const segmentId = selectedRecords[0]?.id;

  const { enqueueToast } = useToast();
  const [refreshSegmentPull] = useMutation(RefreshSegmentPullDocument);

  if (!isDefined(segmentId)) {
    throw new Error(doNotTranslate('Segment ID is required to refresh a pull'));
  }

  const handleExecute = async () => {
    try {
      const { data } = await refreshSegmentPull({
        variables: { input: { segmentId } },
      });

      if (isDefined(data)) {
        enqueueToast({
          status: 'success',
          children: getSegmentPullResultMessage(data.refreshSegmentPull),
        });
      }
    } catch (error) {
      enqueueToast({
        status: 'error',
        children: CombinedGraphQLErrors.is(error)
          ? getErrorMessageFromApolloError(error)
          : t`Failed to refresh the segment. Please try again.`,
      });
    }
  };

  return <HeadlessEngineCommandWrapperEffect execute={handleExecute} />;
};
