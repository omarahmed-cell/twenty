import { gql } from '@apollo/client';

export const ROBOOST_CURRENCIES = gql`
  query RoboostCurrencies {
    roboostCurrencies {
      code
      name
      symbol
      decimals
      isCompanyCurrency
      isArchived
      rate
      rateDate
      rateSource
      setByName
      addedAt
    }
  }
`;

export const ROBOOST_CURRENCY_STATUS = gql`
  query RoboostCurrencyStatus {
    roboostCurrencyStatus {
      autoUpdateEnabled
      frequency
      lastRun {
        at
        status
        message
        missingCodes
        attempts
      }
      lastSuccessAt
      nextUpdateOn
      hasAppId
      appIdMasked
      storageBytes
    }
  }
`;

export const ROBOOST_CURRENCY_SETTINGS_HISTORY = gql`
  query RoboostCurrencySettingsHistory {
    roboostCurrencySettingsHistory {
      id
      action
      detail
      actorName
      createdAt
    }
  }
`;

export const ROBOOST_EXCHANGE_RATE_LOG = gql`
  query RoboostExchangeRateLog($code: String!, $date: String) {
    roboostExchangeRateLog(code: $code, date: $date) {
      companyCurrency
      effective {
        rate
        effectiveDate
        source
        setByName
        createdAt
      }
      history {
        rate
        effectiveDate
        source
        setByName
        createdAt
      }
    }
  }
`;

export const ROBOOST_SUGGESTED_EXCHANGE_RATE = gql`
  query RoboostSuggestedExchangeRate($code: String!) {
    roboostSuggestedExchangeRate(code: $code)
  }
`;

export const ROBOOST_ADD_CURRENCY = gql`
  mutation RoboostAddCurrency($code: String!, $rate: Float!) {
    roboostAddCurrency(code: $code, rate: $rate)
  }
`;

export const ROBOOST_SET_EXCHANGE_RATE = gql`
  mutation RoboostSetExchangeRate(
    $code: String!
    $rate: Float!
    $effectiveDate: String!
  ) {
    roboostSetExchangeRate(
      code: $code
      rate: $rate
      effectiveDate: $effectiveDate
    )
  }
`;

export const ROBOOST_SET_CURRENCY_ARCHIVED = gql`
  mutation RoboostSetCurrencyArchived($code: String!, $isArchived: Boolean!) {
    roboostSetCurrencyArchived(code: $code, isArchived: $isArchived)
  }
`;

export const ROBOOST_CHANGE_COMPANY_CURRENCY = gql`
  mutation RoboostChangeCompanyCurrency($code: String!) {
    roboostChangeCompanyCurrency(code: $code)
  }
`;

export const ROBOOST_SET_CURRENCY_AUTO_UPDATE = gql`
  mutation RoboostSetCurrencyAutoUpdate(
    $enabled: Boolean!
    $frequency: String!
  ) {
    roboostSetCurrencyAutoUpdate(enabled: $enabled, frequency: $frequency)
  }
`;

export const ROBOOST_SET_EXCHANGE_RATE_APP_ID = gql`
  mutation RoboostSetExchangeRateAppId($appId: String) {
    roboostSetExchangeRateAppId(appId: $appId)
  }
`;

export const ROBOOST_TEST_EXCHANGE_RATE_CONNECTION = gql`
  mutation RoboostTestExchangeRateConnection {
    roboostTestExchangeRateConnection {
      ok
      message
      currencies
    }
  }
`;

export const ROBOOST_RUN_EXCHANGE_RATE_UPDATE = gql`
  mutation RoboostRunExchangeRateUpdate {
    roboostRunExchangeRateUpdate {
      at
      status
      message
      missingCodes
      attempts
    }
  }
`;
