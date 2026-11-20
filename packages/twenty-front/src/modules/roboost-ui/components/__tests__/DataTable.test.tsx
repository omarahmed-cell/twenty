import { i18n } from '@lingui/core';
import { I18nProvider } from '@lingui/react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { DataTable } from '@/roboost-ui/components/DataTable';

const COLUMNS = [
  {
    key: 'company',
    label: 'Company name',
    type: 'avatar' as const,
    sortable: true,
  },
  { key: 'status', label: 'Lead status', type: 'tag' as const },
];

const ROWS = [
  {
    id: 'a',
    company: { name: 'Al Romansiah' },
    status: { tone: 'success' as const, dot: true, label: 'Customer' },
  },
  {
    id: 'b',
    company: { name: 'Kantar' },
    status: { tone: 'neutral' as const, label: 'Irrelevant' },
  },
];

const renderTable = (props: Partial<Parameters<typeof DataTable>[0]> = {}) =>
  render(
    <I18nProvider i18n={i18n}>
      <DataTable
        columns={COLUMNS}
        rows={ROWS}
        selectable
        page={props.page}
        onSort={props.onSort}
        onSelectionChange={props.onSelectionChange}
        onRowClick={props.onRowClick}
        onPageChange={props.onPageChange}
      />
    </I18nProvider>,
  );

describe('DataTable', () => {
  it('shows names and status tags', () => {
    renderTable();

    expect(screen.getByText('Al Romansiah')).toBeInTheDocument();
    expect(screen.getByText('Customer')).toBeInTheDocument();
  });

  it('selects every row from the header checkbox', async () => {
    const user = userEvent.setup();
    const onSelectionChange = jest.fn();

    renderTable({ onSelectionChange });

    await user.click(screen.getByLabelText('Select all rows'));

    expect(onSelectionChange).toHaveBeenCalledWith(['a', 'b']);
  });

  it('sorts a sortable column ascending then descending', async () => {
    const user = userEvent.setup();
    const onSort = jest.fn();

    renderTable({ onSort });

    await user.click(screen.getByText('Company name'));
    await user.click(screen.getByText('Company name'));

    expect(onSort).toHaveBeenNthCalledWith(1, 'company', 'asc');
    expect(onSort).toHaveBeenNthCalledWith(2, 'company', 'desc');
  });

  it('pages through results from the footer', async () => {
    const user = userEvent.setup();
    const onPageChange = jest.fn();

    renderTable({
      page: { current: 1, pages: 3, from: 1, to: 2, count: 6 },
      onPageChange,
    });

    expect(screen.getByText('1–2 of 6')).toBeInTheDocument();
    expect(screen.getByLabelText('Previous page')).toBeDisabled();

    await user.click(screen.getByLabelText('Next page'));
    await user.click(
      within(
        screen.getByText('1–2 of 6').parentElement as HTMLElement,
      ).getByText('3'),
    );

    expect(onPageChange).toHaveBeenNthCalledWith(1, 2);
    expect(onPageChange).toHaveBeenNthCalledWith(2, 3);
  });

  it('opens a row without selecting it', async () => {
    const user = userEvent.setup();
    const onRowClick = jest.fn();
    const onSelectionChange = jest.fn();

    renderTable({ onRowClick, onSelectionChange });

    await user.click(screen.getByText('Kantar'));

    expect(onRowClick).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'b' }),
    );
    expect(onSelectionChange).not.toHaveBeenCalled();
  });
});
