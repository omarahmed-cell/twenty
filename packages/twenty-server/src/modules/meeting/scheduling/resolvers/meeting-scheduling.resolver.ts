import {
  BadRequestException,
  ForbiddenException,
  UseGuards,
} from '@nestjs/common';
import {
  Args,
  Field,
  InputType,
  Mutation,
  ObjectType,
  Query,
} from '@nestjs/graphql';

import { isNonEmptyString } from '@sniptt/guards';
import { isDefined } from 'twenty-shared/utils';

import { MetadataResolver } from 'src/engine/api/graphql/graphql-config/decorators/metadata-resolver.decorator';
import { type WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { AuthWorkspaceMemberId } from 'src/engine/decorators/auth/auth-workspace-member-id.decorator';
import { AuthWorkspace } from 'src/engine/decorators/auth/auth-workspace.decorator';
import { AuthPrincipalGuard } from 'src/engine/guards/auth-principal.guard';
import { NoPermissionGuard } from 'src/engine/guards/no-permission.guard';
import { MeetingSchedulingService } from 'src/modules/meeting/scheduling/services/meeting-scheduling.service';

@ObjectType('MeetingCalendarSlot')
class MeetingCalendarSlotDTO {
  @Field(() => String)
  startsAt: string;

  @Field(() => String)
  endsAt: string;

  @Field(() => String, { nullable: true })
  title: string | null;
}

@ObjectType('MeetingHostCalendar')
class MeetingHostCalendarDTO {
  @Field(() => String)
  source: string;

  @Field(() => [MeetingCalendarSlotDTO])
  slots: MeetingCalendarSlotDTO[];
}

@InputType('MeetingAttendeeInput')
class MeetingAttendeeInputDTO {
  @Field(() => String)
  email: string;

  @Field(() => String, { nullable: true })
  displayName?: string | null;

  @Field(() => String, { nullable: true })
  personId?: string | null;

  @Field(() => String, { nullable: true })
  workspaceMemberId?: string | null;
}

@InputType('MeetingTargetInput')
class MeetingTargetInputDTO {
  @Field(() => String)
  objectNameSingular: string;

  @Field(() => String)
  recordId: string;
}

@InputType('SaveMeetingInput')
class SaveMeetingInputDTO {
  @Field(() => String)
  mode: 'SCHEDULE' | 'LOG';

  @Field(() => String)
  hostWorkspaceMemberId: string;

  @Field(() => String)
  title: string;

  @Field(() => String)
  startsAt: string;

  @Field(() => String)
  endsAt: string;

  @Field(() => String)
  timeZone: string;

  @Field(() => String, { nullable: true })
  meetingType?: string | null;

  @Field(() => String, { nullable: true })
  meetingOutcome?: string | null;

  @Field(() => String, { nullable: true })
  locationType?: string | null;

  @Field(() => String, { nullable: true })
  location?: string | null;

  @Field(() => String, { nullable: true })
  attendeeDescription?: string | null;

  @Field(() => String, { nullable: true })
  internalNote?: string | null;

  @Field(() => [MeetingAttendeeInputDTO])
  attendees: MeetingAttendeeInputDTO[];

  @Field(() => [MeetingTargetInputDTO])
  targets: MeetingTargetInputDTO[];
}

@ObjectType('SavedMeeting')
class SavedMeetingDTO {
  @Field(() => String)
  meetingId: string;

  @Field(() => String, { nullable: true })
  warning: string | null;
}

@MetadataResolver()
@UseGuards(
  AuthPrincipalGuard({
    userSession: {
      standard: true,
      impersonated: true,
      playground: false,
      workspaceAgnostic: false,
    },
    apiKey: false,
    oauthClient: false,
    application: false,
  }),
  NoPermissionGuard,
)
export class MeetingSchedulingResolver {
  constructor(
    private readonly meetingSchedulingService: MeetingSchedulingService,
  ) {}

  @Query(() => MeetingHostCalendarDTO)
  async meetingHostCalendar(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthWorkspaceMemberId() workspaceMemberId: string | undefined,
    @Args('hostWorkspaceMemberId', { type: () => String })
    hostWorkspaceMemberId: string,
    @Args('timeMin', { type: () => String }) timeMin: string,
    @Args('timeMax', { type: () => String }) timeMax: string,
  ): Promise<MeetingHostCalendarDTO> {
    if (!isDefined(workspaceMemberId)) {
      throw new ForbiddenException('A workspace member is required');
    }

    return this.meetingSchedulingService.getHostCalendar({
      workspaceId: workspace.id,
      callerWorkspaceMemberId: workspaceMemberId,
      hostWorkspaceMemberId,
      timeMin,
      timeMax,
    });
  }

  @Mutation(() => SavedMeetingDTO)
  async saveMeeting(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthWorkspaceMemberId() workspaceMemberId: string | undefined,
    @Args('input', { type: () => SaveMeetingInputDTO })
    input: SaveMeetingInputDTO,
  ): Promise<SavedMeetingDTO> {
    if (!isDefined(workspaceMemberId)) {
      throw new ForbiddenException('A workspace member is required');
    }
    if (!isNonEmptyString(input.title.trim())) {
      throw new BadRequestException('A title is required');
    }
    if (new Date(input.endsAt) <= new Date(input.startsAt)) {
      throw new BadRequestException('The meeting must end after it starts');
    }
    if (input.mode === 'SCHEDULE' && input.attendees.length === 0) {
      throw new BadRequestException('Add at least one attendee');
    }

    try {
      return await this.meetingSchedulingService.saveMeeting({
        ...input,
        title: input.title.trim(),
        meetingType: input.meetingType ?? null,
        meetingOutcome: input.meetingOutcome ?? null,
        locationType: input.locationType ?? null,
        location: input.location ?? null,
        attendeeDescription: input.attendeeDescription ?? null,
        internalNote: input.internalNote ?? null,
        workspaceId: workspace.id,
        callerWorkspaceMemberId: workspaceMemberId,
      });
    } catch (error) {
      throw new BadRequestException(
        `Google Calendar refused the meeting: ${(error as Error).message}`,
      );
    }
  }
}
