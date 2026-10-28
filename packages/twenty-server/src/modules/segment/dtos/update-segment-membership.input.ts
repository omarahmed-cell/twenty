import { Field, InputType } from '@nestjs/graphql';

import { IsIn, IsObject, IsUUID } from 'class-validator';
import GraphQLJSON from 'graphql-type-json';
import { SEGMENT_TARGET_OBJECT_NAME_SINGULARS } from 'twenty-shared/constants';

import { type ObjectRecordFilter } from 'src/engine/api/graphql/workspace-query-builder/interfaces/object-record.interface';
import { UUIDScalarType } from 'src/engine/api/graphql/workspace-schema-builder/graphql-types/scalars';

@InputType('UpdateSegmentMembershipInput')
export class UpdateSegmentMembershipInput {
  @Field(() => UUIDScalarType)
  @IsUUID()
  segmentId: string;

  @Field()
  @IsIn(Object.values(SEGMENT_TARGET_OBJECT_NAME_SINGULARS))
  objectNameSingular: string;

  @Field(() => GraphQLJSON)
  @IsObject()
  recordFilter: Partial<ObjectRecordFilter>;
}
