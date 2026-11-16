import { createContext } from 'react';

// Lets a modal lift every dropdown it contains above itself without threading a prop through each input
export const DropdownInModalContext = createContext(false);
