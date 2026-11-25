type RoboostExtraValueChipsProps = {
  values: string[];
};

// The extra emails or domains after the primary one, as small chips
export const RoboostExtraValueChips = ({
  values,
}: RoboostExtraValueChipsProps) =>
  values.length === 0 ? null : (
    <span className="rb-mv-chips is-display" title={values.join(', ')}>
      {values.map((extra) => (
        <span key={extra} className="rb-mv-chip is-display">
          {extra}
        </span>
      ))}
    </span>
  );
