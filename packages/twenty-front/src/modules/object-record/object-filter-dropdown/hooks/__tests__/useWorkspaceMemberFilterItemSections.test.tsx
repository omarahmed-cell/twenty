import { i18n } from '@lingui/core';
import { I18nProvider } from '@lingui/react';
import { render, screen } from '@testing-library/react';
import { Provider as JotaiProvider } from 'jotai';
import { SOURCE_LOCALE } from 'twenty-shared/translations';

import { currentWorkspaceMembersState } from '@/auth/states/currentWorkspaceMembersState';
import { useWorkspaceMemberFilterItemSections } from '@/object-record/object-filter-dropdown/hooks/useWorkspaceMemberFilterItemSections';
import { MultipleSelectDropdown } from '@/object-record/select/components/MultipleSelectDropdown';
import { type SelectableItem } from '@/object-record/select/types/SelectableItem';
import {
  jotaiStore,
  resetJotaiStore,
} from '@/ui/utilities/state/jotai/jotaiStore';
import { dynamicActivate } from '~/utils/i18n/dynamicActivate';

dynamicActivate(SOURCE_LOCALE);

const LIST_ID = 'workspace-member-filter-test';

const ITEMS_TO_SELECT: SelectableItem[] = [
  { id: 'jane', name: 'Jane Austen (deactivated)', isSelected: false },
  { id: 'phil', name: 'Phil Schiler', isSelected: false },
];

const WorkspaceMemberFilterList = () => {
  const { activeItemsToSelect, deactivatedSection } =
    useWorkspaceMemberFilterItemSections({
      itemsToSelect: ITEMS_TO_SELECT,
      isWorkspaceMemberList: true,
    });

  return (
    <MultipleSelectDropdown
      selectableListId={LIST_ID}
      focusId={LIST_ID}
      itemsToSelect={activeItemsToSelect}
      secondarySection={deactivatedSection}
      filteredSelectedItems={[]}
      selectedItems={[]}
      searchFilter=""
      loadingItems={false}
      onChange={jest.fn()}
    />
  );
};

describe('useWorkspaceMemberFilterItemSections', () => {
  beforeEach(() => {
    resetJotaiStore();
    jotaiStore.set(currentWorkspaceMembersState.atom, [
      {
        id: 'jane',
        name: { firstName: 'Jane', lastName: 'Austen' },
        userEmail: 'jane@apple.dev',
        memberStatus: 'DEACTIVATED',
      },
      {
        id: 'phil',
        name: { firstName: 'Phil', lastName: 'Schiler' },
        userEmail: 'phil@apple.dev',
        memberStatus: 'ACTIVE',
      },
    ] as never);
  });

  it('keeps deactivated members filterable under a Deactivated section after active ones', () => {
    render(
      <JotaiProvider store={jotaiStore}>
        <I18nProvider i18n={i18n}>
          <WorkspaceMemberFilterList />
        </I18nProvider>
      </JotaiProvider>,
    );

    const activeOption = screen.getByRole('option', { name: /Phil Schiler/ });
    const sectionLabel = screen.getByText('Deactivated');
    const deactivatedOption = screen.getByRole('option', {
      name: /Jane Austen \(deactivated\)/,
    });

    const isFollowing = (first: Node, second: Node) =>
      (first.compareDocumentPosition(second) &
        Node.DOCUMENT_POSITION_FOLLOWING) !==
      0;

    expect(isFollowing(activeOption, sectionLabel)).toBe(true);
    expect(isFollowing(sectionLabel, deactivatedOption)).toBe(true);
  });
});
