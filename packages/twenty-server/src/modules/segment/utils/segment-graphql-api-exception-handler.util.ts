import { assertUnreachable } from 'twenty-shared/utils';

import {
  InternalServerError,
  NotFoundError,
  UserInputError,
} from 'src/engine/core-modules/graphql/utils/graphql-errors.util';
import {
  SegmentException,
  SegmentExceptionCode,
} from 'src/modules/segment/exceptions/segment.exception';

export const segmentGraphqlApiExceptionHandler = (error: Error) => {
  if (error instanceof SegmentException) {
    switch (error.code) {
      case SegmentExceptionCode.SEGMENT_NOT_FOUND:
        throw new NotFoundError(error);
      case SegmentExceptionCode.SEGMENT_TARGET_OBJECT_MISSING:
      case SegmentExceptionCode.SEGMENT_TARGET_OBJECT_MISMATCH:
      case SegmentExceptionCode.SEGMENT_TOO_MANY_RECORDS:
        throw new UserInputError(error);
      case SegmentExceptionCode.SEGMENT_MEMBERSHIP_UPDATE_FAILED:
        throw new InternalServerError(error);
      default: {
        return assertUnreachable(error.code);
      }
    }
  }

  throw error;
};
