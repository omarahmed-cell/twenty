import { Field, Int, ObjectType } from '@nestjs/graphql';

import { UUIDScalarType } from 'src/engine/api/graphql/workspace-schema-builder/graphql-types/scalars';

@ObjectType('SegmentPullResult')
export class SegmentPullResultDTO {
  @Field(() => UUIDScalarType)
  targetSegmentId: string;

  @Field(() => Int)
  addedRecordCount: number;

  @Field(() => Int)
  removedRecordCount: number;

  @Field(() => Int)
  memberCount: number;
}
