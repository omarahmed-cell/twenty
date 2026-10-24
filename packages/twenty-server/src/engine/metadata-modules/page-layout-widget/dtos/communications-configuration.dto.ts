import { Field, ObjectType } from '@nestjs/graphql';

import { IsIn, IsNotEmpty } from 'class-validator';
import { type CommunicationsConfiguration } from 'twenty-shared/types';

import { WidgetConfigurationType } from 'src/engine/metadata-modules/page-layout-widget/enums/widget-configuration-type.type';

@ObjectType('CommunicationsConfiguration')
export class CommunicationsConfigurationDTO implements CommunicationsConfiguration {
  @Field(() => WidgetConfigurationType)
  @IsIn([WidgetConfigurationType.COMMUNICATIONS])
  @IsNotEmpty()
  configurationType: WidgetConfigurationType.COMMUNICATIONS;
}
