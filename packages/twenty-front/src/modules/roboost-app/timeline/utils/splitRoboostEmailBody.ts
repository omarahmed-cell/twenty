// Where an earlier message starts: Outlook rules, "From:/Sent:" blocks, Gmail "On ... wrote:", quoted lines
const QUOTE_START_PATTERNS = [
  /^_{8,}\s*$/,
  /^-{5,}\s*(Original Message|Forwarded message)?\s*-*\s*$/i,
  /^\*?From:\*?\s.+/,
  /^On .+wrote:\s*$/,
  /^On .+[^:]$/,
  /^>/,
];

const isQuoteStart = (line: string, nextLine: string | undefined) => {
  const trimmed = line.trim();

  // Gmail wraps "On <date> <name>" and "wrote:" onto two lines
  if (/^On .+/.test(trimmed) && !/wrote:\s*$/.test(trimmed)) {
    return nextLine?.trim().startsWith('wrote:') === true;
  }

  return QUOTE_START_PATTERNS.some((pattern) => pattern.test(trimmed));
};

export const splitRoboostEmailBody = (
  text: string,
): { main: string; quoted: string } => {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const quoteIndex = lines.findIndex((line, index) =>
    index > 0 ? isQuoteStart(line, lines[index + 1]) : false,
  );

  if (quoteIndex === -1) {
    return { main: text.trim(), quoted: '' };
  }

  return {
    main: lines.slice(0, quoteIndex).join('\n').trim(),
    quoted: lines.slice(quoteIndex).join('\n').trim(),
  };
};
