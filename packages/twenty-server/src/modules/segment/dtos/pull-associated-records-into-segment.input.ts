import { Field, InputType } from '@nestjs/graphql';

import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

import { UUIDScalarType } from 'src/engine/api/graphql/workspace-schema-builder/graphql-types/scalars';

@InputType('PullAssociatedRecordsIntoSegmentInput')
export class PullAssociatedRecordsIntoSegmentInput {
  @Field(() => UUIDScalarType)
  @IsUUID()
  sourceSegmentId: string;

  @Field(() => UUIDScalarType)
  @IsUUID()
  relationFieldMetadataId: string;

  @Field(() => UUIDScalarType, { nullable: true })
  @IsOptional()
  @IsUUID()
  targetSegmentId?: string | null;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  newTargetSegmentName?: string | null;
}
