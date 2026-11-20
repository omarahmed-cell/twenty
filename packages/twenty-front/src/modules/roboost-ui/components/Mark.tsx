import { RoboostMark } from '@/ui/brand/components/RoboostMark';

export type MarkProps = { height?: number };

export const Mark = ({ height = 24 }: MarkProps) => (
  <RoboostMark height={height} />
);
