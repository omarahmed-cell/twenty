import {
  type EditLinkCommandChain,
  type EditLinkEditor,
} from '@/advanced-text-editor/types/EditLinkEditor';
import { isNonEmptyString } from '@sniptt/guards';
import { type Editor } from '@tiptap/core';

// Unlike the bubble menus, the toolbar is reachable without a selection, where setLink would only
// store an invisible mark; there the URL is inserted as linked text instead
export const buildFixedToolbarLinkEditor = (
  editor: Editor,
): EditLinkEditor => ({
  view: editor.view,
  chain: () => {
    if (!editor.state.selection.empty || editor.isActive('link')) {
      return editor.chain();
    }

    let href: string | undefined;

    const insertLinkChain: EditLinkCommandChain = {
      focus: () => insertLinkChain,
      extendMarkRange: () => insertLinkChain,
      setLink: (attributes) => {
        href = attributes.href;
        return insertLinkChain;
      },
      unsetLink: () => insertLinkChain,
      run: () =>
        isNonEmptyString(href)
          ? editor
              .chain()
              .focus()
              .insertContent({
                type: 'text',
                text: href,
                marks: [{ type: 'link', attrs: { href } }],
              })
              .run()
          : true,
    };

    return insertLinkChain;
  },
});
