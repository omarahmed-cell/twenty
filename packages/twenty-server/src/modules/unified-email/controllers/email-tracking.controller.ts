import {
  BadRequestException,
  Controller,
  Get,
  Headers,
  Param,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';

import { type Request, type Response } from 'express';
import { ApiPath } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

import { USER_SESSION_COOKIE_NAME } from 'src/engine/core-modules/user-session/constants/user-session-cookie-name.constant';
import { NoPermissionGuard } from 'src/engine/guards/no-permission.guard';
import { PublicEndpointGuard } from 'src/engine/guards/public-endpoint.guard';
import { EmailTrackingService } from 'src/modules/unified-email/services/email-tracking.service';
import { isTrackableEmailLinkUrl } from 'src/modules/unified-email/utils/is-trackable-email-link-url.util';

const OPEN_PIXEL_GIF = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64',
);

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, private, max-age=0',
  Pragma: 'no-cache',
  Expires: '0',
  'Referrer-Policy': 'no-referrer',
};

const hasSessionCookie = (request: Request) =>
  (request.headers.cookie ?? '')
    .split(';')
    .some((cookie) => cookie.trim().startsWith(`${USER_SESSION_COOKIE_NAME}=`));

@Controller(ApiPath.Tracking)
@UseGuards(PublicEndpointGuard, NoPermissionGuard)
export class EmailTrackingController {
  constructor(private readonly emailTrackingService: EmailTrackingService) {}

  @Get('o/:token')
  async handleOpen(
    @Param('token') token: string,
    @Headers('user-agent') userAgent: string | undefined,
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<void> {
    const payload = this.emailTrackingService.decodeToken(token);

    if (isDefined(payload)) {
      await this.emailTrackingService.recordEvent({
        workspaceId: payload.workspaceId,
        emailId: payload.emailId,
        type: 'OPEN',
        userAgent: userAgent ?? null,
        hasSenderSession: hasSessionCookie(request),
        occurredAt: new Date().toISOString(),
      });
    }

    response
      .set({
        ...NO_CACHE_HEADERS,
        'Content-Type': 'image/gif',
        'Content-Length': String(OPEN_PIXEL_GIF.length),
      })
      .end(OPEN_PIXEL_GIF);
  }

  @Get('c/:token')
  async handleClick(
    @Param('token') token: string,
    @Headers('user-agent') userAgent: string | undefined,
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<void> {
    const payload = this.emailTrackingService.decodeToken(token);

    if (
      !isDefined(payload) ||
      !isDefined(payload.url) ||
      !isTrackableEmailLinkUrl(payload.url)
    ) {
      throw new BadRequestException('Invalid tracked link');
    }

    await this.emailTrackingService.recordEvent({
      workspaceId: payload.workspaceId,
      emailId: payload.emailId,
      type: 'CLICK',
      url: payload.url,
      userAgent: userAgent ?? null,
      hasSenderSession: hasSessionCookie(request),
      occurredAt: new Date().toISOString(),
    });

    response.set(NO_CACHE_HEADERS).redirect(302, payload.url);
  }
}
