import { type ActivityObjectNameSingular } from '@/activities/types/ActivityObjectNameSingular';
import { useCreateActivityForTargetRecord } from '@/activities/hooks/useCreateActivityForTargetRecord';
import { type ActivityTargetableObject } from '@/activities/types/ActivityTargetableEntity';
import {
  type RelatedRecordAction,
  type RelatedRecordActionBinding,
} from '@/activities/types/RelatedRecordAction';
import { t } from '@lingui/core/macro';
import { CoreObjectNameSingular } from 'twenty-shared/types';
import {
  IconCheckbox,
  IconMessageCircle,
  IconNotes,
  IconPhone,
} from 'twenty-ui/icon';

type UseCreateActivityRelatedRecordActionParams = {
  targetRecord: ActivityTargetableObject;
  activityObjectNameSingular: ActivityObjectNameSingular;
};

const getCreateActivityActionDisplay = (
  activityObjectNameSingular: ActivityObjectNameSingular,
): Pick<RelatedRecordAction, 'id' | 'label' | 'Icon'> => {
  switch (activityObjectNameSingular) {
    case CoreObjectNameSingular.Task:
      return { id: 'create-task', label: t`Create task`, Icon: IconCheckbox };
    case CoreObjectNameSingular.Call:
      return { id: 'create-call', label: t`Log call`, Icon: IconPhone };
    case CoreObjectNameSingular.Communication:
      return {
        id: 'create-communication',
        label: t`Log communication`,
        Icon: IconMessageCircle,
      };
    case CoreObjectNameSingular.Note:
      return { id: 'create-note', label: t`Create note`, Icon: IconNotes };
  }
};

export const useCreateActivityRelatedRecordAction = ({
  targetRecord,
  activityObjectNameSingular,
}: UseCreateActivityRelatedRecordActionParams): RelatedRecordActionBinding => {
  const { canCreateActivity, createActivity } =
    useCreateActivityForTargetRecord({
      targetRecord,
      activityObjectNameSingular,
    });

  const { id, label, Icon } = getCreateActivityActionDisplay(
    activityObjectNameSingular,
  );

  return {
    action: {
      id,
      label,
      Icon,
      isVisible: canCreateActivity,
      disabled: false,
      execute: createActivity,
    },
  };
};
