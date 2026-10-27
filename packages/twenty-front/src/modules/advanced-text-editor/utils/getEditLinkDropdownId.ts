export const getEditLinkDropdownId = ({
  editorInstanceId,
  bubbleMenuType,
}: {
  editorInstanceId: string;
  bubbleMenuType: 'text' | 'link' | 'toolbar';
}) => `edit-link-dropdown-${bubbleMenuType}-${editorInstanceId}`;
