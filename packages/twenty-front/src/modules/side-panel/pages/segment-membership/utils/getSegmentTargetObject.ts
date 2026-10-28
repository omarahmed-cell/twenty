import { SEGMENT_TARGET_OBJECT_NAME_SINGULARS } from 'twenty-shared/constants';
import { type SegmentTargetObject } from 'twenty-shared/types';

export const getSegmentTargetObject = (
  objectNameSingular: string,
): SegmentTargetObject | undefined =>
  (
    Object.entries(SEGMENT_TARGET_OBJECT_NAME_SINGULARS) as [
      SegmentTargetObject,
      string,
    ][]
  ).find(
    ([, targetObjectNameSingular]) =>
      targetObjectNameSingular === objectNameSingular,
  )?.[0];
