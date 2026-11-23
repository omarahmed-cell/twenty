import { createContext } from 'react';

// The header slot of a full-screen modal; content portals its Cancel/Save there, on the title line
export const FullScreenHeaderActionsContext = createContext<HTMLElement | null>(
  null,
);
