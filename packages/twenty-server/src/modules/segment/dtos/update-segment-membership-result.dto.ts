import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType('UpdateSegmentMembershipResult')
export class UpdateSegmentMembershipResultDTO {
  @Field(() => Int)
  affectedRecordCount: number;

  @Field(() => Int)
  memberCount: number;
}
