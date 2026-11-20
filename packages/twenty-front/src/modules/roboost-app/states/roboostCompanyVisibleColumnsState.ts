import { ROBOOST_COMPANY_COLUMNS } from '@/roboost-app/constants/RoboostCompanyColumns';
import { createAtomState } from '@/ui/utilities/state/jotai/utils/createAtomState';

export const roboostCompanyVisibleColumnsState = createAtomState<string[]>({
  key: 'roboostCompanyVisibleColumns',
  defaultValue: ROBOOST_COMPANY_COLUMNS.filter(
    (column) => column.isVisibleByDefault,
  ).map((column) => column.fieldName),
  useLocalStorage: true,
});
