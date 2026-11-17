import { MockedProvider } from '@apollo/client/testing/react';
import { i18n } from '@lingui/core';
import { I18nProvider } from '@lingui/react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider as JotaiProvider } from 'jotai';
import { GraphQLError } from 'graphql';
import { type ReactNode } from 'react';
import { SOURCE_LOCALE } from 'twenty-shared/translations';

import { SettingsWorkspaceMemberAddModal } from '@/settings/members/components/SettingsWorkspaceMemberAddModal';
import { isDialogOpenedComponentState } from '@/ui/layout/dialog/states/isDialogOpenedComponentState';
import {
  jotaiStore,
  resetJotaiStore,
} from '@/ui/utilities/state/jotai/jotaiStore';
import { PreCreateWorkspaceMemberDocument } from '~/generated-metadata/graphql';
import { dynamicActivate } from '~/utils/i18n/dynamicActivate';

dynamicActivate(SOURCE_LOCALE);

const MODAL_ID = 'add-workspace-member-modal-test';

const EXPECTED_INPUT = {
  firstName: 'Jane',
  lastName: 'Austen',
  email: 'jane@apple.dev',
  memberStatus: 'ACTIVE',
};

const successMock = {
  request: {
    query: PreCreateWorkspaceMemberDocument,
    variables: { input: EXPECTED_INPUT },
  },
  result: {
    data: {
      preCreateWorkspaceMember: {
        __typename: 'WorkspaceMember',
        id: '20202020-0000-4000-8000-000000000003',
        name: { __typename: 'FullName', firstName: 'Jane', lastName: 'Austen' },
        userEmail: 'jane@apple.dev',
        memberStatus: 'ACTIVE',
        isPreCreated: true,
      },
    },
  },
};

const errorMock = {
  request: {
    query: PreCreateWorkspaceMemberDocument,
    variables: { input: EXPECTED_INPUT },
  },
  result: {
    errors: [new GraphQLError('A member with this email already exists')],
  },
};

const renderModal = (
  mocks: (typeof successMock | typeof errorMock)[],
  onMemberAdded = jest.fn(),
) => {
  jotaiStore.set(
    isDialogOpenedComponentState.atomFamily({ instanceId: MODAL_ID }),
    true,
  );

  const Wrapper = ({ children }: { children: ReactNode }) => (
    <MockedProvider mocks={mocks}>
      <JotaiProvider store={jotaiStore}>
        <I18nProvider i18n={i18n}>{children}</I18nProvider>
      </JotaiProvider>
    </MockedProvider>
  );

  render(
    <SettingsWorkspaceMemberAddModal
      modalInstanceId={MODAL_ID}
      onMemberAdded={onMemberAdded}
    />,
    { wrapper: Wrapper },
  );

  return { onMemberAdded, user: userEvent.setup() };
};

const fillForm = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.type(screen.getByLabelText('First name'), 'Jane');
  await user.type(screen.getByLabelText('Last name'), 'Austen');
  await user.type(screen.getByLabelText('Email'), 'jane@apple.dev');
};

describe('SettingsWorkspaceMemberAddModal', () => {
  beforeEach(() => {
    resetJotaiStore();
  });

  it('explains that no invitation is sent', () => {
    renderModal([successMock]);

    expect(
      screen.getByText(
        'They join this member when they first sign in with this email. No invitation is sent.',
      ),
    ).toBeInTheDocument();
  });

  it('pre-creates an active member with the entered details', async () => {
    const { user, onMemberAdded } = renderModal([successMock]);

    expect(screen.getByRole('button', { name: 'Add member' })).toBeDisabled();

    await fillForm(user);
    await user.click(screen.getByRole('button', { name: 'Add member' }));

    await waitFor(() => expect(onMemberAdded).toHaveBeenCalledTimes(1));
  });

  it('shows the server error and keeps the modal open', async () => {
    const { user, onMemberAdded } = renderModal([errorMock]);

    await fillForm(user);
    await user.click(screen.getByRole('button', { name: 'Add member' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'A member with this email already exists',
    );
    expect(onMemberAdded).not.toHaveBeenCalled();
  });
});
