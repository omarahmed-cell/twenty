import { type ArgumentsHost, Catch } from '@nestjs/common';
import { type GqlExceptionFilter } from '@nestjs/graphql';

import { SegmentException } from 'src/modules/segment/exceptions/segment.exception';
import { segmentGraphqlApiExceptionHandler } from 'src/modules/segment/utils/segment-graphql-api-exception-handler.util';

@Catch(SegmentException)
export class SegmentGraphqlApiExceptionFilter implements GqlExceptionFilter {
  catch(exception: SegmentException, _host: ArgumentsHost) {
    return segmentGraphqlApiExceptionHandler(exception);
  }
}
