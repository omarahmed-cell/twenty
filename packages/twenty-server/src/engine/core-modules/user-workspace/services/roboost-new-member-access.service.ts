import { Injectable, Logger } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';

export const ROBOOST_NEW_MEMBER_PROVISIONER = 'ROBOOST_NEW_MEMBER_PROVISIONER';

export type RoboostNewMemberProvisioner = {
  provisionNewMember(args: {
    workspaceId: string;
    workspaceMemberId?: string;
    userWorkspaceId?: string;
  }): Promise<void>;
};

// Users & Teams imports this module, so its provisioner is looked up at call time to avoid a cycle
@Injectable()
export class RoboostNewMemberAccessService {
  private readonly logger = new Logger(RoboostNewMemberAccessService.name);

  constructor(private readonly moduleRef: ModuleRef) {}

  async provision(args: {
    workspaceId: string;
    workspaceMemberId?: string;
    userWorkspaceId?: string;
  }): Promise<void> {
    let provisioner: RoboostNewMemberProvisioner;

    try {
      provisioner = this.moduleRef.get<RoboostNewMemberProvisioner>(
        ROBOOST_NEW_MEMBER_PROVISIONER,
        { strict: false },
      );
    } catch {
      return;
    }

    // A failure leaves the member on the default role, which has no access
    try {
      await provisioner.provisionNewMember(args);
    } catch (error) {
      this.logger.error(
        `Could not apply the private role of a new member in workspace ${args.workspaceId}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
