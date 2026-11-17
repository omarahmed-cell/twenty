import IllustrationIconCalculatorRaw from '@assets/icons/illustration-calculator.svg?react';
import { IllustrationIconWrapper } from '@ui/icon/components/IllustrationIconWrapper';
import { type IconComponentProps } from '@ui/icon/types/IconComponent';
import { useTheme } from '@ui/theme';

type IllustrationIconCalculatorProps = Pick<IconComponentProps, 'size'>;

export const IllustrationIconCalculator = (
  props: IllustrationIconCalculatorProps,
) => {
  const theme = useTheme();
  const size = props.size ?? theme.icon.size.lg;
  return (
    <IllustrationIconWrapper>
      <IllustrationIconCalculatorRaw
        height={size}
        width={size}
        fill={theme.accent.accent3}
        color={theme.accent.accent8}
      />
    </IllustrationIconWrapper>
  );
};
