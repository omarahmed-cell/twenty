import { Injectable, Logger } from '@nestjs/common';

import { isString } from '@sniptt/guards';
import { type GaxiosError } from 'gaxios';
import { google } from 'googleapis';

import { parseGaxiosError } from 'src/modules/calendar/calendar-event-import-manager/drivers/google-calendar/utils/parse-gaxios-error.util';
import { parseGoogleCalendarError } from 'src/modules/calendar/calendar-event-import-manager/drivers/google-calendar/utils/parse-google-calendar-error.util';
import { type GetCalendarEventsResponse } from 'src/modules/calendar/calendar-event-import-manager/services/calendar-get-events.service';
import { GoogleOAuth2ClientProvider } from 'src/modules/connected-account/oauth2-client-manager/drivers/google/google-oauth2-client.provider';
import { type ConnectedAccountEntity } from 'src/engine/metadata-modules/connected-account/entities/connected-account.entity';
import { TwentyConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';
import { isBeyondCalendarEventsImportHorizon } from 'src/modules/calendar/calendar-event-import-manager/utils/is-beyond-calendar-events-import-horizon.util';

@Injectable()
export class GoogleCalendarGetEventsService {
  private readonly logger = new Logger(GoogleCalendarGetEventsService.name);

  constructor(
    private readonly googleOAuth2ClientProvider: GoogleOAuth2ClientProvider,
    private readonly twentyConfigService: TwentyConfigService,
  ) {}

  public async getCalendarEvents(
    connectedAccount: Pick<ConnectedAccountEntity, 'provider' | 'id'>,
    syncCursor?: string,
  ): Promise<GetCalendarEventsResponse> {
    const oAuth2Client = await this.googleOAuth2ClientProvider.getClient(
      connectedAccount.id,
    );

    const googleCalendarClient = google.calendar({
      version: 'v3',
      auth: oAuth2Client,
    });

    let nextSyncToken: string | null | undefined;
    let nextPageToken: string | undefined;
    const calendarEventIds: string[] = [];
    const calendarEventIdsToDelete: string[] = [];

    let hasMoreEvents = true;

    const horizonDays = this.twentyConfigService.get(
      'CALENDAR_EVENTS_IMPORT_HORIZON_DAYS',
    );

    while (hasMoreEvents) {
      const googleCalendarEvents = await googleCalendarClient.events
        .list({
          calendarId: 'primary',
          maxResults: 500,
          singleEvents: true,
          syncToken: syncCursor,
          pageToken: nextPageToken,
          showDeleted: true,
        })
        .catch(async (error: GaxiosError) => {
          this.handleError(error);

          return {
            data: {
              items: [],
              nextSyncToken: undefined,
              nextPageToken: undefined,
            },
          };
        });

      nextSyncToken = googleCalendarEvents.data.nextSyncToken;
      nextPageToken = googleCalendarEvents.data.nextPageToken || undefined;

      const { items } = googleCalendarEvents.data;

      if (!items || items.length === 0) {
        break;
      }

      for (const item of items) {
        if (!isString(item.id)) {
          continue;
        }

        // Unbounded recurring series expand for decades; the weekly full resync picks these up later.
        const isBeyondHorizon = isBeyondCalendarEventsImportHorizon({
          startsAt: item.start?.dateTime ?? item.start?.date,
          horizonDays,
        });

        if (item.status === 'cancelled' || isBeyondHorizon) {
          calendarEventIdsToDelete.push(item.id);
        } else {
          calendarEventIds.push(item.id);
        }
      }

      if (!nextPageToken) {
        hasMoreEvents = false;
      }
    }

    return {
      calendarEventIds,
      calendarEventIdsToDelete,
      nextSyncCursor: nextSyncToken || '',
    };
  }

  private handleError(error: GaxiosError) {
    this.logger.error(
      `Error in ${GoogleCalendarGetEventsService.name} - getCalendarEvents`,
      error.code,
      error,
    );
    if (
      isString(error.code) &&
      [
        'ECONNRESET',
        'ENOTFOUND',
        'ECONNABORTED',
        'ETIMEDOUT',
        'ERR_NETWORK',
      ].includes(error.code)
    ) {
      throw parseGaxiosError(error);
    }
    if (error.response?.status !== 410) {
      this.logger.error(
        `Calendar event import error for Google Calendar. status: ${error.response?.status}`,
      );
      this.logger.error(error);
      const googleCalendarError = {
        code: error.response?.status,
        reason:
          error.response?.data?.error?.errors?.[0].reason ||
          error.response?.data?.error ||
          '',
        message:
          error.response?.data?.error?.errors?.[0].message ||
          error.response?.data?.error_description ||
          '',
      };

      throw parseGoogleCalendarError(googleCalendarError, { cause: error });
    }
  }
}
