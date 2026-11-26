import { DropdownRoot } from '@/ui/layout/dropdown/components/DropdownRoot';
import { DropdownContent } from '@/ui/layout/dropdown/components/DropdownContent';
import { DROPDOWN_OFFSET_Y } from '@/ui/layout/dropdown/constants/DropdownOffsetY';
import { OPTIONS_DROPDOWN_GLOBAL_HOTKEYS_CONFIG } from '@/ui/layout/dropdown/constants/OptionsDropdownGlobalHotkeysConfig';
import { useLingui } from '@lingui/react/macro';
import { type ReactNode } from 'react';
import { IconButton } from 'twenty-ui/components/input';
import { Dropdown } from 'twenty-ui/components/navigation';
import { IconDotsVertical } from 'twenty-ui/icon';

type SidePanelOptionsDropdownProps = {
  dropdownId: string;
  children: ReactNode;
};

export const SidePanelOptionsDropdown = ({
  dropdownId,
  children,
}: SidePanelOptionsDropdownProps) => {
  const { t } = useLingui();

  return (
    <DropdownRoot
      dropdownId={dropdownId}
      type="menu"
      globalHotkeysConfig={OPTIONS_DROPDOWN_GLOBAL_HOTKEYS_CONFIG}
    >
      <Dropdown.Trigger
        render={
          <IconButton aria-label={t`Options`} size="sm" variant="outline">
            <IconDotsVertical />
          </IconButton>
        }
      />
      <DropdownContent side="top" align="end" sideOffset={DROPDOWN_OFFSET_Y}>
        <Dropdown.Section>{children}</Dropdown.Section>
      </DropdownContent>
    </DropdownRoot>
  );
};
