import { msg } from '@lingui/core/macro';
import { type MessageDescriptor } from '@lingui/core';

export type RoboostCompanyColumnKind =
  | 'name'
  | 'select'
  | 'member'
  | 'mono'
  | 'domain'
  | 'date'
  | 'number'
  | 'text';

export type RoboostCompanyColumn = {
  fieldName: string;
  kind: RoboostCompanyColumnKind;
  label?: MessageDescriptor;
  sortable: boolean;
  isVisibleByDefault: boolean;
};

// Order and labels from the Companies list design; the rest can be switched on in the column picker
export const ROBOOST_COMPANY_COLUMNS: RoboostCompanyColumn[] = [
  {
    fieldName: 'name',
    kind: 'name',
    label: msg`Company name`,
    sortable: true,
    isVisibleByDefault: true,
  },
  {
    fieldName: 'leadStatus',
    kind: 'select',
    label: msg`Lead status`,
    sortable: true,
    isVisibleByDefault: true,
  },
  {
    fieldName: 'sdrOwner',
    kind: 'member',
    label: msg`SDR owner`,
    sortable: false,
    isVisibleByDefault: true,
  },
  {
    fieldName: 'hubspotId',
    kind: 'mono',
    label: msg`Record ID`,
    sortable: true,
    isVisibleByDefault: true,
  },
  {
    fieldName: 'domainName',
    kind: 'domain',
    label: msg`Domain name`,
    sortable: false,
    isVisibleByDefault: true,
  },
  {
    fieldName: 'operatesIn',
    kind: 'select',
    label: msg`Operates in`,
    sortable: true,
    isVisibleByDefault: true,
  },
  {
    fieldName: 'createdAt',
    kind: 'date',
    label: msg`Create date`,
    sortable: true,
    isVisibleByDefault: true,
  },
  {
    fieldName: 'accountOwner',
    kind: 'member',
    label: msg`Company owner`,
    sortable: false,
    isVisibleByDefault: false,
  },
  {
    fieldName: 'lastActivityDate',
    kind: 'date',
    label: msg`Last activity date`,
    sortable: true,
    isVisibleByDefault: false,
  },
  {
    fieldName: 'lifecycleStage',
    kind: 'select',
    sortable: true,
    isVisibleByDefault: false,
  },
  {
    fieldName: 'noOfBranches',
    kind: 'number',
    sortable: true,
    isVisibleByDefault: false,
  },
  {
    fieldName: 'recordSource',
    kind: 'select',
    sortable: true,
    isVisibleByDefault: false,
  },
];
