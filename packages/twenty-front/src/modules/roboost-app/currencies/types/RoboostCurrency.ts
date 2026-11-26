export type RoboostCurrency = {
  code: string;
  name: string;
  symbol: string;
  decimals: number;
  isCompanyCurrency: boolean;
  isArchived: boolean;
  rate: number;
  rateDate: string | null;
  rateSource: 'AUTOMATIC' | 'MANUAL' | 'IMPORT' | null;
  setByName: string | null;
  addedAt: string;
};

export type RoboostCurrencyLastRun = {
  at: string;
  status: 'COMPLETED' | 'FAILED' | 'NOT_DUE' | 'DISABLED' | 'NO_APP_ID';
  message: string | null;
  missingCodes: string[];
  attempts: number;
};

export type RoboostCurrencyStatus = {
  autoUpdateEnabled: boolean;
  frequency: 'DAILY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  lastRun: RoboostCurrencyLastRun | null;
  lastSuccessAt: string | null;
  nextUpdateOn: string | null;
  hasAppId: boolean;
  appIdMasked: string | null;
  storageBytes: number;
};
