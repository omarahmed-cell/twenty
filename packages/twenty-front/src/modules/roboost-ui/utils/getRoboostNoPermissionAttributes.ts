// TooltipLayer shows the tooltip and swallows clicks on anything carrying this attribute
export const ROBOOST_NO_PERMISSION_ATTRIBUTE = 'data-rb-no-permission';

export const getRoboostNoPermissionAttribute = (isAllowed: boolean) =>
  isAllowed ? undefined : 'true';
