import { Button } from '@/roboost-ui/components/Button';
import { Icon } from '@/roboost-ui/components/Icon';
import { cx } from '@/roboost-ui/utils/cx';
import { useLingui } from '@lingui/react/macro';
import { Fragment, type ReactNode, useEffect, useRef, useState } from 'react';
import { useToast } from 'twenty-ui/components/feedback';

type TranscriptLine = {
  speaker: string | null;
  time: string | null;
  text: string;
};

const LINE_PATTERN = /^(.+?) \((\d{1,2}:\d{2}(?::\d{2})?)\): (.*)$/;

const parseTranscript = (transcript: string): TranscriptLine[] =>
  transcript
    .split('\n')
    .filter((line) => line.trim() !== '')
    .map((line) => {
      const match = line.match(LINE_PATTERN);

      return match === null
        ? { speaker: null, time: null, text: line }
        : { speaker: match[1], time: match[2], text: match[3] };
    });

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

type RoboostMeetingTranscriptProps = {
  transcript: string;
};

// Lines read "Speaker (mm:ss): text"; search highlights every match and jumps between them
export const RoboostMeetingTranscript = ({
  transcript,
}: RoboostMeetingTranscriptProps) => {
  const { t } = useLingui();
  const { enqueueToast } = useToast();
  const [query, setQuery] = useState('');
  const [activeMatch, setActiveMatch] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);
  const lines = parseTranscript(transcript);
  const trimmedQuery = query.trim();
  const matcher =
    trimmedQuery === '' ? null : new RegExp(escapeRegExp(trimmedQuery), 'gi');
  const matchCount =
    matcher === null
      ? 0
      : lines.reduce(
          (count, line) =>
            count +
            (`${line.speaker ?? ''} ${line.text}`.match(matcher)?.length ?? 0),
          0,
        );

  useEffect(() => {
    boxRef.current
      ?.querySelector('mark.is-active')
      ?.scrollIntoView({ block: 'center' });
  }, [activeMatch, trimmedQuery]);

  let matchIndex = 0;
  const highlight = (text: string): ReactNode => {
    if (matcher === null) {
      return text;
    }

    return text
      .split(new RegExp(`(${escapeRegExp(trimmedQuery)})`, 'gi'))
      .map((part, index) => {
        if (part.toLowerCase() !== trimmedQuery.toLowerCase()) {
          return <Fragment key={index}>{part}</Fragment>;
        }
        const isActive = matchIndex === activeMatch;

        matchIndex += 1;

        return (
          <mark key={index} className={cx(isActive && 'is-active')}>
            {part}
          </mark>
        );
      });
  };

  const step = (direction: 1 | -1) =>
    matchCount > 0 &&
    setActiveMatch((activeMatch + direction + matchCount) % matchCount);

  const copy = async () => {
    await navigator.clipboard.writeText(transcript);
    enqueueToast({ status: 'success', children: t`Transcript copied` });
  };

  return (
    <div className="rb-mtgp-transcript">
      <div className="rb-mtgp-transcript-tools">
        <div className="rb-mtgp-transcript-search">
          <Icon name="search" size={14} />
          <input
            className="rb-mtgp-transcript-input"
            value={query}
            placeholder={t`Search transcript`}
            aria-label={t`Search transcript`}
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveMatch(0);
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                step(event.shiftKey ? -1 : 1);
              }
            }}
          />
          {trimmedQuery !== '' && (
            <span className="rb-mtgp-transcript-count">
              {matchCount === 0
                ? t`No matches`
                : `${activeMatch + 1}/${matchCount}`}
            </span>
          )}
          <button
            type="button"
            className="rb-rc-iconbtn"
            aria-label={t`Previous match`}
            disabled={matchCount === 0}
            onClick={() => step(-1)}
          >
            <Icon name="chevron-up" size={14} />
          </button>
          <button
            type="button"
            className="rb-rc-iconbtn"
            aria-label={t`Next match`}
            disabled={matchCount === 0}
            onClick={() => step(1)}
          >
            <Icon name="caret" size={14} />
          </button>
        </div>
        <Button size="sm" variant="secondary" icon="copy" onClick={copy}>
          {t`Copy`}
        </Button>
      </div>
      <div ref={boxRef} className="rb-mtgp-transcript-box">
        {lines.map((line, index) => (
          <p key={index} className="rb-mtgp-transcript-line">
            {line.speaker !== null && (
              <b>
                {highlight(line.speaker)}{' '}
                <span className="rb-mtgp-transcript-time">({line.time})</span>
                :{' '}
              </b>
            )}
            {highlight(line.text)}
          </p>
        ))}
      </div>
    </div>
  );
};
