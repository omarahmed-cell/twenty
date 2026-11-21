import { isNonEmptyString, isNumber, isString } from '@sniptt/guards';
import { isDefined } from 'twenty-shared/utils';

export const isRoboostFieldValueFilled = (value: unknown): boolean => {
  if (!isDefined(value)) {
    return false;
  }
  if (isString(value)) {
    return isNonEmptyString(value.trim());
  }
  if (isNumber(value) || typeof value === 'boolean') {
    return true;
  }
  if (Array.isArray(value)) {
    return value.length > 0;
  }
  if (typeof value === 'object') {
    const composite = value as Record<string, unknown>;

    return [
      'primaryLinkUrl',
      'primaryEmail',
      'primaryPhoneNumber',
      'amountMicros',
      'firstName',
      'lastName',
    ].some((key) => isRoboostFieldValueFilled(composite[key]));
  }

  return false;
};
