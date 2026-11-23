import { Module } from '@nestjs/common';

import { OAuth2ClientManagerModule } from 'src/modules/connected-account/oauth2-client-manager/oauth2-client-manager.module';
import { MeetingSchedulingResolver } from 'src/modules/meeting/scheduling/resolvers/meeting-scheduling.resolver';
import { MeetingGoogleCalendarService } from 'src/modules/meeting/scheduling/services/meeting-google-calendar.service';
import { MeetingSchedulingService } from 'src/modules/meeting/scheduling/services/meeting-scheduling.service';

@Module({
  imports: [OAuth2ClientManagerModule],
  providers: [
    MeetingGoogleCalendarService,
    MeetingSchedulingService,
    MeetingSchedulingResolver,
  ],
  exports: [MeetingGoogleCalendarService, MeetingSchedulingService],
})
export class MeetingSchedulingModule {}
