import { i18n } from '@lingui/core';
import { I18nProvider } from '@lingui/react';
import { render, screen } from '@testing-library/react';
import { Provider as JotaiProvider } from 'jotai';
import { type ReactNode } from 'react';
import { SOURCE_LOCALE } from 'twenty-shared/translations';

import { currentWorkspaceMembersState } from '@/auth/states/currentWorkspaceMembersState';
import { ActorDisplay } from '@/ui/field/display/components/ActorDisplay';
import {
  jotaiStore,
  resetJotaiStore,
} from '@/ui/utilities/state/jotai/jotaiStore';
import { dynamicActivate } from '~/utils/i18n/dynamicActivate';

dynamicActivate(SOURCE_LOCALE);

const Wrapper = ({ children }: { children: ReactNode }) => (
  <JotaiProvider store={jotaiStore}>
    <I18nProvider i18n={i18n}>{children}</I18nProvider>
  </JotaiProvider>
);

describe('ActorDisplay', () => {
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

  it('marks a deactivated member who created the record', () => {
    render(
      <ActorDisplay
        name="Jane Austen"
        source="MANUAL"
        workspaceMemberId="jane"
      />,
      { wrapper: Wrapper },
    );

    expect(screen.getByText('Jane Austen (deactivated)')).toBeInTheDocument();
  });

  it('shows an active member as is', () => {
    render(
      <ActorDisplay
        name="Phil Schiler"
        source="MANUAL"
        workspaceMemberId="phil"
      />,
      { wrapper: Wrapper },
    );

    expect(screen.getByText('Phil Schiler')).toBeInTheDocument();
    expect(screen.queryByText(/deactivated/)).not.toBeInTheDocument();
  });
});
