import { useObjectMetadataItems } from '@/object-metadata/hooks/useObjectMetadataItems';
import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { useFindOneRecord } from '@/object-record/hooks/useFindOneRecord';
import {
  type RoboostActivitySubTab,
  RoboostActivityColumn,
  type RoboostRecordMainTab,
} from '@/roboost-app/components/RoboostActivityColumn';
import { RoboostRecordQuickActions } from '@/roboost-app/components/RoboostRecordQuickActions';
import { RoboostTopBarTitleEffect } from '@/roboost-app/components/RoboostTopBarTitleEffect';
import {
  getRoboostLabelIdentifierFieldName,
  getRoboostRecordLabel,
} from '@/roboost-app/fields/getRoboostRecordLabel';
import { useRoboostActivityFeed } from '@/roboost-app/hooks/useRoboostActivityFeed';
import { useRoboostPropertySections } from '@/roboost-app/hooks/useRoboostPropertySections';
import { getRoboostListRecordGqlFields } from '@/roboost-app/list/utils/getRoboostListRecordGqlFields';
import { RoboostAssociationContainer } from '@/roboost-app/record/components/RoboostAssociationContainer';
import { RoboostAttachmentsContainer } from '@/roboost-app/record/components/RoboostAttachmentsContainer';
import { RoboostRecordActionsMenu } from '@/roboost-app/record/components/RoboostRecordActionsMenu';
import { RoboostRecordPager } from '@/roboost-app/record/components/RoboostRecordPager';
import { RoboostRecentRecordEffect } from '@/roboost-app/search/components/RoboostRecentRecordEffect';
import { RoboostPropertyGroupContainer } from '@/roboost-app/record/components/RoboostPropertyGroupContainer';
import {
  type RoboostRecordPanelSide,
  useRoboostRecordLayout,
} from '@/roboost-app/record/hooks/useRoboostRecordLayout';
import { getRoboostAssociations } from '@/roboost-app/record/utils/getRoboostAssociations';
import { roboostRecordLeftPanelCollapsedState } from '@/roboost-app/states/roboostRecordLeftPanelCollapsedState';
import { roboostRecordRightPanelCollapsedState } from '@/roboost-app/states/roboostRecordRightPanelCollapsedState';
import { formatRoboostFieldValue } from '@/roboost-app/utils/formatRoboostFieldValue';
import { getRoboostAvatarTone } from '@/roboost-app/utils/getRoboostAvatarTone';
import { getRoboostDomainLabel } from '@/roboost-app/utils/getRoboostDomainLabel';
import {
  getRoboostPersonName,
  type RoboostFullName,
} from '@/roboost-app/utils/getRoboostPersonName';
import { Avatar } from '@/roboost-ui/components/Avatar';
import { Icon } from '@/roboost-ui/components/Icon';
import { type MenuEntry } from '@/roboost-ui/components/Menu';
import { RecordLayout } from '@/roboost-ui/components/RecordLayout';
import { isSidePanelOpenedState } from '@/side-panel/states/isSidePanelOpenedState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { getSettingsPropertiesPath } from '@/settings/data-model/properties/utils/getSettingsPropertiesPath';
import { useAtomState } from '@/ui/utilities/state/jotai/hooks/useAtomState';
import { useLingui } from '@lingui/react/macro';
import { isNonEmptyString } from '@sniptt/guards';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AppPath, CoreObjectNameSingular } from 'twenty-shared/types';
import { getAppPath, isDefined } from 'twenty-shared/utils';
import { FieldMetadataType, RelationType } from '~/generated-metadata/graphql';

const OWNER_FIELD_NAMES = ['accountOwner', 'owner', 'assignee', 'sdrOwner'];
const NARROW_VIEWPORT_WIDTH = 1340;

type MemberRecord = { id: string; name?: RoboostFullName; __typename: string };
type LoadedRecord = Record<string, unknown> & { id: string };

const getKeyLine = (
  objectMetadataItem: EnrichedObjectMetadataItem,
  record: LoadedRecord,
): { label: string; href?: string } | null => {
  const findField = (name: string) =>
    objectMetadataItem.fields.find(
      (field) => field.name === name && field.isActive,
    );
  const domainField = findField('domainName');
  const domainUrl = (record.domainName as { primaryLinkUrl?: string } | null)
    ?.primaryLinkUrl;

  if (isDefined(domainField) && isNonEmptyString(domainUrl)) {
    return {
      label: getRoboostDomainLabel(domainUrl) ?? domainUrl,
      href: domainUrl.startsWith('http') ? domainUrl : `https://${domainUrl}`,
    };
  }
  const email = (record.emails as { primaryEmail?: string } | null)
    ?.primaryEmail;

  if (isNonEmptyString(email)) {
    return { label: email, href: `mailto:${email}` };
  }
  for (const name of ['jobTitle', 'amount', 'stage', 'status']) {
    const field = findField(name);
    const value = isDefined(field)
      ? formatRoboostFieldValue(field, record[name])
      : '';

    if (isNonEmptyString(value) && value !== '—') {
      return { label: value };
    }
  }

  return null;
};

type RoboostRecordPageProps = {
  objectNameSingular: string;
  recordId: string;
};

export const RoboostRecordPage = ({
  objectNameSingular,
  recordId,
}: RoboostRecordPageProps) => {
  const { objectMetadataItems } = useObjectMetadataItems();
  const objectMetadataItem = objectMetadataItems.find(
    (item) => item.nameSingular === objectNameSingular,
  );

  if (!isDefined(objectMetadataItem)) {
    return null;
  }

  return (
    <RoboostRecordPageContent
      objectMetadataItem={objectMetadataItem}
      objectMetadataItems={objectMetadataItems}
      recordId={recordId}
    />
  );
};

const RoboostRecordPageContent = ({
  objectMetadataItem,
  objectMetadataItems,
  recordId,
}: {
  objectMetadataItem: EnrichedObjectMetadataItem;
  objectMetadataItems: EnrichedObjectMetadataItem[];
  recordId: string;
}) => {
  const { t } = useLingui();
  const objectNameSingular = objectMetadataItem.nameSingular;
  const [mainTab, setMainTab] = useState<RoboostRecordMainTab>('activities');
  const [subTab, setSubTab] = useState<RoboostActivitySubTab>('all');
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [roboostRecordLeftPanelCollapsed, setRoboostRecordLeftPanelCollapsed] =
    useAtomState(roboostRecordLeftPanelCollapsedState);
  const [
    roboostRecordRightPanelCollapsed,
    setRoboostRecordRightPanelCollapsed,
  ] = useAtomState(roboostRecordRightPanelCollapsedState);
  const [isRightOpenedOnNarrow, setIsRightOpenedOnNarrow] = useState(false);
  const isSidePanelOpened = useAtomStateValue(isSidePanelOpenedState);
  const layout = useRoboostRecordLayout(objectNameSingular);

  const sections = useRoboostPropertySections(objectMetadataItem);
  const associations = getRoboostAssociations(
    objectMetadataItem,
    objectMetadataItems,
    t`Attachments`,
  );

  const activeFields = objectMetadataItem.fields.filter(
    (field) => field.isActive,
  );
  const ownerField = OWNER_FIELD_NAMES.map((name) =>
    activeFields.find(
      (field) =>
        field.name === name &&
        field.relation?.type === RelationType.MANY_TO_ONE,
    ),
  ).find(isDefined);
  const labelFieldName = getRoboostLabelIdentifierFieldName(objectMetadataItem);
  const headerFields = [
    labelFieldName,
    'domainName',
    'emails',
    'jobTitle',
    'amount',
    'stage',
    'status',
    'avatarUrl',
  ]
    .map((name) => activeFields.find((field) => field.name === name))
    .filter(isDefined);
  const manyToOneFields = associations.flatMap((association) =>
    association.kind === 'one' ? [association.field] : [],
  );
  const loadedFields: FieldMetadataItem[] = [
    ...headerFields,
    ...(isDefined(ownerField) ? [ownerField] : []),
    ...manyToOneFields,
    ...sections.flatMap((section) => section.fields),
  ];

  const { record, loading, refetch } = useFindOneRecord({
    objectNameSingular,
    objectRecordId: recordId,
    recordGqlFields: getRoboostListRecordGqlFields(
      objectMetadataItem,
      loadedFields,
      objectMetadataItems,
    ),
  });

  const { items: feedItems, loading: feedLoading } = useRoboostActivityFeed({
    targetRecordId: recordId,
    targetObjectNameSingular: objectNameSingular,
  });

  const { records: members } = useFindManyRecords<MemberRecord>({
    objectNameSingular: CoreObjectNameSingular.WorkspaceMember,
    recordGqlFields: { id: true, name: true },
    limit: 200,
  });

  if (!isDefined(record)) {
    return (
      <div className="rb-recpage-message">
        {loading
          ? t`Loading…`
          : t`This ${objectMetadataItem.labelSingular.toLowerCase()} could not be found.`}
      </div>
    );
  }

  const loadedRecord = record as LoadedRecord;
  const listPath = getAppPath(AppPath.RecordIndexPage, {
    objectNamePlural: objectMetadataItem.namePlural,
  });
  const classicPagePath = `${getAppPath(AppPath.RecordShowPage, {
    objectNameSingular,
    objectRecordId: recordId,
  })}?view=classic`;
  const propertiesSettingsPath = getSettingsPropertiesPath({
    objectNamePlural: objectMetadataItem.namePlural,
  });

  const recordName =
    getRoboostRecordLabel(loadedRecord, objectMetadataItem) ||
    t`Untitled ${objectMetadataItem.labelSingular.toLowerCase()}`;
  const keyLine = getKeyLine(objectMetadataItem, loadedRecord);
  const ownerValue = isDefined(ownerField)
    ? (loadedRecord[ownerField.name] as { name?: RoboostFullName } | null)
    : null;
  const ownerName = getRoboostPersonName(ownerValue?.name);
  const avatarUrl = loadedRecord.avatarUrl;
  const isPersonLike = activeFields.some(
    (field) =>
      field.name === labelFieldName &&
      field.type === FieldMetadataType.FULL_NAME,
  );

  const isNarrow =
    typeof window !== 'undefined' && window.innerWidth < NARROW_VIEWPORT_WIDTH;
  const isRightCollapsed =
    roboostRecordRightPanelCollapsed ||
    ((isNarrow || isSidePanelOpened) && !isRightOpenedOnNarrow);

  const containerSettings = (
    side: RoboostRecordPanelSide,
    extra: MenuEntry[],
  ): MenuEntry[] => [
    ...extra,
    { id: 'sep', isSeparator: true },
    {
      id: 'reset',
      label: t`Reset order to default`,
      icon: 'refresh',
      isDisabled: !layout.hasPersonalOrder,
      onSelect: () => layout.resetToDefault(),
    },
    {
      id: 'save-default',
      label: t`Make this order the default for everyone`,
      icon: 'pin',
      hint: t`Admins only`,
      onSelect: () => {
        layout.saveAsDefault().catch(() => {});
      },
    },
  ];

  const dragHandlers = (side: RoboostRecordPanelSide, ids: string[]) => ({
    onDragStart: (id: string) => setDraggedId(`${side}:${id}`),
    onDragOver: (id: string) => {
      if (draggedId?.startsWith(`${side}:`) === true) {
        setDropTargetId(`${side}:${id}`);
      }
    },
    onDrop: (id: string) => {
      if (draggedId?.startsWith(`${side}:`) === true) {
        layout.move(side, ids, draggedId.slice(side.length + 1), id);
      }
      setDraggedId(null);
      setDropTargetId(null);
    },
    onDragEnd: () => {
      setDraggedId(null);
      setDropTargetId(null);
    },
  });

  const leftIds = layout.orderIds(
    'left',
    sections.map((section) => section.id),
  );
  const leftHandlers = dragHandlers('left', leftIds);
  const rightIds = layout.orderIds(
    'right',
    associations.map((association) => association.id),
  );
  const rightHandlers = dragHandlers('right', rightIds);

  // Modules not built yet stay visible and do nothing
  const quickActionMoreEntries: MenuEntry[] = [
    {
      id: 'whatsapp',
      label: t`WhatsApp`,
      icon: 'whatsapp',
      onSelect: () => {},
    },
    {
      id: 'linkedin',
      label: t`LinkedIn`,
      icon: 'linkedin',
      onSelect: () => {},
    },
    { id: 'sms', label: t`SMS`, icon: 'sms', onSelect: () => {} },
  ];

  const left = (
    <>
      <section className="rb-rc rb-tb" aria-label={t`Record summary`}>
        <div className="rb-tb-top">
          <Link className="rb-backlink" to={listPath}>
            <Icon name="chevron-left" size={14} />
            {objectMetadataItem.labelPlural}
          </Link>
          <span className="rb-sp" />
          <RoboostRecordPager
            objectNameSingular={objectNameSingular}
            recordId={recordId}
          />
          <RoboostRecordActionsMenu
            objectMetadataItem={objectMetadataItem}
            objectMetadataItems={objectMetadataItems}
            record={loadedRecord}
            recordName={recordName}
            classicPagePath={classicPagePath}
            onSaved={() => refetch()}
          />
          <button
            type="button"
            className="rb-rc-iconbtn"
            aria-label={t`Collapse left panel`}
            title={t`Collapse panel`}
            onClick={() => setRoboostRecordLeftPanelCollapsed(true)}
          >
            <Icon name="chevron-left" size={14} />
          </button>
        </div>
        <div className="rb-tb-id">
          <Avatar
            name={recordName}
            size="lg"
            src={isNonEmptyString(avatarUrl) ? avatarUrl : undefined}
            tone={getRoboostAvatarTone(recordName)}
          />
          <div className="rb-tb-idm">
            <div className="rb-tb-name" title={recordName}>
              {recordName}
            </div>
            {isDefined(keyLine) &&
              (isDefined(keyLine.href) ? (
                <a
                  className="rb-tb-key"
                  href={keyLine.href}
                  target={isPersonLike ? undefined : '_blank'}
                  rel="noreferrer"
                >
                  {keyLine.label}
                </a>
              ) : (
                <span className="rb-tb-key is-plain">{keyLine.label}</span>
              ))}
            {isDefined(ownerField) && (
              <div className="rb-tb-owner">
                <span className="rb-tb-owner-label">{ownerField.label} · </span>
                {isNonEmptyString(ownerName) ? ownerName : t`No owner`}
              </div>
            )}
          </div>
        </div>
        <RoboostRecordQuickActions
          targetRecord={{
            id: recordId,
            targetObjectNameSingular: objectNameSingular,
          }}
          onOpenMeetings={() => {
            setMainTab('activities');
            setSubTab('meetings');
          }}
          moreEntries={quickActionMoreEntries}
        />
      </section>
      {leftIds.map((sectionId, index) => {
        const section = sections.find(
          (candidate) => candidate.id === sectionId,
        );

        if (!isDefined(section)) {
          return null;
        }

        return (
          <RoboostPropertyGroupContainer
            key={section.id}
            id={section.id}
            title={section.title}
            fields={section.fields}
            record={loadedRecord}
            objectMetadataItem={objectMetadataItem}
            objectMetadataItems={objectMetadataItems}
            defaultOpen={index < 2}
            propertiesSettingsPath={propertiesSettingsPath}
            settingsEntries={containerSettings('left', [
              {
                id: 'properties',
                label: t`Property groups settings`,
                icon: 'external-link',
                href: propertiesSettingsPath,
              },
            ])}
            isDropTarget={dropTargetId === `left:${section.id}`}
            onSaved={() => refetch()}
            onDragStart={leftHandlers.onDragStart}
            onDragOver={leftHandlers.onDragOver}
            onDrop={leftHandlers.onDrop}
            onDragEnd={leftHandlers.onDragEnd}
          />
        );
      })}
    </>
  );

  const right = (
    <>
      <div className="rb-rp-head">
        <button
          type="button"
          className="rb-rc-iconbtn"
          aria-label={t`Collapse right panel`}
          title={t`Collapse panel`}
          onClick={() => {
            setIsRightOpenedOnNarrow(false);
            setRoboostRecordRightPanelCollapsed(true);
          }}
        >
          <Icon name="chevron-right" size={14} />
        </button>
      </div>
      {rightIds.map((associationId) => {
        const association = associations.find(
          (candidate) => candidate.id === associationId,
        );

        if (!isDefined(association)) {
          return null;
        }
        const isDropTarget = dropTargetId === `right:${association.id}`;

        if (association.kind === 'attachments') {
          return (
            <RoboostAttachmentsContainer
              key={association.id}
              title={association.title}
              joinColumnName={association.joinColumnName}
              recordId={recordId}
              objectNameSingular={objectNameSingular}
              settingsEntries={containerSettings('right', [])}
              isDropTarget={isDropTarget}
              onDragStart={rightHandlers.onDragStart}
              onDragOver={rightHandlers.onDragOver}
              onDrop={rightHandlers.onDrop}
              onDragEnd={rightHandlers.onDragEnd}
            />
          );
        }
        const related =
          association.kind === 'one'
            ? (loadedRecord[association.field.name] as { id?: string } | null)
            : null;

        return (
          <RoboostAssociationContainer
            key={association.id}
            association={association}
            recordId={recordId}
            sourceObjectNameSingular={objectNameSingular}
            relatedRecordId={related?.id ?? null}
            objectMetadataItems={objectMetadataItems}
            settingsEntries={containerSettings('right', [
              {
                id: 'object-settings',
                label: t`${association.targetObjectMetadataItem.labelSingular} settings`,
                icon: 'external-link',
                href: `/settings/objects/${association.targetObjectMetadataItem.namePlural}`,
              },
            ])}
            isDropTarget={isDropTarget}
            onSourceRecordChanged={() => refetch()}
            onDragStart={rightHandlers.onDragStart}
            onDragOver={rightHandlers.onDragOver}
            onDrop={rightHandlers.onDrop}
            onDragEnd={rightHandlers.onDragEnd}
          />
        );
      })}
    </>
  );

  return (
    <div className="rb-recpage">
      <RoboostTopBarTitleEffect title={recordName} />
      <RoboostRecentRecordEffect
        objectNameSingular={objectNameSingular}
        recordId={recordId}
        label={recordName}
      />
      <RecordLayout
        isBare
        leftCollapsed={roboostRecordLeftPanelCollapsed}
        rightCollapsed={isRightCollapsed}
        onLeftToggle={setRoboostRecordLeftPanelCollapsed}
        onRightToggle={(collapsed) => {
          setIsRightOpenedOnNarrow(!collapsed);
          setRoboostRecordRightPanelCollapsed(collapsed);
        }}
        left={left}
        middle={
          <RoboostActivityColumn
            items={feedItems}
            loading={feedLoading}
            mainTab={mainTab}
            onMainTabChange={setMainTab}
            subTab={subTab}
            onSubTabChange={(tab) => {
              setMainTab('activities');
              setSubTab(tab);
            }}
            customizePath={propertiesSettingsPath}
            members={members.map((member) => ({
              id: member.id,
              name: getRoboostPersonName(member.name),
            }))}
          />
        }
        right={right}
      />
    </div>
  );
};
