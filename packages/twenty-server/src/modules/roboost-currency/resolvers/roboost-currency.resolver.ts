import { ForbiddenException, UseGuards } from '@nestjs/common';
import {
  Args,
  Field,
  Float,
  Int,
  Mutation,
  ObjectType,
  Query,
} from '@nestjs/graphql';

import { isDefined } from 'twenty-shared/utils';

import { MetadataResolver } from 'src/engine/api/graphql/graphql-config/decorators/metadata-resolver.decorator';
import { type WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { AuthWorkspaceMemberId } from 'src/engine/decorators/auth/auth-workspace-member-id.decorator';
import { AuthWorkspace } from 'src/engine/decorators/auth/auth-workspace.decorator';
import { AuthPrincipalGuard } from 'src/engine/guards/auth-principal.guard';
import { NoPermissionGuard } from 'src/engine/guards/no-permission.guard';
import {
  type RoboostRateLogEntry,
  RoboostCurrencyService,
} from 'src/modules/roboost-currency/services/roboost-currency.service';
import { type RoboostRateFrequency } from 'src/modules/roboost-currency/utils/roboost-rate-schedule.util';

@ObjectType('RoboostCurrency')
class RoboostCurrencyDTO {
  @Field(() => String) code: string;
  @Field(() => String) name: string;
  @Field(() => String) symbol: string;
  @Field(() => Int) decimals: number;
  @Field(() => Boolean) isCompanyCurrency: boolean;
  @Field(() => Boolean) isArchived: boolean;
  @Field(() => Float) rate: number;
  @Field(() => String, { nullable: true }) rateDate: string | null;
  @Field(() => String, { nullable: true }) rateSource: string | null;
  @Field(() => String, { nullable: true }) setByName: string | null;
  @Field(() => String) addedAt: string;
}

@ObjectType('RoboostCurrencyLastRun')
class RoboostCurrencyLastRunDTO {
  @Field(() => String) at: string;
  @Field(() => String) status: string;
  @Field(() => String, { nullable: true }) message: string | null;
  @Field(() => [String]) missingCodes: string[];
  @Field(() => Int) attempts: number;
}

@ObjectType('RoboostCurrencyStatus')
class RoboostCurrencyStatusDTO {
  @Field(() => Boolean) autoUpdateEnabled: boolean;
  @Field(() => String) frequency: string;
  @Field(() => RoboostCurrencyLastRunDTO, { nullable: true })
  lastRun: RoboostCurrencyLastRunDTO | null;
  @Field(() => String, { nullable: true }) lastSuccessAt: string | null;
  @Field(() => String, { nullable: true }) nextUpdateOn: string | null;
  @Field(() => Boolean) hasAppId: boolean;
  @Field(() => String, { nullable: true }) appIdMasked: string | null;
  @Field(() => Float) storageBytes: number;
}

@ObjectType('RoboostCurrencyLogEntry')
class RoboostCurrencyLogEntryDTO {
  @Field(() => String) id: string;
  @Field(() => String) action: string;
  @Field(() => String) detail: string;
  @Field(() => String, { nullable: true }) actorName: string | null;
  @Field(() => String) createdAt: string;
}

@ObjectType('RoboostExchangeRateLogEntry')
class RoboostExchangeRateLogEntryDTO {
  @Field(() => Float) rate: number;
  @Field(() => String) effectiveDate: string;
  @Field(() => String) source: string;
  @Field(() => String, { nullable: true }) setByName: string | null;
  @Field(() => String) createdAt: string;
}

@ObjectType('RoboostExchangeRateLog')
class RoboostExchangeRateLogDTO {
  @Field(() => String) companyCurrency: string;
  @Field(() => RoboostExchangeRateLogEntryDTO, { nullable: true })
  effective: RoboostRateLogEntry | null;
  @Field(() => [RoboostExchangeRateLogEntryDTO])
  history: RoboostRateLogEntry[];
}

@ObjectType('RoboostCurrencyConnectionTest')
class RoboostCurrencyConnectionTestDTO {
  @Field(() => Boolean) ok: boolean;
  @Field(() => String) message: string;
  @Field(() => Int) currencies: number;
}

const requireMember = (workspaceMemberId: string | undefined) => {
  if (!isDefined(workspaceMemberId)) {
    throw new ForbiddenException('A workspace member is required');
  }

  return workspaceMemberId;
};

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
export class RoboostCurrencyResolver {
  constructor(
    private readonly roboostCurrencyService: RoboostCurrencyService,
  ) {}

  // Every member reads the list: deals and products pick their currency from it
  @Query(() => [RoboostCurrencyDTO])
  async roboostCurrencies(
    @AuthWorkspace() workspace: WorkspaceEntity,
  ): Promise<RoboostCurrencyDTO[]> {
    return this.roboostCurrencyService.listCurrencies(workspace.id);
  }

  @Query(() => RoboostCurrencyStatusDTO)
  async roboostCurrencyStatus(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthWorkspaceMemberId() workspaceMemberId: string | undefined,
  ): Promise<RoboostCurrencyStatusDTO> {
    await this.roboostCurrencyService.assertAdmin(
      workspace.id,
      workspaceMemberId,
    );
    const status = await this.roboostCurrencyService.getStatus(workspace.id);

    return {
      autoUpdateEnabled: status.autoUpdate.enabled,
      frequency: status.autoUpdate.frequency,
      lastRun: status.lastRun,
      lastSuccessAt: status.lastSuccessAt,
      nextUpdateOn: status.nextUpdateOn,
      hasAppId: status.hasAppId,
      appIdMasked: status.appIdMasked,
      storageBytes: status.storageBytes,
    };
  }

  @Query(() => [RoboostCurrencyLogEntryDTO])
  async roboostCurrencySettingsHistory(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthWorkspaceMemberId() workspaceMemberId: string | undefined,
  ): Promise<RoboostCurrencyLogEntryDTO[]> {
    await this.roboostCurrencyService.assertAdmin(
      workspace.id,
      workspaceMemberId,
    );

    return this.roboostCurrencyService.listLog(workspace.id);
  }

  @Query(() => RoboostExchangeRateLogDTO)
  async roboostExchangeRateLog(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthWorkspaceMemberId() workspaceMemberId: string | undefined,
    @Args('code', { type: () => String }) code: string,
    @Args('date', { type: () => String, nullable: true }) date: string | null,
  ): Promise<RoboostExchangeRateLogDTO> {
    await this.roboostCurrencyService.assertAdmin(
      workspace.id,
      workspaceMemberId,
    );
    const log = await this.roboostCurrencyService.getRateLog(
      workspace.id,
      code,
      date,
    );

    return {
      companyCurrency: await this.roboostCurrencyService.getCompanyCurrency(
        workspace.id,
      ),
      ...log,
    };
  }

  @Query(() => Float, { nullable: true })
  async roboostSuggestedExchangeRate(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthWorkspaceMemberId() workspaceMemberId: string | undefined,
    @Args('code', { type: () => String }) code: string,
  ): Promise<number | null> {
    await this.roboostCurrencyService.assertAdmin(
      workspace.id,
      workspaceMemberId,
    );

    return this.roboostCurrencyService.getSuggestedRate(workspace.id, code);
  }

  @Mutation(() => Boolean)
  async roboostAddCurrency(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthWorkspaceMemberId() workspaceMemberId: string | undefined,
    @Args('code', { type: () => String }) code: string,
    @Args('rate', { type: () => Float }) rate: number,
  ): Promise<boolean> {
    await this.roboostCurrencyService.addCurrency(
      workspace.id,
      requireMember(workspaceMemberId),
      code,
      rate,
    );

    return true;
  }

  @Mutation(() => Boolean)
  async roboostSetExchangeRate(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthWorkspaceMemberId() workspaceMemberId: string | undefined,
    @Args('code', { type: () => String }) code: string,
    @Args('rate', { type: () => Float }) rate: number,
    @Args('effectiveDate', { type: () => String }) effectiveDate: string,
  ): Promise<boolean> {
    await this.roboostCurrencyService.setManualRate(
      workspace.id,
      requireMember(workspaceMemberId),
      code,
      rate,
      effectiveDate,
    );

    return true;
  }

  @Mutation(() => Boolean)
  async roboostSetCurrencyArchived(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthWorkspaceMemberId() workspaceMemberId: string | undefined,
    @Args('code', { type: () => String }) code: string,
    @Args('isArchived', { type: () => Boolean }) isArchived: boolean,
  ): Promise<boolean> {
    await this.roboostCurrencyService.setArchived(
      workspace.id,
      requireMember(workspaceMemberId),
      code,
      isArchived,
    );

    return true;
  }

  @Mutation(() => Boolean)
  async roboostChangeCompanyCurrency(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthWorkspaceMemberId() workspaceMemberId: string | undefined,
    @Args('code', { type: () => String }) code: string,
  ): Promise<boolean> {
    await this.roboostCurrencyService.changeCompanyCurrency(
      workspace.id,
      requireMember(workspaceMemberId),
      code,
    );

    return true;
  }

  @Mutation(() => Boolean)
  async roboostSetCurrencyAutoUpdate(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthWorkspaceMemberId() workspaceMemberId: string | undefined,
    @Args('enabled', { type: () => Boolean }) enabled: boolean,
    @Args('frequency', { type: () => String }) frequency: string,
  ): Promise<boolean> {
    await this.roboostCurrencyService.setAutoUpdate(
      workspace.id,
      requireMember(workspaceMemberId),
      { enabled, frequency: frequency as RoboostRateFrequency },
    );

    return true;
  }

  // Write-only: the App ID is never returned, only a masked tail
  @Mutation(() => Boolean)
  async roboostSetExchangeRateAppId(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthWorkspaceMemberId() workspaceMemberId: string | undefined,
    @Args('appId', { type: () => String, nullable: true }) appId: string | null,
  ): Promise<boolean> {
    await this.roboostCurrencyService.setAppId(
      workspace.id,
      requireMember(workspaceMemberId),
      appId,
    );

    return true;
  }

  @Mutation(() => RoboostCurrencyConnectionTestDTO)
  async roboostTestExchangeRateConnection(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthWorkspaceMemberId() workspaceMemberId: string | undefined,
  ): Promise<RoboostCurrencyConnectionTestDTO> {
    return this.roboostCurrencyService.testConnection(
      workspace.id,
      requireMember(workspaceMemberId),
    );
  }

  @Mutation(() => RoboostCurrencyLastRunDTO)
  async roboostRunExchangeRateUpdate(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthWorkspaceMemberId() workspaceMemberId: string | undefined,
  ): Promise<RoboostCurrencyLastRunDTO> {
    return this.roboostCurrencyService.runNow(
      workspace.id,
      requireMember(workspaceMemberId),
    );
  }
}
