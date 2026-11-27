import { createContext } from 'react';

export type RoboostEmailContextRecord = {
  objectNameSingular: string;
  recordId: string;
};

// A record page sets its record, so any email on the page drafts with that record's associations
export const RoboostEmailContextRecordContext =
  createContext<RoboostEmailContextRecord | null>(null);
