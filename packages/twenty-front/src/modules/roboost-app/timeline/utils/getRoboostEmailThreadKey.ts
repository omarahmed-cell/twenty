// Replies and forwards share the original subject once their prefixes are stripped
export const getRoboostEmailThreadKey = (subject: string) =>
  subject
    .toLowerCase()
    .replace(/^\s*((re|fw|fwd|aw|tr)\s*:\s*|\[external\]\s*)+/i, '')
    .replace(/\s+/g, ' ')
    .trim();
