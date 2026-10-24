import { WidgetActionActivityCreate } from '@/page-layout/widgets/components/WidgetActionActivityCreate';
import { CoreObjectNameSingular } from 'twenty-shared/types';

export const WidgetActionCommunicationCreate = () => (
  <WidgetActionActivityCreate
    activityObjectNameSingular={CoreObjectNameSingular.Communication}
  />
);
