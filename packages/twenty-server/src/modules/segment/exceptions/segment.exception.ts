import { type MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { assertUnreachable } from 'twenty-shared/utils';

import { CustomException } from 'src/utils/custom-exception';

export enum SegmentExceptionCode {
  SEGMENT_NOT_FOUND = 'SEGMENT_NOT_FOUND',
  SEGMENT_TARGET_OBJECT_MISSING = 'SEGMENT_TARGET_OBJECT_MISSING',
  SEGMENT_TARGET_OBJECT_MISMATCH = 'SEGMENT_TARGET_OBJECT_MISMATCH',
  SEGMENT_TOO_MANY_RECORDS = 'SEGMENT_TOO_MANY_RECORDS',
  SEGMENT_MEMBERSHIP_UPDATE_FAILED = 'SEGMENT_MEMBERSHIP_UPDATE_FAILED',
}

const getSegmentExceptionUserFriendlyMessage = (code: SegmentExceptionCode) => {
  switch (code) {
    case SegmentExceptionCode.SEGMENT_NOT_FOUND:
      return msg`Segment not found.`;
    case SegmentExceptionCode.SEGMENT_TARGET_OBJECT_MISSING:
      return msg`Pick the segment's target object first.`;
    case SegmentExceptionCode.SEGMENT_TARGET_OBJECT_MISMATCH:
      return msg`This segment holds a different kind of record.`;
    case SegmentExceptionCode.SEGMENT_TOO_MANY_RECORDS:
      return msg`Too many records selected. Narrow your selection and try again.`;
    case SegmentExceptionCode.SEGMENT_MEMBERSHIP_UPDATE_FAILED:
      return msg`Failed to update the segment.`;
    default:
      assertUnreachable(code);
  }
};

export class SegmentException extends CustomException<SegmentExceptionCode> {
  constructor(
    message: string,
    code: SegmentExceptionCode,
    { userFriendlyMessage }: { userFriendlyMessage?: MessageDescriptor } = {},
  ) {
    super(message, code, {
      userFriendlyMessage:
        userFriendlyMessage ?? getSegmentExceptionUserFriendlyMessage(code),
    });
  }
}
