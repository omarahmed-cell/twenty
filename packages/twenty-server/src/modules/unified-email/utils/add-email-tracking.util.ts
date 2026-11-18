import { isTrackableEmailLinkUrl } from 'src/modules/unified-email/utils/is-trackable-email-link-url.util';

const ANCHOR_HREF_PATTERN = /(<a\b[^>]*?\bhref\s*=\s*)(["'])(.*?)\2/gi;

const decodeHtmlAttribute = (value: string) =>
  value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');

const encodeHtmlAttribute = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/"/g, '&quot;');

export const addEmailTracking = ({
  html,
  buildClickUrl,
  openPixelUrl,
}: {
  html: string;
  buildClickUrl: (url: string) => string;
  openPixelUrl: string;
}) => {
  const withTrackedLinks = html.replace(
    ANCHOR_HREF_PATTERN,
    (match, prefix: string, _quote: string, rawHref: string) => {
      const href = decodeHtmlAttribute(rawHref.trim());

      return isTrackableEmailLinkUrl(href)
        ? `${prefix}"${encodeHtmlAttribute(buildClickUrl(href))}"`
        : match;
    },
  );

  const pixel = `<img src="${encodeHtmlAttribute(openPixelUrl)}" width="1" height="1" alt="" style="display:block;width:1px;height:1px;border:0;" />`;

  return /<\/body>/i.test(withTrackedLinks)
    ? withTrackedLinks.replace(/<\/body>/i, `${pixel}</body>`)
    : `${withTrackedLinks}${pixel}`;
};
