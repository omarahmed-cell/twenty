import { Icon } from '@/roboost-ui/components/Icon';
import { cx } from '@/roboost-ui/utils/cx';

type RoboostDomainLinkProps = {
  url: string;
  label: string;
  className?: string;
};

// A website opens in a new tab; the ↗ says so
export const RoboostDomainLink = ({
  url,
  label,
  className,
}: RoboostDomainLinkProps) => (
  <a
    className={cx('rb-ldomain', className)}
    href={/^https?:\/\//i.test(url) ? url : `https://${url}`}
    target="_blank"
    rel="noreferrer"
    onPointerDown={(event) => event.stopPropagation()}
    onClick={(event) => event.stopPropagation()}
  >
    <span className="rb-truncate">{label}</span>
    <Icon name="external-link" size={12} className="rb-ldomain-icon" />
  </a>
);
