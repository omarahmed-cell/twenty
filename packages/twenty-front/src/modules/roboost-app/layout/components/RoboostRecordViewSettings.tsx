import { useObjectMetadataItems } from '@/object-metadata/hooks/useObjectMetadataItems';
import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { RoboostLayoutObjectSelect } from '@/roboost-app/layout/components/RoboostLayoutObjectSelect';
import { RoboostRecordViewEditor } from '@/roboost-app/layout/components/RoboostRecordViewEditor';
import { useRoboostRecordLayoutConfig } from '@/roboost-app/layout/hooks/useRoboostRecordLayoutConfig';
import { useRoboostRecordViews } from '@/roboost-app/layout/hooks/useRoboostRecordViews';
import { roboostRecordLayoutsState } from '@/roboost-app/layout/states/roboostRecordLayoutsState';
import { resolveRoboostRecordLayout } from '@/roboost-app/layout/utils/resolveRoboostRecordLayout';
import { getRoboostRecordViewSettingsPath } from '@/roboost-app/layout/utils/getRoboostLayoutSettingsPath';
import { Button } from '@/roboost-ui/components/Button';
import { Icon } from '@/roboost-ui/components/Icon';
import { Input } from '@/roboost-ui/components/Input';
import { Menu } from '@/roboost-ui/components/Menu';
import { Modal } from '@/roboost-ui/components/Modal';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import { isDefined } from 'twenty-shared/utils';

export const ROBOOST_RECORD_VIEW_OBJECTS = [
  'company',
  'person',
  'opportunity',
  'service',
  'product',
  'lineItem',
];

const DEFAULT_VIEW_ID = 'default';

type RoboostNamingState = { sourceViewId: string; name: string } | null;

const RoboostRecordViewTable = ({
  objectMetadataItem,
  objectMetadataItems,
}: {
  objectMetadataItem: EnrichedObjectMetadataItem;
  objectMetadataItems: EnrichedObjectMetadataItem[];
}) => {
  const { t } = useLingui();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [naming, setNaming] = useState<RoboostNamingState>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const defaultConfig = useRoboostRecordLayoutConfig(
    objectMetadataItem,
    objectMetadataItems,
  );
  const roboostRecordLayouts = useAtomStateValue(roboostRecordLayoutsState);
  const { views, createView } = useRoboostRecordViews(objectMetadataItem);

  const rows = [
    { id: DEFAULT_VIEW_ID, name: t`Default view` },
    ...views,
  ].filter((row) =>
    row.name.toLowerCase().includes(search.trim().toLowerCase()),
  );
  const editPath = (viewId: string) =>
    `${getRoboostRecordViewSettingsPath(objectMetadataItem.nameSingular)}?view=${viewId}`;

  const editingViewId = searchParams.get('view');
  const editingView = views.find((view) => view.id === editingViewId);

  const layoutOf = (viewId: string) => {
    if (viewId === DEFAULT_VIEW_ID) {
      return defaultConfig.layout;
    }
    const stored = roboostRecordLayouts?.find((record) => record.id === viewId);

    return resolveRoboostRecordLayout({
      stored: stored?.layout,
      fallback: defaultConfig.defaultLayout,
      objectMetadataItem,
      associations: defaultConfig.associations,
      overviewTitles: {
        openTasks: t`Open tasks`,
        pinnedActivities: t`Pinned activities`,
        latestActivity: t`Latest activity`,
      },
    });
  };

  const submitName = async () => {
    if (naming === null) {
      return;
    }
    setIsCreating(true);
    setError(null);
    try {
      const viewId = await createView({
        name: naming.name.trim(),
        layout: layoutOf(naming.sourceViewId),
      });

      setNaming(null);
      if (isDefined(viewId)) {
        navigate(editPath(viewId));
      }
    } catch {
      setError(t`Only workspace admins can create views.`);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <>
      <section className="rb-forms-card rb-rv-views">
        <div className="rb-rv-views-bar">
          <Input
            variant="search"
            size="sm"
            className="rb-rv-views-search"
            placeholder={t`Search by view name`}
            aria-label={t`Search by view name`}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <Button
            variant="secondary"
            size="sm"
            icon="plus"
            onClick={() =>
              setNaming({ sourceViewId: DEFAULT_VIEW_ID, name: '' })
            }
          >
            {t`Create view`}
          </Button>
        </div>
        <table className="rb-rv-views-table">
          <thead>
            <tr>
              <th>{t`View name`}</th>
              <th className="rb-rv-views-actions">{t`Actions`}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>
                  <Link className="rb-link" to={editPath(row.id)}>
                    {row.name}
                  </Link>
                </td>
                <td className="rb-rv-views-actions">
                  <Menu
                    align="right"
                    isSearchable={false}
                    entries={[
                      {
                        id: 'clone',
                        label: t`Clone this view`,
                        icon: 'copy',
                        onSelect: () =>
                          setNaming({
                            sourceViewId: row.id,
                            name: t`${row.name} (copy)`,
                          }),
                      },
                    ]}
                    trigger={({ toggle, isOpen }) => (
                      <button
                        type="button"
                        className="rb-rv-views-more"
                        aria-label={t`Actions for ${row.name}`}
                        aria-expanded={isOpen}
                        onClick={toggle}
                      >
                        <Icon name="more" size={16} />
                      </button>
                    )}
                  />
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={2} className="rb-rv-views-empty">
                  {t`No views match this search.`}
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <p className="rb-rv-views-note">
          {t`The Default view is used for everyone. Assigning views to teams comes with Teams & Roles.`}
        </p>
      </section>
      {naming !== null && (
        <Modal
          title={
            naming.sourceViewId === DEFAULT_VIEW_ID && naming.name === ''
              ? t`Create view`
              : t`Clone view`
          }
          subtitle={t`It starts as a copy of the view it comes from.`}
          onClose={() => setNaming(null)}
          footer={
            <>
              <Button variant="secondary" onClick={() => setNaming(null)}>
                {t`Cancel`}
              </Button>
              <Button
                variant="primary"
                disabled={naming.name.trim() === '' || isCreating}
                onClick={submitName}
              >
                {isCreating ? t`Creating…` : t`Create`}
              </Button>
            </>
          }
        >
          <label className="rb-reqpop-field">
            <span className="rb-reqpop-label">{t`View name`}</span>
            <Input
              value={naming.name}
              aria-label={t`View name`}
              onChange={(event) =>
                setNaming({ ...naming, name: event.target.value })
              }
              onKeyDown={(event) => {
                if (event.key === 'Enter' && naming.name.trim() !== '') {
                  submitName();
                }
              }}
            />
          </label>
          {error !== null && <div className="rb-field-error">{error}</div>}
        </Modal>
      )}
      {editingViewId === DEFAULT_VIEW_ID && (
        <RoboostRecordViewEditor
          key={`${objectMetadataItem.id}-default`}
          objectMetadataItem={objectMetadataItem}
          objectMetadataItems={objectMetadataItems}
        />
      )}
      {isDefined(editingView) && (
        <RoboostRecordViewEditor
          key={editingView.id}
          objectMetadataItem={objectMetadataItem}
          objectMetadataItems={objectMetadataItems}
          viewRecordId={editingView.id}
          viewName={editingView.name}
        />
      )}
    </>
  );
};

// Settings → Layout → Record view: pick an object, then its views; each opens the full-screen editor
export const RoboostRecordViewSettings = () => {
  const navigate = useNavigate();
  const { objectNameSingular } = useParams<{ objectNameSingular?: string }>();
  const { objectMetadataItems } = useObjectMetadataItems();

  const objects = ROBOOST_RECORD_VIEW_OBJECTS.map((nameSingular) =>
    objectMetadataItems.find(
      (item) => item.nameSingular === nameSingular && item.isActive,
    ),
  ).filter(isDefined);
  const selected =
    objects.find((item) => item.nameSingular === objectNameSingular) ??
    objects[0];

  if (!isDefined(selected)) {
    return null;
  }

  return (
    <>
      <RoboostLayoutObjectSelect
        objects={objects}
        value={selected.nameSingular}
        onChange={(nameSingular) =>
          navigate(getRoboostRecordViewSettingsPath(nameSingular))
        }
      />
      <RoboostRecordViewTable
        key={selected.id}
        objectMetadataItem={selected}
        objectMetadataItems={objectMetadataItems}
      />
    </>
  );
};
