import { Field, InputType } from '@nestjs/graphql';

import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

@InputType()
export class PreCreateWorkspaceMemberInput {
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  lastName?: string | null;

  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  email: string;

  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  memberStatus: string;
}
