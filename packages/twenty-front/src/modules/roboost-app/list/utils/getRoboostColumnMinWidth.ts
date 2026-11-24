const MIN_COLUMN_WIDTH = 140;
// Left padding, the reserved menu slot on the right, the grip and a sort arrow
const HEADER_CHROME_WIDTH = 14 + 38 + 20 + 19;
const HEADER_FONT_SIZE = 11;
const HEADER_LETTER_SPACING_EM = 0.06;

const widthByLabel = new Map<string, number>();
let measuringContext: CanvasRenderingContext2D | null | undefined;

const measureHeaderText = (label: string) => {
  if (measuringContext === undefined) {
    measuringContext = document.createElement('canvas').getContext('2d');
  }
  const text = label.toUpperCase();

  if (measuringContext === null) {
    return text.length * 8;
  }
  const fontFamily =
    getComputedStyle(document.documentElement)
      .getPropertyValue('--font-sans')
      .trim() || 'sans-serif';

  measuringContext.font = `600 ${HEADER_FONT_SIZE}px ${fontFamily}`;

  return (
    measuringContext.measureText(text).width +
    text.length * HEADER_LETTER_SPACING_EM * HEADER_FONT_SIZE
  );
};

// No column is narrower than its header name plus the header's controls, and never under 140px
export const getRoboostColumnMinWidth = (label: string) => {
  const cached = widthByLabel.get(label);

  if (cached !== undefined) {
    return cached;
  }
  const width = Math.max(
    MIN_COLUMN_WIDTH,
    Math.ceil(measureHeaderText(label) + HEADER_CHROME_WIDTH),
  );

  widthByLabel.set(label, width);

  return width;
};
