import { styled } from '@linaria/react';
import { type ReactNode } from 'react';

const StyledTimeline = styled.div`
  display: flex;
  flex-direction: column;
`;

export type TimelineProps = { children?: ReactNode; className?: string };

export const Timeline = ({ children, className }: TimelineProps) => (
  <StyledTimeline className={className}>{children}</StyledTimeline>
);
