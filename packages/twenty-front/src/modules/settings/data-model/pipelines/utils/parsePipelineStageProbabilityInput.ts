const MIN_PROBABILITY = 0;
const MAX_PROBABILITY = 100;

export type ParsedPipelineStageProbability =
  | { isValid: true; probability: number | null }
  | { isValid: false };

// An empty input clears the probability; anything else must be a whole number from 0 to 100
export const parsePipelineStageProbabilityInput = (
  input: string,
): ParsedPipelineStageProbability => {
  const trimmedInput = input.trim().replace(/%$/, '').trim();

  if (trimmedInput === '') {
    return { isValid: true, probability: null };
  }

  if (!/^\d+$/.test(trimmedInput)) {
    return { isValid: false };
  }

  const probability = Number(trimmedInput);

  if (probability < MIN_PROBABILITY || probability > MAX_PROBABILITY) {
    return { isValid: false };
  }

  return { isValid: true, probability };
};
