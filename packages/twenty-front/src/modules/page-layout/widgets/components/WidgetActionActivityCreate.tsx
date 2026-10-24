import { type ActivityObjectNameSingular } from '@/activities/types/ActivityObjectNameSingular';
import { useCreateActivityRelatedRecordAction } from '@/activities/hooks/useCreateActivityRelatedRecordAction';
import { WidgetActionRelatedRecord } from '@/page-layout/widgets/components/WidgetActionRelatedRecord';
import { useTargetRecord } from '@/ui/layout/contexts/useTargetRecord';

type WidgetActionActivityCreateProps = {
  activityObjectNameSingular: ActivityObjectNameSingular;
};

export const WidgetActionActivityCreate = ({
  activityObjectNameSingular,
}: WidgetActionActivityCreateProps) => {
  const targetRecord = useTargetRecord();
  const binding = useCreateActivityRelatedRecordAction({
    targetRecord,
    activityObjectNameSingular,
  });

  return <WidgetActionRelatedRecord binding={binding} />;
};
