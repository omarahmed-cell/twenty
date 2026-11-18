import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';

import { isNonEmptyString } from '@sniptt/guards';
import { ApiPath } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';
import { v4 } from 'uuid';
import { z } from 'zod';

import { TwentyConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';
import { NoPermissionGuard } from 'src/engine/guards/no-permission.guard';
import { PublicEndpointGuard } from 'src/engine/guards/public-endpoint.guard';
import { GmailExtensionLogService } from 'src/modules/unified-email/gmail-extension/services/gmail-extension-log.service';
import { GmailExtensionLookupService } from 'src/modules/unified-email/gmail-extension/services/gmail-extension-lookup.service';
import {
  type GmailExtensionCaller,
  GmailExtensionTokenService,
} from 'src/modules/unified-email/gmail-extension/services/gmail-extension-token.service';
import { gmailExtensionLogInputSchema } from 'src/modules/unified-email/gmail-extension/types/gmail-extension-log-input.type';
import { EmailContactFindOrCreateService } from 'src/modules/unified-email/services/email-contact-find-or-create.service';
import { EmailTrackingService } from 'src/modules/unified-email/services/email-tracking.service';
import { isTrackableEmailLinkUrl } from 'src/modules/unified-email/utils/is-trackable-email-link-url.util';

const trackingLinksInputSchema = z.object({
  emailId: z.string().uuid().optional(),
  urls: z.array(z.string().max(4000)).max(500).default([]),
});

const addContactInputSchema = z.object({
  address: z.string().trim().max(320),
  displayName: z.string().trim().max(320).nullish(),
});

const messageIdsInputSchema = z.object({
  gmailMessageId: z.string().max(200).nullish(),
  gmailThreadId: z.string().max(200).nullish(),
  rfcMessageId: z.string().max(998).nullish(),
});

const parseOrThrow = <TSchema extends z.ZodTypeAny>(
  schema: TSchema,
  body: unknown,
): z.infer<TSchema> => {
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    throw new BadRequestException(parsed.error.issues);
  }

  return parsed.data;
};

// The Chrome extension calls these with a personal token from Settings > Gmail extension, not a session
@Controller(ApiPath.GmailExtension)
@UseGuards(PublicEndpointGuard, NoPermissionGuard)
export class GmailExtensionController {
  constructor(
    private readonly gmailExtensionTokenService: GmailExtensionTokenService,
    private readonly gmailExtensionLookupService: GmailExtensionLookupService,
    private readonly gmailExtensionLogService: GmailExtensionLogService,
    private readonly emailContactFindOrCreateService: EmailContactFindOrCreateService,
    private readonly emailTrackingService: EmailTrackingService,
    private readonly twentyConfigService: TwentyConfigService,
  ) {}

  private async authenticate(
    authorization: string | undefined,
  ): Promise<GmailExtensionCaller> {
    const caller = await this.gmailExtensionTokenService.verify(
      authorization?.replace(/^Bearer\s+/i, '').trim(),
    );

    if (!isDefined(caller)) {
      throw new UnauthorizedException('Invalid or revoked extension token');
    }

    return caller;
  }

  @Get('me')
  async me(@Headers('authorization') authorization: string | undefined) {
    const caller = await this.authenticate(authorization);
    const actor = await this.gmailExtensionLogService.getMemberActor(caller);

    return {
      workspaceMemberId: caller.workspaceMemberId,
      name: actor.name,
      crmUrl: this.twentyConfigService.get('SERVER_URL'),
      internalDomains:
        this.emailContactFindOrCreateService.getInternalDomains(),
    };
  }

  @Get('lookup')
  async lookup(
    @Headers('authorization') authorization: string | undefined,
    @Query('emails') emails: string | undefined,
  ) {
    const caller = await this.authenticate(authorization);
    const addresses = (emails ?? '')
      .split(',')
      .map((address) => address.trim())
      .filter(isNonEmptyString)
      .slice(0, 100);

    return this.gmailExtensionLookupService.lookupAddresses(
      caller.workspaceId,
      addresses,
    );
  }

  @Get('search')
  async search(
    @Headers('authorization') authorization: string | undefined,
    @Query('q') query: string | undefined,
  ) {
    const caller = await this.authenticate(authorization);

    return this.gmailExtensionLookupService.search(
      caller.workspaceId,
      (query ?? '').slice(0, 100),
    );
  }

  @Post('contacts')
  @HttpCode(200)
  async addContact(
    @Headers('authorization') authorization: string | undefined,
    @Body() body: unknown,
  ) {
    const caller = await this.authenticate(authorization);
    const input = parseOrThrow(addContactInputSchema, body);

    return this.emailContactFindOrCreateService.findOrCreate({
      workspaceId: caller.workspaceId,
      participants: [input],
      createdBy: await this.gmailExtensionLogService.getMemberActor(caller),
    });
  }

  @Post('tracking-links')
  @HttpCode(200)
  async trackingLinks(
    @Headers('authorization') authorization: string | undefined,
    @Body() body: unknown,
  ) {
    const caller = await this.authenticate(authorization);
    const input = parseOrThrow(trackingLinksInputSchema, body);
    const emailId = input.emailId ?? v4();
    const { openPixelUrl, buildClickUrl } =
      this.emailTrackingService.buildTrackingUrls({
        workspaceId: caller.workspaceId,
        emailId,
      });

    return {
      emailId,
      openPixelUrl,
      clickUrls: Object.fromEntries(
        input.urls
          .filter(isTrackableEmailLinkUrl)
          .map((url) => [url, buildClickUrl(url)]),
      ),
    };
  }

  @Post('log')
  @HttpCode(200)
  async log(
    @Headers('authorization') authorization: string | undefined,
    @Body() body: unknown,
  ) {
    const caller = await this.authenticate(authorization);

    return this.gmailExtensionLogService.log(
      caller,
      parseOrThrow(gmailExtensionLogInputSchema, body),
    );
  }

  @Patch('log/:emailId')
  async attachMessageIds(
    @Headers('authorization') authorization: string | undefined,
    @Param('emailId') emailId: string,
    @Body() body: unknown,
  ) {
    const caller = await this.authenticate(authorization);

    if (!z.string().uuid().safeParse(emailId).success) {
      throw new BadRequestException('Invalid email id');
    }

    const isUpdated = await this.gmailExtensionLogService.attachMessageIds(
      caller,
      emailId,
      parseOrThrow(messageIdsInputSchema, body),
    );

    if (!isUpdated) {
      throw new NotFoundException('Email not found');
    }

    return { emailId };
  }
}
