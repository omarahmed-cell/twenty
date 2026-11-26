import { i18n } from '@lingui/core';
import { I18nProvider } from '@lingui/react';
import { render, screen } from '@testing-library/react';

import { ItemErrorBoundary } from '@/roboost-ui/components/ItemErrorBoundary';

const BrokenCard = (): never => {
  throw new Error('Broken card');
};

describe('ItemErrorBoundary', () => {
  beforeAll(() => {
    i18n.load('en', {});
    i18n.activate('en');
  });

  it('shows a short line in place of the failing card and keeps the others', () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <I18nProvider i18n={i18n}>
        <ItemErrorBoundary itemKind="timeline card">
          <div>First card</div>
        </ItemErrorBoundary>
        <ItemErrorBoundary itemKind="timeline card">
          <BrokenCard />
        </ItemErrorBoundary>
        <ItemErrorBoundary itemKind="timeline card">
          <div>Third card</div>
        </ItemErrorBoundary>
      </I18nProvider>,
    );

    expect(screen.getByText('First card')).toBeInTheDocument();
    expect(screen.getByText('Third card')).toBeInTheDocument();
    expect(screen.getByText("Couldn't display this item")).toBeInTheDocument();
  });

  it('keeps a table valid by replacing a failing row with a row', () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <I18nProvider i18n={i18n}>
        <table>
          <tbody>
            <ItemErrorBoundary itemKind="table row" colSpan={3}>
              <BrokenCard />
            </ItemErrorBoundary>
          </tbody>
        </table>
      </I18nProvider>,
    );

    expect(screen.getByRole('note').closest('td')).toHaveAttribute(
      'colspan',
      '3',
    );
  });
});
