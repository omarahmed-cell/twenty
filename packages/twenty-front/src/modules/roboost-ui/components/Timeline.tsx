import { cx } from '@/roboost-ui/utils/cx';
import { type ReactNode } from 'react';

export type TimelineProps = { children?: ReactNode; className?: string };

export const Timeline = ({ children, className }: TimelineProps) => (
  <div className={cx('rb-timeline', className)}>{children}</div>
);
