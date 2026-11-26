import { msg } from '@lingui/core/macro';
import {
  getSelectOptionUniversalIdentifier,
  TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
} from 'twenty-shared/application';
import {
  RECORD_SOURCE_LABELS,
  type RECORD_SOURCE_OBJECT_NAMES,
} from 'twenty-shared/constants';
import { STANDARD_OBJECTS } from 'twenty-shared/metadata';
import {
  FieldActorSource,
  FieldMetadataType,
  type TagColor,
} from 'twenty-shared/types';

import { type AllStandardObjectFieldName } from 'src/engine/workspace-manager/twenty-standard-application/types/all-standard-object-field-name.type';
import { type FlatFieldMetadata } from 'src/engine/metadata-modules/flat-field-metadata/types/flat-field-metadata.type';
import {
  type CreateStandardFieldArgs,
  createStandardFieldFlatMetadata,
} from 'src/engine/workspace-manager/twenty-standard-application/utils/field-metadata/create-standard-field-flat-metadata.util';
import { i18nLabel } from 'src/engine/workspace-manager/twenty-standard-application/utils/i18n-label.util';

type RecordSourceObjectName = (typeof RECORD_SOURCE_OBJECT_NAMES)[number];

const RECORD_SOURCE_OPTION_COLORS: Record<FieldActorSource, TagColor> = {
  [FieldActorSource.MANUAL]: 'blue',
  [FieldActorSource.IMPORT]: 'turquoise',
  [FieldActorSource.API]: 'purple',
  [FieldActorSource.EMAIL]: 'sky',
  [FieldActorSource.CALENDAR]: 'sky',
  [FieldActorSource.WORKFLOW]: 'orange',
  [FieldActorSource.SYSTEM]: 'gray',
  [FieldActorSource.AGENT]: 'pink',
  [FieldActorSource.WEBHOOK]: 'purple',
  [FieldActorSource.APPLICATION]: 'green',
  [FieldActorSource.FORMS]: 'yellow',
  [FieldActorSource.DOCUMENT_APP]: 'red',
  [FieldActorSource.SEQUENCE]: 'orange',
  [FieldActorSource.GMAIL_EXTENSION]: 'sky',
};

export const buildRecordSourceSelectOptions = (
  objectName: RecordSourceObjectName,
) =>
  Object.values(FieldActorSource).map((source, position) => ({
    id: getSelectOptionUniversalIdentifier({
      applicationUniversalIdentifier:
        TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
      fieldUniversalIdentifier:
        STANDARD_OBJECTS[objectName].fields.recordSource.universalIdentifier,
      value: source,
    }),
    value: source,
    label: RECORD_SOURCE_LABELS[source],
    position,
    color: RECORD_SOURCE_OPTION_COLORS[source],
  }));

export const createStandardRecordSourceFieldFlatMetadata = <
  O extends RecordSourceObjectName,
>(
  args: Omit<CreateStandardFieldArgs<O, FieldMetadataType.SELECT>, 'context'>,
): FlatFieldMetadata =>
  createStandardFieldFlatMetadata({
    ...args,
    context: {
      fieldName: 'recordSource' as AllStandardObjectFieldName<O>,
      type: FieldMetadataType.SELECT,
      label: i18nLabel(
        msg({ message: `Record source`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `How the record was created`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconSourceCode',
      isNullable: true,
      isUIEditable: false,
      options: buildRecordSourceSelectOptions(args.objectName),
    },
  });
