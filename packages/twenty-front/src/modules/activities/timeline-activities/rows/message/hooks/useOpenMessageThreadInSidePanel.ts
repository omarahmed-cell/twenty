import { CoreObjectNameSingular } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

import { useOpenRecordInSidePanel } from '@/side-panel/hooks/useOpenRecordInSidePanel';

export const useOpenMessageThreadInSidePanel = () => {
  const { openRecordInSidePanel } = useOpenRecordInSidePanel();

  const openMessageThreadInSidePanel = (
    messageThreadId: string | null | undefined,
  ) => {
    if (isDefined(messageThreadId)) {
      openRecordInSidePanel({
        recordId: messageThreadId,
        objectNameSingular: CoreObjectNameSingular.MessageThread,
      });
    }
  };

  return { openMessageThreadInSidePanel };
};
