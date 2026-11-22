import { Icon } from '@/roboost-ui/components/Icon';
import { Menu } from '@/roboost-ui/components/Menu';
import { type RoboostIconName } from '@/roboost-ui/types/RoboostIconName';
import { useLingui } from '@lingui/react/macro';
import { useRef } from 'react';
import { isDefined } from 'twenty-shared/utils';

type RoboostActivityTextEditorProps = {
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
};

// Markdown text area; the server turns the markdown into rich text
export const RoboostActivityTextEditor = ({
  value,
  placeholder,
  onChange,
}: RoboostActivityTextEditorProps) => {
  const { t } = useLingui();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const wrapSelection = (before: string, after = before) => {
    const textarea = textareaRef.current;

    if (!isDefined(textarea)) {
      return;
    }
    const { selectionStart, selectionEnd } = textarea;
    const selected = value.slice(selectionStart, selectionEnd);

    onChange(
      `${value.slice(0, selectionStart)}${before}${selected}${after}${value.slice(selectionEnd)}`,
    );
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(
        selectionStart + before.length,
        selectionEnd + before.length,
      );
    });
  };

  const prefixLines = (prefix: (index: number) => string) => {
    const textarea = textareaRef.current;

    if (!isDefined(textarea)) {
      return;
    }
    const start = value.lastIndexOf('\n', textarea.selectionStart - 1) + 1;
    const end = textarea.selectionEnd;
    const block = value
      .slice(start, end)
      .split('\n')
      .map((line, index) => `${prefix(index)}${line}`)
      .join('\n');

    onChange(`${value.slice(0, start)}${block}${value.slice(end)}`);
  };

  const clearFormatting = () => {
    const textarea = textareaRef.current;

    if (!isDefined(textarea)) {
      return;
    }
    const { selectionStart, selectionEnd } = textarea;
    const cleaned = value
      .slice(selectionStart, selectionEnd)
      .replace(/(\*\*|__|\*|<\/?u>)/g, '');

    onChange(
      `${value.slice(0, selectionStart)}${cleaned}${value.slice(selectionEnd)}`,
    );
  };

  const toolbarButton = (
    icon: RoboostIconName,
    label: string,
    onClick: () => void,
  ) => (
    <button
      type="button"
      className="rb-act-toolbtn"
      aria-label={label}
      title={label}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
    >
      <Icon name={icon} size={15} />
    </button>
  );

  return (
    <div className="rb-act-editor">
      <textarea
        ref={textareaRef}
        className="rb-act-textarea"
        value={value}
        placeholder={placeholder}
        aria-label={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
      <div className="rb-act-toolbar">
        {toolbarButton('bold', t`Bold`, () => wrapSelection('**'))}
        {toolbarButton('italic', t`Italic`, () => wrapSelection('*'))}
        {toolbarButton('underline', t`Underline`, () =>
          wrapSelection('<u>', '</u>'),
        )}
        <button
          type="button"
          className="rb-act-toolbtn rb-act-toolbtn-text"
          title={t`Clear formatting`}
          onMouseDown={(event) => event.preventDefault()}
          onClick={clearFormatting}
        >
          T<sub>x</sub>
        </button>
        <span className="rb-act-tooldiv" />
        <Menu
          placement="above"
          entries={[
            {
              id: 'bullets',
              label: t`Bulleted list`,
              icon: 'list',
              onSelect: () => prefixLines(() => '- '),
            },
            {
              id: 'numbers',
              label: t`Numbered list`,
              icon: 'list-ordered',
              onSelect: () => prefixLines((index) => `${index + 1}. `),
            },
          ]}
          trigger={({ toggle, isOpen }) => (
            <button
              type="button"
              className="rb-act-toolbtn rb-act-toolbtn-text"
              aria-expanded={isOpen}
              onClick={toggle}
            >
              {t`More`}
              <Icon name="caret" size={12} />
            </button>
          )}
        />
        <span className="rb-act-tooldiv" />
        {toolbarButton('link', t`Link`, () =>
          wrapSelection('[', '](https://)'),
        )}
        {/* Attachments in activities and AI writing are not built yet */}
        {toolbarButton('paperclip', t`Attach a file`, () => {})}
        {toolbarButton('sparkles', t`Write with AI`, () => {})}
      </div>
    </div>
  );
};
