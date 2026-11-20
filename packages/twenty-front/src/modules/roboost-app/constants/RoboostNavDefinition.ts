import { type RoboostIconName } from '@/roboost-ui/types/RoboostIconName';

export type RoboostNavEntry = {
  id: string;
  icon: RoboostIconName;
  objectNamePlural?: string;
  path?: string;
};

export type RoboostNavGroupDefinition = {
  groupId: 'main' | 'workspace' | 'system';
  entries: RoboostNavEntry[];
};

// Groups and order from the design hand-off; entries whose object is missing are skipped
export const ROBOOST_NAV_DEFINITION: RoboostNavGroupDefinition[] = [
  {
    groupId: 'main',
    entries: [
      { id: 'home', icon: 'home', path: '/' },
      { id: 'companies', icon: 'building', objectNamePlural: 'companies' },
      { id: 'people', icon: 'contacts', objectNamePlural: 'people' },
      { id: 'opportunities', icon: 'deals', objectNamePlural: 'opportunities' },
      { id: 'services', icon: 'services', objectNamePlural: 'services' },
    ],
  },
  {
    groupId: 'workspace',
    entries: [
      { id: 'tasks', icon: 'tasks', objectNamePlural: 'tasks' },
      { id: 'notes', icon: 'note', objectNamePlural: 'notes' },
      {
        id: 'calendarEvents',
        icon: 'calendar',
        objectNamePlural: 'calendarEvents',
      },
      { id: 'emails', icon: 'mail', objectNamePlural: 'emails' },
    ],
  },
  {
    groupId: 'system',
    entries: [
      { id: 'workflows', icon: 'workflows', objectNamePlural: 'workflows' },
      { id: 'settings', icon: 'settings', path: '/settings/profile' },
    ],
  },
];
