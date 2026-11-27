import { SEARCH_QUERY } from '@/command-menu/graphql/queries/search';
import { useApolloCoreClient } from '@/object-metadata/hooks/useApolloCoreClient';
import { useObjectMetadataItems } from '@/object-metadata/hooks/useObjectMetadataItems';
import { filterReadableActiveObjectMetadataItems } from '@/object-metadata/utils/filterReadableActiveObjectMetadataItems';
import { useObjectPermissions } from '@/object-record/hooks/useObjectPermissions';
import { roboostRecentRecordsState } from '@/roboost-app/search/states/roboostRecentRecordsState';
import { Icon } from '@/roboost-ui/components/Icon';
import { type RoboostIconName } from '@/roboost-ui/types/RoboostIconName';
import { cx } from '@/roboost-ui/utils/cx';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { useLingui } from '@lingui/react/macro';
import { isNonEmptyString } from '@sniptt/guards';
import { useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AppPath } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';
import { useDebouncedCallback } from 'use-debounce';
import {
  type SearchQuery,
  type SearchQueryVariables,
} from '~/generated/graphql';
import { useNavigateApp } from '~/hooks/useNavigateApp';

const SEARCH_LIMIT = 20;

const SEARCH_CHIP_OBJECTS = [
  'company',
  'person',
  'opportunity',
  'service',
  'note',
  'task',
];

const ICON_BY_OBJECT: Record<string, RoboostIconName> = {
  company: 'building',
  person: 'contacts',
  opportunity: 'deals',
  service: 'services',
  note: 'note',
  task: 'tasks',
  call: 'phone',
  email: 'mail',
  calendarEvent: 'calendar',
  meeting: 'calendar',
};

type RoboostSearchResult = {
  recordId: string;
  objectNameSingular: string;
  objectLabel: string;
  label: string;
};

type RoboostSearchPopupProps = {
  anchor: HTMLElement | null;
  onClose: () => void;
};

// Opens exactly over the top bar search box, its own input where the box was, so one click is enough to type
export const RoboostSearchPopup = ({
  anchor,
  onClose,
}: RoboostSearchPopupProps) => {
  const { t } = useLingui();
  const navigateApp = useNavigateApp();
  const apolloCoreClient = useApolloCoreClient();
  const { objectMetadataItems } = useObjectMetadataItems();
  const roboostRecentRecords = useAtomStateValue(roboostRecentRecordsState);
  const [query, setQuery] = useState('');
  const [selectedObjects, setSelectedObjects] = useState<string[]>([]);
  const [results, setResults] = useState<RoboostSearchResult[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(
    () => anchor?.getBoundingClientRect() ?? null,
  );
  const inputRef = useRef<HTMLInputElement>(null);

  useLayoutEffect(() => {
    const measure = () =>
      setAnchorRect(anchor?.getBoundingClientRect() ?? null);

    measure();
    inputRef.current?.focus();
    window.addEventListener('resize', measure);

    return () => window.removeEventListener('resize', measure);
  }, [anchor]);

  const { objectPermissionsByObjectMetadataId } = useObjectPermissions();
  const searchableObjects = filterReadableActiveObjectMetadataItems(
    objectMetadataItems,
    objectPermissionsByObjectMetadataId,
  ).filter((item) => !item.isSystem && item.isSearchable);
  const findObject = (nameSingular: string) =>
    objectMetadataItems.find((item) => item.nameSingular === nameSingular);
  const chipObjects = SEARCH_CHIP_OBJECTS.map((nameSingular) =>
    searchableObjects.find((item) => item.nameSingular === nameSingular),
  ).filter((item) => item !== undefined);

  const runSearch = useDebouncedCallback(
    async (searchInput: string, objectNames: string[]) => {
      if (!isNonEmptyString(searchInput.trim())) {
        setResults(null);
        setIsSearching(false);
        return;
      }
      const { data, error } = await apolloCoreClient.query<
        SearchQuery,
        SearchQueryVariables
      >({
        query: SEARCH_QUERY,
        variables: {
          searchInput: searchInput.trim(),
          limit: SEARCH_LIMIT,
          includedObjectNameSingulars:
            objectNames.length > 0
              ? objectNames
              : searchableObjects.map((item) => item.nameSingular),
        },
        fetchPolicy: 'network-only',
        errorPolicy: 'all',
      });

      if (isDefined(error) && !isDefined(data)) {
        setResults([]);
        setIsSearching(false);
        return;
      }

      setResults(
        (data?.search.edges ?? []).map(({ node }) => ({
          recordId: node.recordId,
          objectNameSingular: node.objectNameSingular,
          objectLabel: node.objectLabelSingular,
          label: node.label,
        })),
      );
      setActiveIndex(0);
      setIsSearching(false);
    },
    200,
  );

  const updateSearch = (searchInput: string, objectNames: string[]) => {
    setIsSearching(isNonEmptyString(searchInput.trim()));
    runSearch(searchInput, objectNames);
  };

  const recents: RoboostSearchResult[] = roboostRecentRecords
    .filter(
      (recent) =>
        selectedObjects.length === 0 ||
        selectedObjects.includes(recent.objectNameSingular),
    )
    .map((recent) => ({
      recordId: recent.recordId,
      objectNameSingular: recent.objectNameSingular,
      objectLabel:
        findObject(recent.objectNameSingular)?.labelSingular ??
        recent.objectNameSingular,
      label: recent.label,
    }));

  const shownItems = results ?? recents;

  const openResult = (result: RoboostSearchResult | undefined) => {
    if (result === undefined) {
      return;
    }
    onClose();
    navigateApp(AppPath.RecordShowPage, {
      objectNameSingular: result.objectNameSingular,
      objectRecordId: result.recordId,
    });
  };

  return (
    <>
      {createPortal(
        <div className="rb-ui">
          <div className="rb-search-scrim" onClick={onClose} />
        </div>,
        document.body,
      )}
      {createPortal(
        <div
          className="rb-ui rb-popover-panel rb-searchbox"
          style={
            isDefined(anchorRect)
              ? {
                  left: anchorRect.left,
                  top: anchorRect.top,
                  width: anchorRect.width,
                }
              : { visibility: 'hidden' }
          }
          role="dialog"
          aria-label={t`Search Roboost CRM`}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.preventDefault();
              onClose();
            } else if (event.key === 'ArrowDown') {
              event.preventDefault();
              setActiveIndex(Math.min(activeIndex + 1, shownItems.length - 1));
            } else if (event.key === 'ArrowUp') {
              event.preventDefault();
              setActiveIndex(Math.max(activeIndex - 1, 0));
            } else if (event.key === 'Enter') {
              event.preventDefault();
              openResult(shownItems[activeIndex]);
            }
          }}
        >
          <div className="rb-sb-top">
            <span className="rb-input-wrap has-icon rb-input-search">
              <Icon name="search" size={16} />
              <input
                className="rb-input"
                ref={inputRef}
                value={query}
                placeholder={t`Search Roboost CRM`}
                aria-label={t`Search Roboost CRM`}
                onChange={(event) => {
                  setQuery(event.target.value);
                  updateSearch(event.target.value, selectedObjects);
                }}
              />
            </span>
          </div>
          <div className="rb-sb-chips">
            {chipObjects.map((item) => {
              const isOn = selectedObjects.includes(item.nameSingular);

              return (
                <button
                  key={item.nameSingular}
                  type="button"
                  className={cx('rb-sbchip', isOn && 'is-on')}
                  aria-pressed={isOn}
                  onClick={() => {
                    const nextObjects = isOn
                      ? selectedObjects.filter(
                          (name) => name !== item.nameSingular,
                        )
                      : [...selectedObjects, item.nameSingular];

                    setSelectedObjects(nextObjects);
                    updateSearch(query, nextObjects);
                  }}
                >
                  <Icon
                    name={ICON_BY_OBJECT[item.nameSingular] ?? 'search'}
                    size={13}
                  />
                  {item.labelPlural}
                </button>
              );
            })}
          </div>
          {results === null && (
            <div className="rb-sb-reclabel">{t`Recent`}</div>
          )}
          <div className="rb-sb-recent">
            {shownItems.map((item, index) => (
              <button
                key={`${item.objectNameSingular}-${item.recordId}`}
                type="button"
                className={cx(
                  'rb-sritem',
                  index === activeIndex && 'is-active',
                )}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => openResult(item)}
              >
                <span className="rb-sr-ic">
                  <Icon
                    name={ICON_BY_OBJECT[item.objectNameSingular] ?? 'search'}
                    size={15}
                  />
                </span>
                <span className="rb-sr-main">
                  <span className="rb-sr-name">{item.label}</span>
                  <span className="rb-sr-sub">{item.objectLabel}</span>
                </span>
              </button>
            ))}
            {shownItems.length === 0 && (
              <div className="rb-sb-empty">
                {isSearching
                  ? t`Searching…`
                  : results === null
                    ? t`Records you open will show up here.`
                    : t`No records match "${query}".`}
              </div>
            )}
          </div>
          <div className="rb-sb-foot">
            <span className="rb-kbd">
              <b>↑</b>
              <b>↓</b>
              {t`Select`}
            </span>
            <span className="rb-kbd">
              <b>↵</b>
              {t`Open`}
            </span>
            <span className="rb-kbd">
              <b>esc</b>
              {t`Close`}
            </span>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
};
