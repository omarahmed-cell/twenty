import {
  ROBOOST_NOTIFICATIONS,
  ROBOOST_NOTIFICATION_COUNTS,
  ROBOOST_UPDATE_NOTIFICATIONS,
} from '@/roboost-app/notifications/graphql/roboostNotificationQueries';
import {
  type RoboostNotification,
  type RoboostNotificationTab,
  type RoboostNotificationType,
} from '@/roboost-app/notifications/types/RoboostNotification';
import { useApolloClient } from '@apollo/client/react';
import { useCallback, useEffect, useState } from 'react';

const PAGE_SIZE = 30;

type NotificationPage = {
  roboostNotifications: { items: RoboostNotification[]; hasMore: boolean };
};

export type RoboostNotificationAction =
  | 'READ'
  | 'UNREAD'
  | 'TRASH'
  | 'RESTORE'
  | 'DELETE';

// One tab of the panel, paged by (createdAt, id) so new notifications never shift what is loaded
export const useRoboostNotificationList = ({
  tab,
  type,
  isOpen,
}: {
  tab: RoboostNotificationTab;
  type: RoboostNotificationType | null;
  isOpen: boolean;
}) => {
  const client = useApolloClient();
  const [items, setItems] = useState<RoboostNotification[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fetchPage = useCallback(
    async (before: string | null) => {
      const { data } = await client.query<NotificationPage>({
        query: ROBOOST_NOTIFICATIONS,
        variables: { tab, type, before, limit: PAGE_SIZE },
        fetchPolicy: 'network-only',
      });

      return data?.roboostNotifications ?? { items: [], hasMore: false };
    },
    [client, tab, type],
  );

  const reload = useCallback(async () => {
    setIsLoading(true);
    try {
      const page = await fetchPage(null);

      setItems(page.items);
      setHasMore(page.hasMore);
    } finally {
      setIsLoading(false);
    }
  }, [fetchPage]);

  const loadMore = async () => {
    const last = items[items.length - 1];

    if (!hasMore || isLoading || last === undefined) {
      return;
    }
    setIsLoading(true);
    try {
      const page = await fetchPage(`${last.createdAt}|${last.id}`);

      setItems((current) => [
        ...current,
        ...page.items.filter(
          (item) => !current.some((existing) => existing.id === item.id),
        ),
      ]);
      setHasMore(page.hasMore);
    } finally {
      setIsLoading(false);
    }
  };

  const apply = async ({
    action,
    ids,
    allInTab,
  }: {
    action: RoboostNotificationAction;
    ids?: string[];
    allInTab?: RoboostNotificationTab;
  }) => {
    await client.mutate({
      mutation: ROBOOST_UPDATE_NOTIFICATIONS,
      variables: { action, ids: ids ?? [], allInTab: allInTab ?? null, type },
      refetchQueries: [{ query: ROBOOST_NOTIFICATION_COUNTS }],
    });
    await reload();
  };

  // Opening the panel or switching tab or type starts from the newest
  useEffect(() => {
    if (isOpen) {
      reload();
    }
  }, [isOpen, reload]);

  return { items, hasMore, isLoading, loadMore, reload, apply };
};
