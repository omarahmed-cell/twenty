import { Field, ObjectType } from '@nestjs/graphql';

import { UUIDScalarType } from 'src/engine/api/graphql/workspace-schema-builder/graphql-types/scalars';

@ObjectType('TimelineChannelOwner')
export class TimelineChannelOwnerDTO {
  @Field(() => UUIDScalarType)
  channelId: string;

  @Field(() => UUIDScalarType)
  workspaceMemberId: string;
}
