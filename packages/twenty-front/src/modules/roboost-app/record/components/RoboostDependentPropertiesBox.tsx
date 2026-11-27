import { Icon } from '@/roboost-ui/components/Icon';
import { useLingui } from '@lingui/react/macro';
import { type ReactNode } from 'react';

export const RoboostDependentPropertiesBox = ({
  children,
}: {
  children: ReactNode;
}) => {
  const { t } = useLingui();

  return (
    <div
      className="rb-dep-box"
      role="group"
      aria-label={t`Dependent properties`}
    >
      <div className="rb-dep-title">
        {t`Dependent properties`}
        <span
          className="rb-dep-info"
          data-tip={t`Shown because a conditional logic rule on the property above is met`}
        >
          <Icon name="info" size={14} />
        </span>
      </div>
      {children}
    </div>
  );
};
