import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { type RoboostCompanyColumn } from '@/roboost-app/constants/RoboostCompanyColumns';
import { formatRoboostDate } from '@/roboost-app/utils/formatRoboostDate';
import { getRoboostAvatarTone } from '@/roboost-app/utils/getRoboostAvatarTone';
import { getRoboostDomainLabel } from '@/roboost-app/utils/getRoboostDomainLabel';
import { getRoboostOptionTone } from '@/roboost-app/utils/getRoboostOptionTone';
import {
  getRoboostPersonName,
  type RoboostFullName,
} from '@/roboost-app/utils/getRoboostPersonName';
import { type DataTableRow } from '@/roboost-ui/components/DataTable';
import { isNonEmptyString } from '@sniptt/guards';
import { isDefined } from 'twenty-shared/utils';

type MemberValue = {
  id: string;
  name?: RoboostFullName;
  avatarUrl?: string | null;
} | null;

const EMPTY = '—';

export const getRoboostSelectLabel = (
  fieldMetadataItem: FieldMetadataItem | undefined,
  value: unknown,
) =>
  fieldMetadataItem?.options?.find((option) => option.value === value)?.label ??
  (isNonEmptyString(value) ? value : undefined);

export const buildRoboostCompanyRow = (
  record: ObjectRecord,
  columns: RoboostCompanyColumn[],
  fieldsByName: Map<string, FieldMetadataItem>,
): DataTableRow => {
  const row: DataTableRow = { id: record.id };

  for (const column of columns) {
    const value = record[column.fieldName];
    const fieldMetadataItem = fieldsByName.get(column.fieldName);

    switch (column.kind) {
      case 'name': {
        const name = isNonEmptyString(value) ? value : EMPTY;

        row[column.fieldName] = { name, tone: getRoboostAvatarTone(name) };
        break;
      }
      case 'select': {
        const label = getRoboostSelectLabel(fieldMetadataItem, value);
        const option = fieldMetadataItem?.options?.find(
          (selectOption) => selectOption.value === value,
        );

        row[column.fieldName] =
          column.fieldName === 'leadStatus' && isDefined(label)
            ? {
                ...getRoboostOptionTone({
                  value: String(value),
                  color: option?.color,
                }),
                label,
              }
            : (label ?? EMPTY);
        break;
      }
      case 'member': {
        const member = value as MemberValue;
        const name = getRoboostPersonName(member?.name);

        row[column.fieldName] = isNonEmptyString(name)
          ? { name, src: member?.avatarUrl }
          : EMPTY;
        break;
      }
      case 'domain': {
        const domain = getRoboostDomainLabel(
          (value as { primaryLinkUrl?: string | null } | null)?.primaryLinkUrl,
        );

        row[column.fieldName] = isNonEmptyString(domain) ? domain : EMPTY;
        break;
      }
      case 'date':
        row[column.fieldName] = formatRoboostDate(value as string | null);
        break;
      default:
        row[column.fieldName] =
          isDefined(value) && value !== '' ? String(value) : EMPTY;
    }
  }

  return row;
};
