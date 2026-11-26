import { useLingui } from '@lingui/react/macro';
import { type ReactNode } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

type ItemErrorBoundaryProps = {
  // Names the kind of item in the console so a failing card can be traced
  itemKind: string;
  // Inside a table body the fallback must be a row spanning these columns
  colSpan?: number;
  children: ReactNode;
};

const ItemErrorMessage = () => {
  const { t } = useLingui();

  return (
    <div className="rb-item-error" role="note">
      {t`Couldn't display this item`}
    </div>
  );
};

// One failing card, widget or row shows a short line in its place; the rest of the page keeps working
export const ItemErrorBoundary = ({
  itemKind,
  colSpan,
  children,
}: ItemErrorBoundaryProps) => (
  <ErrorBoundary
    fallbackRender={() =>
      colSpan === undefined ? (
        <ItemErrorMessage />
      ) : (
        <tr>
          <td colSpan={colSpan}>
            <ItemErrorMessage />
          </td>
        </tr>
      )
    }
    onError={(error) => {
      // oxlint-disable-next-line no-console
      console.error(`Couldn't display ${itemKind}`, error);
      import('@sentry/react')
        .then(({ captureException }) =>
          captureException(error, (scope) =>
            scope.setTag('component', itemKind),
          ),
        )
        .catch(() => {});
    }}
  >
    {children}
  </ErrorBoundary>
);
