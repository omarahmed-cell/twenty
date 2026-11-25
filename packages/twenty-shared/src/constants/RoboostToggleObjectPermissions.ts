// Objects governed by on/off toggles rather than record scopes; a missing key means no restriction
export type RoboostToggleObjectPermission = {
  view?: string[];
  create?: string[];
  edit?: string[];
  delete?: string[];
};

// Each list is "any of": a workflow version is written by both creating and editing a workflow
export const ROBOOST_TOGGLE_OBJECT_PERMISSIONS: Record<
  string,
  RoboostToggleObjectPermission
> = {
  product: {
    view: ['productsView'],
    create: ['productsCreate'],
    edit: ['productsEdit'],
    delete: ['productsDelete'],
  },
  dashboard: {
    view: ['dashboardsView'],
    create: ['dashboardsCreate'],
    edit: ['dashboardsEdit'],
    delete: ['dashboardsDelete'],
  },
  workflow: {
    view: ['workflowsCreate', 'workflowsEdit', 'workflowsDelete'],
    create: ['workflowsCreate'],
    edit: ['workflowsEdit'],
    delete: ['workflowsDelete'],
  },
  workflowVersion: {
    view: ['workflowsCreate', 'workflowsEdit', 'workflowsDelete'],
    create: ['workflowsCreate', 'workflowsEdit'],
    edit: ['workflowsCreate', 'workflowsEdit'],
    delete: ['workflowsDelete'],
  },
};

// CRM records whose links to each other count as associations (Edit associations toggle)
export const ROBOOST_ASSOCIATION_OBJECT_NAMES = [
  'company',
  'person',
  'opportunity',
  'service',
];

export const ROBOOST_ASSOCIATION_JUNCTION_OBJECT_NAMES = ['opportunityContact'];
