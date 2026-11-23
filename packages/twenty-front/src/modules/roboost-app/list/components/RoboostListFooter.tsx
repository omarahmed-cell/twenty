import { Icon } from '@/roboost-ui/components/Icon';
import { Menu } from '@/roboost-ui/components/Menu';
import { cx } from '@/roboost-ui/utils/cx';
import { useLingui } from '@lingui/react/macro';

const VISIBLE_PAGE_COUNT = 11;
export const ROBOOST_PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

type RoboostListFooterProps = {
  countLabel: string;
  page: number;
  pageCount: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onRefresh: () => void;
  onExport: () => void;
  isExporting: boolean;
  isDirty?: boolean;
  isSaving?: boolean;
  onSave?: () => void;
  onClone?: () => void;
};

const getVisiblePages = (page: number, pageCount: number) => {
  const start = Math.max(
    1,
    Math.min(
      page - Math.floor(VISIBLE_PAGE_COUNT / 2),
      pageCount - VISIBLE_PAGE_COUNT + 1,
    ),
  );
  const end = Math.min(pageCount, start + VISIBLE_PAGE_COUNT - 1);

  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
};

export const RoboostListFooter = ({
  countLabel,
  page,
  pageCount,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onRefresh,
  onExport,
  isExporting,
  isDirty = false,
  isSaving = false,
  onSave,
  onClone,
}: RoboostListFooterProps) => {
  const { t } = useLingui();
  const visiblePages = getVisiblePages(page, pageCount);

  return (
    <div className="rb-ls-foot">
      <span className="rb-lf-count">{countLabel}</span>
      <span className="rb-lf-mid">
        <button
          type="button"
          className="rb-pbtn"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <Icon name="chevron-left" size={13} />
          {t`Prev`}
        </button>
        {visiblePages.map((pageNumber) => (
          <button
            key={pageNumber}
            type="button"
            className={cx('rb-ppage', pageNumber === page && 'is-on')}
            aria-current={pageNumber === page ? 'page' : undefined}
            onClick={() => onPageChange(pageNumber)}
          >
            {pageNumber}
          </button>
        ))}
        <button
          type="button"
          className="rb-pbtn"
          disabled={page >= pageCount}
          onClick={() => onPageChange(page + 1)}
        >
          {t`Next`}
          <Icon name="chevron-right" size={13} />
        </button>
        <Menu
          placement="above"
          minWidth={140}
          entries={ROBOOST_PAGE_SIZE_OPTIONS.map((option) => ({
            id: String(option),
            label: t`${option} per page`,
            isSelected: option === pageSize,
            onSelect: () => onPageSizeChange(option),
          }))}
          trigger={({ toggle, isOpen }) => (
            <button
              type="button"
              className="rb-perpage"
              aria-expanded={isOpen}
              onClick={toggle}
            >
              {t`${pageSize} per page`}
              <Icon name="caret" size={13} />
            </button>
          )}
        />
      </span>
      <span className="rb-lf-right">
        <button
          type="button"
          className="rb-icon-btn"
          aria-label={t`Refresh`}
          title={t`Refresh`}
          onClick={onRefresh}
        >
          <Icon name="refresh" size={16} />
        </button>
        <button
          type="button"
          className="rb-hbtn"
          disabled={isExporting}
          onClick={onExport}
        >
          <Icon name="download" size={14} />
          {isExporting ? t`Exporting…` : t`Export`}
        </button>
        {onClone !== undefined && (
          <button
            type="button"
            className="rb-icon-btn"
            aria-label={t`Clone to new view`}
            title={t`Clone to new view`}
            onClick={onClone}
          >
            <Icon name="copy" size={16} />
          </button>
        )}
        {isDirty && onSave !== undefined && (
          <button
            type="button"
            className="rb-hbtn rb-hbtn-accent"
            disabled={isSaving}
            onClick={onSave}
          >
            {isSaving ? t`Saving…` : t`Save`}
          </button>
        )}
      </span>
    </div>
  );
};
