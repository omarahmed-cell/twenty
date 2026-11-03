const IDENTIFIER_START = /[a-zA-Z_$]/;
const IDENTIFIER_PART = /[a-zA-Z0-9_$]/;

const isQuote = (character: string) => character === '"' || character === "'";

// Only whole field references change: strings, nested properties (x.name) and function
// names (name()) can spell the same word without referring to the field.
export const renameFormulaField = (
  expression: string,
  previousName: string,
  nextName: string,
): string => {
  let result = '';
  let index = 0;
  let previousSignificantCharacter = '';

  while (index < expression.length) {
    const character = expression.charAt(index);

    if (isQuote(character)) {
      const start = index;

      index += 1;

      while (
        index < expression.length &&
        expression.charAt(index) !== character
      ) {
        index += expression.charAt(index) === '\\' ? 2 : 1;
      }

      index += 1;
      result += expression.slice(start, index);
      previousSignificantCharacter = character;
      continue;
    }

    if (IDENTIFIER_START.test(character)) {
      const start = index;

      while (
        index < expression.length &&
        IDENTIFIER_PART.test(expression.charAt(index))
      ) {
        index += 1;
      }

      const identifier = expression.slice(start, index);
      const nextSignificantCharacter = expression
        .slice(index)
        .trimStart()
        .charAt(0);

      result +=
        identifier === previousName &&
        previousSignificantCharacter !== '.' &&
        nextSignificantCharacter !== '('
          ? nextName
          : identifier;
      previousSignificantCharacter = identifier.charAt(identifier.length - 1);
      continue;
    }

    if (character.trim() !== '') {
      previousSignificantCharacter = character;
    }

    result += character;
    index += 1;
  }

  return result;
};
