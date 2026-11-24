import { ROBOOST_NOTIFICATION_TYPES_USER_VAR } from '@/roboost-app/notifications/constants/RoboostNotificationTypesUserVar';
import { type RoboostNotificationType } from '@/roboost-app/notifications/types/RoboostNotification';
import { useRoboostUserVars } from '@/roboost-app/hooks/useRoboostUserVars';
import { Toggle } from '@/roboost-ui/components/Toggle';
import { SettingsPageContainer } from '@/settings/components/SettingsPageContainer';
import { SettingsPageLayout } from '@/settings/components/layout/SettingsPageLayout';
import { Trans, useLingui } from '@lingui/react/macro';
import { SettingsPath } from 'twenty-shared/types';
import { getSettingsPath } from 'twenty-shared/utils';
import { Section } from 'twenty-ui/components/layout';

type NotificationPreferences = Partial<
  Record<RoboostNotificationType, boolean>
>;

export const SettingsRoboostNotifications = () => {
  const { t } = useLingui();
  const { getUserVar, setUserVar } = useRoboostUserVars();
  const preferences =
    getUserVar<NotificationPreferences>(ROBOOST_NOTIFICATION_TYPES_USER_VAR) ??
    {};

  const rows: {
    type: RoboostNotificationType;
    label: string;
    description: string;
  }[] = [
    {
      type: 'assign',
      label: t`Assign`,
      description: t`A company, contact, deal or service is assigned to you.`,
    },
    {
      type: 'export',
      label: t`Export`,
      description: t`Your export is ready to download, or someone exported a large file.`,
    },
    {
      type: 'import',
      label: t`Import`,
      description: t`Your import finished, finished with errors or failed.`,
    },
    {
      type: 'task',
      label: t`Task`,
      description: t`A task is assigned to you, a reminder is due, or tasks are overdue.`,
    },
  ];

  return (
    <SettingsPageLayout
      title={t`Notifications`}
      links={[
        {
          children: <Trans>User</Trans>,
          href: getSettingsPath(SettingsPath.ProfilePage),
        },
        { children: <Trans>Notifications</Trans> },
      ]}
    >
      <SettingsPageContainer>
        <Section.Root>
          <Section.Header
            title={t`Bell notifications`}
            description={t`Choose which notifications reach your bell. These preferences apply only to you.`}
          />
          <div className="rb-ui rb-notif-prefs">
            {rows.map((row) => (
              <label key={row.type} className="rb-notif-pref">
                <span className="rb-notif-pref-text">
                  <b>{row.label}</b>
                  <span>{row.description}</span>
                </span>
                <Toggle
                  aria-label={t`${row.label} notifications`}
                  checked={preferences[row.type] !== false}
                  onChange={(checked) =>
                    setUserVar(ROBOOST_NOTIFICATION_TYPES_USER_VAR, {
                      ...preferences,
                      [row.type]: checked,
                    })
                  }
                />
              </label>
            ))}
          </div>
        </Section.Root>
      </SettingsPageContainer>
    </SettingsPageLayout>
  );
};
