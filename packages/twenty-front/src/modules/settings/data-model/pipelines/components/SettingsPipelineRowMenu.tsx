import { useLingui } from '@lingui/react/macro';
import { LightIconButton } from 'twenty-ui/components/input';
import { Dropdown } from 'twenty-ui/components/navigation';
import {
  IconCopy,
  IconDotsVertical,
  IconShare,
  IconTrash,
} from 'twenty-ui/icon';

import { DropdownContent } from '@/ui/layout/dropdown/components/DropdownContent';
import { DropdownRoot } from '@/ui/layout/dropdown/components/DropdownRoot';
import { GenericDropdownContentWidth } from '@/ui/layout/dropdown/constants/GenericDropdownContentWidth';

type SettingsPipelineRowMenuProps = {
  pipelineId: string;
  deleteBlockedMessage: string | null;
  onClone: () => void;
  onDelete: () => void;
};

export const SettingsPipelineRowMenu = ({
  pipelineId,
  deleteBlockedMessage,
  onClone,
  onDelete,
}: SettingsPipelineRowMenuProps) => {
  const { t } = useLingui();

  return (
    <DropdownRoot
      type="menu"
      dropdownId={`settings-pipeline-row-menu-${pipelineId}`}
    >
      <Dropdown.Trigger
        render={
          <LightIconButton aria-label={t`Pipeline options`} emphasis="subtle">
            <IconDotsVertical />
          </LightIconButton>
        }
      />
      <DropdownContent align="end" width={GenericDropdownContentWidth.Large}>
        <Dropdown.Section>
          <Dropdown.ActionItem startIcon={<IconCopy />} onClick={onClone}>
            {t`Clone`}
          </Dropdown.ActionItem>
          <Dropdown.ActionItem
            startIcon={<IconTrash />}
            color="danger"
            disabled={deleteBlockedMessage !== null}
            description={deleteBlockedMessage ?? undefined}
            onClick={onDelete}
          >
            {t`Delete`}
          </Dropdown.ActionItem>
          <Dropdown.ActionItem
            startIcon={<IconShare />}
            disabled
            description={t`Coming with roles & permissions`}
          >
            {t`Manage sharing`}
          </Dropdown.ActionItem>
        </Dropdown.Section>
      </DropdownContent>
    </DropdownRoot>
  );
};
