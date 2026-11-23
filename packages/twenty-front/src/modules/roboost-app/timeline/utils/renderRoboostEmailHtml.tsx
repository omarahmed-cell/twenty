import { createElement, type ReactNode } from 'react';

// Formatting tags kept as they are; anything else is unwrapped so only its text and allowed children remain
const ALLOWED_TAGS = new Set([
  'p',
  'br',
  'div',
  'span',
  'b',
  'strong',
  'i',
  'em',
  'u',
  's',
  'a',
  'ul',
  'ol',
  'li',
  'table',
  'thead',
  'tbody',
  'tr',
  'td',
  'th',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'blockquote',
  'hr',
  'pre',
  'code',
  'img',
]);

const DROPPED_TAGS = new Set([
  'script',
  'style',
  'head',
  'title',
  'meta',
  'link',
  'iframe',
  'object',
  'embed',
  'form',
  'input',
  'button',
  'select',
  'textarea',
  'svg',
  'math',
  'template',
  'noscript',
]);

// Gmail and Outlook wrappers around earlier messages in a reply
const QUOTE_SELECTOR = [
  '[class*="gmail_quote"]',
  '[id$="divRplyFwdMsg"]',
  '[id$="appendonsend"]',
  'blockquote',
].join(',');

const SAFE_LINK = /^(https?:|mailto:|tel:)/i;
// HubSpot file-manager links need a HubSpot login, so they would only show as broken images
const BLOCKED_IMAGE = /hubspot\.com\/filemanager|^cid:/i;

const convertNode = (node: Node, key: string): ReactNode => {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent;
  }
  if (node.nodeType !== Node.ELEMENT_NODE) {
    return null;
  }
  const element = node as Element;
  const tag = element.tagName.toLowerCase();

  if (DROPPED_TAGS.has(tag)) {
    return null;
  }
  const children = Array.from(element.childNodes).map((child, index) =>
    convertNode(child, `${key}-${index}`),
  );

  if (!ALLOWED_TAGS.has(tag)) {
    return createElement('span', { key }, ...children);
  }
  if (tag === 'a') {
    const href = element.getAttribute('href')?.trim() ?? '';

    return SAFE_LINK.test(href)
      ? createElement(
          'a',
          { key, href, target: '_blank', rel: 'noreferrer noopener' },
          ...children,
        )
      : createElement('span', { key }, ...children);
  }
  if (tag === 'img') {
    const src = element.getAttribute('src')?.trim() ?? '';

    if (!/^https:/i.test(src) || BLOCKED_IMAGE.test(src)) {
      return null;
    }
    const width = Number(element.getAttribute('width'));

    return createElement('img', {
      key,
      src,
      alt: element.getAttribute('alt') ?? '',
      loading: 'lazy',
      referrerPolicy: 'no-referrer',
      style: Number.isFinite(width) && width > 0 ? { width } : undefined,
    });
  }
  if (tag === 'br' || tag === 'hr') {
    return createElement(tag, { key });
  }
  if (tag === 'td' || tag === 'th') {
    const colSpan = Number(element.getAttribute('colspan'));

    return createElement(
      tag,
      { key, colSpan: colSpan > 1 ? colSpan : undefined },
      ...children,
    );
  }

  return createElement(tag, { key }, ...children);
};

const toReact = (fragment: DocumentFragment | null, keyPrefix: string) =>
  fragment === null
    ? null
    : Array.from(fragment.childNodes).map((child, index) =>
        convertNode(child, `${keyPrefix}-${index}`),
      );

const hasText = (fragment: DocumentFragment | null) =>
  (fragment?.textContent ?? '').replace(/\s+/g, '') !== '' ||
  fragment?.querySelector?.('img') !== null;

// Builds React elements from an allowlist (never raw HTML), so styles, scripts and handlers in the email never run.
// Inline styles are dropped on purpose: email colours would be unreadable in the dark modes.
export const renderRoboostEmailHtml = (
  html: string,
): { main: ReactNode; quoted: ReactNode | null } => {
  const body = new DOMParser().parseFromString(html, 'text/html').body;
  const quoteStart = body.querySelector(QUOTE_SELECTOR);

  if (quoteStart === null) {
    const range = document.createRange();

    range.selectNodeContents(body);

    return { main: toReact(range.cloneContents(), 'm'), quoted: null };
  }
  const mainRange = document.createRange();
  const quotedRange = document.createRange();

  mainRange.setStart(body, 0);
  mainRange.setEndBefore(quoteStart);
  quotedRange.setStartBefore(quoteStart);
  quotedRange.setEnd(body, body.childNodes.length);

  // Outlook puts a rule just before the quoted header; leave it with the quote
  const mainFragment = mainRange.cloneContents();
  const lastRule = mainFragment.querySelectorAll('hr');

  lastRule[lastRule.length - 1]?.remove();
  const quotedFragment = quotedRange.cloneContents();

  return {
    main: toReact(mainFragment, 'm'),
    quoted: hasText(quotedFragment) ? toReact(quotedFragment, 'q') : null,
  };
};
