import { type I18n } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { isNonEmptyString } from '@sniptt/guards';

export type RoboostRecordImportSource = {
  isImport: boolean;
  importName: string | null;
};

export const getRoboostCreatedTitle = ({
  objectLabel,
  importSource,
  i18n,
}: {
  objectLabel: string;
  importSource: RoboostRecordImportSource | null | undefined;
  i18n: I18n;
}) => {
  if (importSource?.isImport !== true) {
    return i18n._(msg`${objectLabel} created`);
  }

  const importName = importSource.importName;

  return isNonEmptyString(importName)
    ? i18n._(msg`Created from import "${importName}"`)
    : i18n._(msg`Created from an import`);
};
