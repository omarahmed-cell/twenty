import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CalendarChannelEntity } from 'src/engine/metadata-modules/calendar-channel/entities/calendar-channel.entity';
import { ConnectedAccountEntity } from 'src/engine/metadata-modules/connected-account/entities/connected-account.entity';
import { ImportGoogleMeetRecordingsCommand } from 'src/modules/call-recording/google-meet/commands/import-google-meet-recordings.command';
import { GoogleMeetRecordingsImportCronCommand } from 'src/modules/call-recording/google-meet/crons/commands/google-meet-recordings-import.cron.command';
import { GoogleMeetRecordingsImportCronJob } from 'src/modules/call-recording/google-meet/crons/jobs/google-meet-recordings-import.cron.job';
import { GoogleMeetRecordingsImportJob } from 'src/modules/call-recording/google-meet/jobs/google-meet-recordings-import.job';
import { GoogleMeetRecordingsImportService } from 'src/modules/call-recording/google-meet/services/google-meet-recordings-import.service';
import { OAuth2ClientManagerModule } from 'src/modules/connected-account/oauth2-client-manager/oauth2-client-manager.module';

@Module({
  imports: [
    OAuth2ClientManagerModule,
    TypeOrmModule.forFeature([ConnectedAccountEntity, CalendarChannelEntity]),
  ],
  providers: [
    GoogleMeetRecordingsImportService,
    GoogleMeetRecordingsImportJob,
    GoogleMeetRecordingsImportCronJob,
    GoogleMeetRecordingsImportCronCommand,
    ImportGoogleMeetRecordingsCommand,
  ],
  exports: [GoogleMeetRecordingsImportCronCommand],
})
export class GoogleMeetRecordingModule {}
