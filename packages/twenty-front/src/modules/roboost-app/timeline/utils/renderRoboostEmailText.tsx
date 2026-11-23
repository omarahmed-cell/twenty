import { Fragment, type ReactNode } from 'react';

const LINK_PATTERN =
  /(https?:\/\/[^\s<>()]+[^\s<>().,;:!?'"]|www\.[^\s<>()]+[^\s<>().,;:!?'"]|[\w.+-]+@[\w-]+\.[\w.-]+[a-z])/gi;

// Plain-text bodies from HubSpot carry signature image tags and *bold* markers
const cleanLine = (line: string) =>
  line
    .replace(/\[image: [^\]]*\]\s*/g, '')
    .replace(/<mailto:[^>]+>/g, '')
    .replace(/<(https?:\/\/[^>]+)>/g, '');

const renderInline = (line: string, keyPrefix: string): ReactNode[] =>
  cleanLine(line)
    .split(/(\*[^*\n]+\*)/g)
    .flatMap((segment, segmentIndex) => {
      const isBold = /^\*[^*]+\*$/.test(segment);
      const text = isBold ? segment.slice(1, -1) : segment;
      const parts = text.split(LINK_PATTERN).map((part, partIndex) => {
        const key = `${keyPrefix}-${segmentIndex}-${partIndex}`;

        if (partIndex % 2 === 0) {
          return <Fragment key={key}>{part}</Fragment>;
        }
        const href =
          part.includes('@') && !part.startsWith('http')
            ? `mailto:${part}`
            : part.startsWith('http')
              ? part
              : `https://${part}`;

        return (
          <a key={key} href={href} target="_blank" rel="noreferrer">
            {part}
          </a>
        );
      });

      return isBold
        ? [<b key={`${keyPrefix}-${segmentIndex}-b`}>{parts}</b>]
        : parts;
    });

// Builds React nodes (never raw HTML), so whatever the stored body contains it cannot inject markup
export const renderRoboostEmailText = (text: string): ReactNode =>
  text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph !== '')
    .map((paragraph, paragraphIndex) => (
      <p key={paragraphIndex}>
        {paragraph.split('\n').map((line, lineIndex) => (
          <Fragment key={lineIndex}>
            {lineIndex > 0 && <br />}
            {renderInline(line, `${paragraphIndex}-${lineIndex}`)}
          </Fragment>
        ))}
      </p>
    ));
