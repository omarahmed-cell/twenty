import {
  type RoboostObjectPermissions,
  type RoboostPermissionObjectItem,
  type RoboostPermissionSection,
  type RoboostRecordScope,
} from '@/types/RoboostPermissions';

// Every module registers its permissions here; the Edit permissions screen, defaults, summaries and
// server enforcement all read this list. New modules (Merge, Documents, Sequences, ...) add a section or item.

const VIEW_SCOPES: RoboostRecordScope[] = ['ALL', 'TEAM', 'OWN'];
const WRITE_SCOPES: RoboostRecordScope[] = ['ALL', 'TEAM', 'OWN', 'NONE'];

const CRM_OBJECT_DEFAULTS: RoboostObjectPermissions = {
  enabled: true,
  view: { scope: 'ALL', includeUnassigned: false },
  create: true,
  edit: { scope: 'OWN', includeUnassigned: true },
  delete: { scope: 'NONE', includeUnassigned: false },
  merge: { scope: 'OWN', includeUnassigned: true },
};

const buildCrmObjectItem = (
  objectNameSingular: string,
  label: string,
  shortLabel: string,
): RoboostPermissionObjectItem => ({
  kind: 'object',
  key: objectNameSingular,
  objectNameSingular,
  label,
  shortLabel,
  settings: ['view', 'create', 'edit', 'delete', 'merge'],
  scopeOptions: {
    view: VIEW_SCOPES,
    edit: WRITE_SCOPES,
    delete: WRITE_SCOPES,
    merge: WRITE_SCOPES,
  },
  defaults: CRM_OBJECT_DEFAULTS,
  supportsUnassigned: true,
  help: 'Merge applies to both records of a merge. Manage duplicates shows to users with Merge on the object; bulk merge needs Merge = All. Unmerge is for admins only.',
});

const ACTIVITY_DEFAULTS: RoboostObjectPermissions = {
  enabled: true,
  create: true,
  edit: { scope: 'OWN', includeUnassigned: false },
  delete: { scope: 'OWN', includeUnassigned: false },
};

const ACTIVITY_HELP =
  'Activities follow their record: a user sees an activity when they can view at least one record it is linked to, or when they created it or it is assigned to them. "Their own" means activities they created or are assigned to (meetings: host or assignee).';

const buildActivityItem = (
  objectNameSingular: string,
  label: string,
): RoboostPermissionObjectItem => ({
  kind: 'object',
  key: objectNameSingular,
  objectNameSingular,
  label,
  shortLabel: label,
  settings: ['create', 'edit', 'delete'],
  scopeOptions: { edit: WRITE_SCOPES, delete: WRITE_SCOPES },
  defaults: ACTIVITY_DEFAULTS,
  supportsUnassigned: false,
  help: ACTIVITY_HELP,
});

export const ROBOOST_PERMISSION_REGISTRY: RoboostPermissionSection[] = [
  {
    id: 'crmObjects',
    label: 'CRM objects',
    description:
      'Which records the user can see and change. "Their team\'s" means records whose owner is in one of the user\'s teams. "Unassigned" means records where every ownership field is empty.',
    items: [
      buildCrmObjectItem('company', 'Companies', 'Companies'),
      buildCrmObjectItem('person', 'Contacts', 'Contacts'),
      buildCrmObjectItem('opportunity', 'Deals', 'Deals'),
      buildCrmObjectItem('service', 'Services', 'Services'),
    ],
  },
  {
    id: 'activities',
    label: 'Activities',
    description: ACTIVITY_HELP,
    items: [
      buildActivityItem('task', 'Tasks'),
      buildActivityItem('note', 'Notes'),
      buildActivityItem('email', 'Emails'),
      buildActivityItem('meeting', 'Meetings'),
      buildActivityItem('call', 'Calls'),
      buildActivityItem('communication', 'Communications'),
    ],
  },
  {
    id: 'segments',
    label: 'Segments',
    description:
      'A segment belongs to its Segment owner (the creator by default). Edit means adding or removing records and changing the segment.',
    items: [
      {
        kind: 'object',
        key: 'segment',
        objectNameSingular: 'segment',
        label: 'Segments',
        shortLabel: 'Segments',
        settings: ['view', 'create', 'edit', 'delete'],
        scopeOptions: {
          view: VIEW_SCOPES,
          edit: WRITE_SCOPES,
          delete: WRITE_SCOPES,
        },
        defaults: {
          enabled: true,
          view: { scope: 'ALL', includeUnassigned: false },
          create: true,
          edit: { scope: 'OWN', includeUnassigned: false },
          delete: { scope: 'NONE', includeUnassigned: false },
        },
        supportsUnassigned: true,
      },
    ],
  },
  {
    id: 'crmTools',
    label: 'CRM tools',
    items: [
      {
        kind: 'toggleGroup',
        key: 'crmTools',
        label: 'CRM tools',
        shortLabel: 'CRM tools',
        toggles: [
          {
            key: 'bulkDelete',
            label: 'Bulk delete',
            help: 'Delete several records at once.',
            isCritical: true,
            defaultValue: false,
          },
          {
            key: 'import',
            label: 'Import',
            help: 'Import records from a file.',
            defaultValue: false,
          },
          {
            key: 'export',
            label: 'Export',
            help: 'Export records to a file.',
            defaultValue: false,
          },
          {
            key: 'editAssociations',
            label: 'Edit associations',
            help: 'Associate records with each other or remove those associations.',
            defaultValue: true,
          },
          {
            key: 'arrangeCards',
            label: 'Arrange cards',
            help: 'Reorder the cards on record pages.',
            defaultValue: true,
          },
          {
            key: 'customizeCards',
            label: 'Customize cards',
            help: 'Layout > Record view: choose the properties on each card and add cards.',
            defaultValue: false,
          },
          {
            key: 'createViews',
            label: 'Create CRM views',
            help: 'Create saved views on lists and boards.',
            defaultValue: true,
          },
        ],
      },
    ],
  },
  {
    id: 'salesTools',
    label: 'Sales tools',
    items: [
      {
        kind: 'toggleGroup',
        key: 'documents',
        label: 'Documents & email templates',
        shortLabel: 'Documents',
        help: 'Stored now; applied when the Documents & templates module is built.',
        toggles: [
          {
            key: 'documentsCreate',
            label: 'Create',
            isStoredOnly: true,
            defaultValue: true,
          },
          {
            key: 'documentsEdit',
            label: 'Edit',
            isStoredOnly: true,
            defaultValue: true,
          },
          {
            key: 'documentsDelete',
            label: 'Delete',
            isCritical: true,
            isStoredOnly: true,
            defaultValue: false,
          },
        ],
      },
      {
        kind: 'toggleGroup',
        key: 'sequences',
        label: 'Sequences',
        shortLabel: 'Sequences',
        help: 'Stored now; applied when the Sequences module is built.',
        toggles: [
          {
            key: 'sequencesView',
            label: 'View',
            isStoredOnly: true,
            defaultValue: true,
          },
          {
            key: 'sequencesCreate',
            label: 'Create',
            isStoredOnly: true,
            defaultValue: true,
          },
          {
            key: 'sequencesEdit',
            label: 'Edit',
            isStoredOnly: true,
            defaultValue: true,
          },
          {
            key: 'sequencesDelete',
            label: 'Delete',
            isCritical: true,
            isStoredOnly: true,
            defaultValue: false,
          },
        ],
      },
      {
        kind: 'toggleGroup',
        key: 'scoring',
        label: 'Scoring',
        shortLabel: 'Scoring',
        help: 'Off: the user can only view the Scoring page and test records.',
        toggles: [
          {
            key: 'scoringEdit',
            label: 'Create and edit scores',
            defaultValue: false,
          },
        ],
      },
    ],
  },
  {
    id: 'products',
    label: 'Products',
    description: 'Line items follow the deal they belong to.',
    items: [
      {
        kind: 'toggleGroup',
        key: 'products',
        label: 'Products',
        shortLabel: 'Products',
        toggles: [
          { key: 'productsView', label: 'View', defaultValue: true },
          { key: 'productsCreate', label: 'Create', defaultValue: false },
          { key: 'productsEdit', label: 'Edit', defaultValue: false },
          {
            key: 'productsDelete',
            label: 'Delete',
            isCritical: true,
            defaultValue: false,
          },
        ],
      },
    ],
  },
  {
    id: 'workflows',
    label: 'Workflows',
    description: 'Users with all three off do not see the Workflows page.',
    items: [
      {
        kind: 'toggleGroup',
        key: 'workflows',
        label: 'Workflows',
        shortLabel: 'Workflows',
        toggles: [
          { key: 'workflowsCreate', label: 'Create', defaultValue: false },
          { key: 'workflowsEdit', label: 'Edit', defaultValue: false },
          {
            key: 'workflowsDelete',
            label: 'Delete',
            isCritical: true,
            defaultValue: false,
          },
        ],
      },
    ],
  },
  {
    id: 'dashboards',
    label: 'Dashboards',
    items: [
      {
        kind: 'toggleGroup',
        key: 'dashboards',
        label: 'Dashboards',
        shortLabel: 'Dashboards',
        toggles: [
          { key: 'dashboardsView', label: 'View', defaultValue: true },
          { key: 'dashboardsCreate', label: 'Create', defaultValue: true },
          { key: 'dashboardsEdit', label: 'Edit', defaultValue: false },
          {
            key: 'dashboardsDelete',
            label: 'Delete',
            isCritical: true,
            defaultValue: false,
          },
        ],
      },
    ],
  },
  {
    id: 'accountSettings',
    label: 'Account settings',
    items: [
      {
        kind: 'toggleGroup',
        key: 'accountSettings',
        label: 'Account settings',
        shortLabel: 'Account settings',
        toggles: [
          {
            key: 'connectGoogle',
            label: 'Connect Google account',
            help: 'Gmail sending, logging and tracking from the CRM, the Gmail extension, Calendar, hosting meetings and Meet recordings.',
            defaultValue: true,
          },
          {
            key: 'appMarketplace',
            label: 'App marketplace access',
            help: 'Install and uninstall apps and integrations.',
            defaultValue: false,
          },
          {
            key: 'permanentDelete',
            label: 'Permanently delete records',
            help: 'Empty the trash and destroy records, on every object. Normal Delete only moves records to the trash.',
            isCritical: true,
            defaultValue: false,
          },
          {
            key: 'editPropertySettings',
            label: 'Edit property settings',
            help: 'Create, edit and delete properties, property groups and conditional logic.',
            defaultValue: false,
          },
          {
            key: 'developerTools',
            label: 'Developer tools',
            help: 'API keys, webhooks and developer settings.',
            defaultValue: false,
          },
          {
            key: 'userTableAccess',
            label: 'User table access',
            help: 'See Settings > Users & Teams with name, email, role, team and created date only.',
            defaultValue: false,
          },
        ],
      },
    ],
  },
];

export const ROBOOST_ADMIN_ONLY_AREAS = [
  'Layout > Forms',
  'Users & Teams (beyond the user table)',
  'Settings > General and Working days',
  'Notification rules',
  'Scoring, when Create and edit scores is off',
];
