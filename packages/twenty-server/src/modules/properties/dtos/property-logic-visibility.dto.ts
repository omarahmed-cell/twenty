import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType('PropertyLogicVisibility')
export class PropertyLogicVisibilityDTO {
  @Field(() => [String])
  hiddenFieldNames: string[];

  @Field(() => [String])
  requiredFieldNames: string[];
}
