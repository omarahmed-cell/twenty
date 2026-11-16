type OptionIdentity = { id: string; value: string };

// Options keep their id across a rename, so the stored value follows the id
export const computeSelectOptionConversions = ({
  fromOptions,
  toOptions,
  countByValue,
}: {
  fromOptions: OptionIdentity[];
  toOptions: OptionIdentity[];
  countByValue: Record<string, number>;
}): Record<string, number> => {
  const toValueById = new Map(toOptions.map(({ id, value }) => [id, value]));

  return Object.fromEntries(
    fromOptions
      .filter(({ id, value }) => toValueById.get(id) !== value)
      .map(({ id, value }) => [
        `${value} -> ${toValueById.get(id) ?? 'removed'}`,
        countByValue[value] ?? 0,
      ]),
  );
};
