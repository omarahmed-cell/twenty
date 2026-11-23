import { Module } from '@nestjs/common';

import { OAuth2ClientManagerModule } from 'src/modules/connected-account/oauth2-client-manager/oauth2-client-manager.module';
import { MeetingGooglePushJob } from 'src/modules/meeting/scheduling/jobs/meeting-google-push.job';
import { MeetingGooglePushListener } from 'src/modules/meeting/scheduling/listeners/meeting-google-push.listener';
import { MeetingSchedulingResolver } from 'src/modules/meeting/scheduling/resolvers/meeting-scheduling.resolver';
import { MeetingGoogleCalendarService } from 'src/modules/meeting/scheduling/services/meeting-google-calendar.service';
import { MeetingGooglePushService } from 'src/modules/meeting/scheduling/services/meeting-google-push.service';
import { MeetingSchedulingService } from 'src/modules/meeting/scheduling/services/meeting-scheduling.service';

@Module({
  imports: [OAuth2ClientManagerModule],
  providers: [
    MeetingGoogleCalendarService,
    MeetingSchedulingService,
    MeetingSchedulingResolver,
    MeetingGooglePushService,
    MeetingGooglePushJob,
    MeetingGooglePushListener,
  ],
  exports: [MeetingGoogleCalendarService, MeetingSchedulingService],
})
export class MeetingSchedulingModule {}
