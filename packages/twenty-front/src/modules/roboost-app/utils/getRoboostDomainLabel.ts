import { isNonEmptyString } from '@sniptt/guards';

export const getRoboostDomainLabel = (url: string | null | undefined) =>
  isNonEmptyString(url)
    ? url
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '')
        .replace(/\/$/, '')
    : '';
