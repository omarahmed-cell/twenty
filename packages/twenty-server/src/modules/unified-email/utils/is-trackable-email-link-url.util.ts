export const isTrackableEmailLinkUrl = (url: string) =>
  /^https?:\/\//i.test(url) && !/[\r\n\s]/.test(url) && URL.canParse(url);
