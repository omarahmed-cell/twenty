import { ItemErrorBoundary } from '@/roboost-ui/components/ItemErrorBoundary';
import { useRoboostAccess } from '@/roboost-app/users-and-teams/hooks/useRoboostAccess';
import {
  RoboostMergedRecordNotice,
  RoboostMergedRecordRedirect,
} from '@/roboost-app/merge/components/RoboostMergedRecordRedirect';
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
import {
  getRoboostLabelIdentifierFieldName,
  getRoboostRecordLabel,
} from '@/roboost-app/fields/getRoboostRecordLabel';
import { useRoboostActivityFeed } from '@/roboost-app/hooks/useRoboostActivityFeed';
import { useRoboostActivityPins } from '@/roboost-app/timeline/hooks/useRoboostActivityPins';
import { useRoboostTimelineUpdates } from '@/roboost-app/timeline/hooks/useRoboostTimelineUpdates';
import { useRoboostRecordLayoutConfig } from '@/roboost-app/layout/hooks/useRoboostRecordLayoutConfig';
import {
  getRoboostCardLogicFieldNames,
  isRoboostCardVisible,
} from '@/roboost-app/layout/utils/roboostCardLogic';
import { getRoboostRecordViewSettingsPath } from '@/roboost-app/layout/utils/getRoboostLayoutSettingsPath';
import { buildConditionalLogicFields } from '@/conditional-logic/utils/buildConditionalLogicFields';
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
import { roboostRecordLeftPanelCollapsedState } from '@/roboost-app/states/roboostRecordLeftPanelCollapsedState';
import { roboostRecordRightPanelCollapsedState } from '@/roboost-app/states/roboostRecordRightPanelCollapsedState';
import { getRoboostAvatarTone } from '@/roboost-app/utils/getRoboostAvatarTone';
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
import { RelationType } from '~/generated-metadata/graphql';

const OWNER_FIELD_NAMES = ['accountOwner', 'owner', 'assignee', 'sdrOwner'];
const NARROW_VIEWPORT_WIDTH = 1180;

type MemberRecord = { id: string; name?: RoboostFullName; __typename: string };
type LoadedRecord = Record<string, unknown> & { id: string };

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
  const roboostAccess = useRoboostAccess();
  const {
    layout: recordLayout,
    associations,
    isReady: isLayoutReady,
  } = useRoboostRecordLayoutConfig(objectMetadataItem, objectMetadataItems);

  const activeFields = objectMetadataItem.fields.filter(
    (field) => field.isActive,
  );
  const findActiveField = (name: string) =>
    activeFields.find((field) => field.name === name);
  const cards = recordLayout.left.map((card) => ({
    ...card,
    fields: card.fieldNames.map(findActiveField).filter(isDefined),
  }));
  const logicFieldByName = new Map(
    buildConditionalLogicFields(activeFields).map((field) => [
      field.name,
      field,
    ]),
  );
  const logicFields = [
    ...recordLayout.left.flatMap((card) =>
      getRoboostCardLogicFieldNames(card.logic),
    ),
    ...recordLayout.right.flatMap((card) =>
      getRoboostCardLogicFieldNames(card.logic),
    ),
  ]
    .map(findActiveField)
    .filter(isDefined);
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
    'dealAmount',
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
    ...cards.flatMap((card) => card.fields),
    ...logicFields,
  ];

  const { record, loading, refetch } = useFindOneRecord({
    objectNameSingular,
    objectRecordId: recordId,
    recordGqlFields: {
      ...getRoboostListRecordGqlFields(
        objectMetadataItem,
        loadedFields,
        objectMetadataItems,
      ),
      deletedAt: true,
    },
  });

  const {
    items: activityItems,
    loading: feedLoading,
    refetch: refetchFeed,
  } = useRoboostActivityFeed({
    targetRecordId: recordId,
    targetObjectNameSingular: objectNameSingular,
  });
  const { items: updateItems } = useRoboostTimelineUpdates({
    targetRecordId: recordId,
    targetObjectNameSingular: objectNameSingular,
  });
  const feedItems = [...activityItems, ...updateItems].sort((first, second) =>
    second.date.localeCompare(first.date),
  );
  const { isPinned, togglePin } = useRoboostActivityPins({
    targetObjectNameSingular: objectNameSingular,
    targetRecordId: recordId,
  });

  const { records: members } = useFindManyRecords<MemberRecord>({
    objectNameSingular: CoreObjectNameSingular.WorkspaceMember,
    recordGqlFields: { id: true, name: true },
    limit: 200,
  });

  if (!isDefined(record)) {
    const message = (
      <div className="rb-recpage-message">
        {loading
          ? t`Loading…`
          : t`This ${objectMetadataItem.labelSingular.toLowerCase()} could not be found.`}
      </div>
    );

    return loading ? (
      message
    ) : (
      <RoboostMergedRecordRedirect
        objectNameSingular={objectNameSingular}
        recordId={recordId}
        fallback={message}
      />
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
  const recordViewSettingsPath =
    getRoboostRecordViewSettingsPath(objectNameSingular);

  const recordName =
    getRoboostRecordLabel(loadedRecord, objectMetadataItem) ||
    t`Untitled ${objectMetadataItem.labelSingular.toLowerCase()}`;
  const avatarUrl = loadedRecord.avatarUrl;

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
      isNoPermission: !roboostAccess.hasToggle('arrangeCards'),
      onSelect: () => layout.resetToDefault(),
    },
    {
      id: 'edit-layout',
      label: t`Edit record view`,
      icon: 'external-link',
      href: recordViewSettingsPath,
      isNoPermission: !roboostAccess.hasToggle('customizeCards'),
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

  const visibleCards = isLayoutReady
    ? cards.filter((card) =>
        isRoboostCardVisible({
          logic: card.logic,
          record: loadedRecord,
          fieldByName: logicFieldByName,
        }),
      )
    : [];
  const visibleAssociationCards = recordLayout.right.filter(
    (card) =>
      !card.isHidden &&
      isRoboostCardVisible({
        logic: card.logic,
        record: loadedRecord,
        fieldByName: logicFieldByName,
      }),
  );
  const leftIds = layout.orderIds(
    'left',
    visibleCards.map((card) => card.id),
  );
  const leftHandlers = dragHandlers('left', leftIds);
  const rightIds = layout.orderIds(
    'right',
    visibleAssociationCards.map((card) => card.id),
  );
  const rightHandlers = dragHandlers('right', rightIds);

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
          </div>
        </div>
        <RoboostRecordQuickActions
          targetRecord={{
            id: recordId,
            targetObjectNameSingular: objectNameSingular,
          }}
          targetLabel={recordName}
          moreEntries={[]}
        />
      </section>
      {leftIds.map((cardId, index) => {
        const card = visibleCards.find((candidate) => candidate.id === cardId);

        if (!isDefined(card)) {
          return null;
        }

        return (
          <ItemErrorBoundary itemKind="record page container" key={card.id}>
            <RoboostPropertyGroupContainer
              id={card.id}
              title={card.title}
              fields={card.fields}
              record={loadedRecord}
              objectMetadataItem={objectMetadataItem}
              objectMetadataItems={objectMetadataItems}
              defaultOpen={index < 2}
              propertiesSettingsPath={recordViewSettingsPath}
              settingsEntries={containerSettings('left', [
                {
                  id: 'properties',
                  label: t`Properties settings`,
                  icon: 'external-link',
                  href: propertiesSettingsPath,
                  isNoPermission: !roboostAccess.hasToggle(
                    'editPropertySettings',
                  ),
                },
              ])}
              isDropTarget={dropTargetId === `left:${card.id}`}
              onSaved={() => refetch()}
              onDragStart={leftHandlers.onDragStart}
              onDragOver={leftHandlers.onDragOver}
              onDrop={leftHandlers.onDrop}
              onDragEnd={leftHandlers.onDragEnd}
            />
          </ItemErrorBoundary>
        );
      })}
    </>
  );

  const right = (
    <>
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
            <ItemErrorBoundary
              itemKind="record page container"
              key={association.id}
            >
              <RoboostAttachmentsContainer
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
            </ItemErrorBoundary>
          );
        }
        const related =
          association.kind === 'one'
            ? (loadedRecord[association.field.name] as { id?: string } | null)
            : null;

        return (
          <ItemErrorBoundary
            itemKind="record page container"
            key={association.id}
          >
            <RoboostAssociationContainer
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
              cardFieldNames={
                visibleAssociationCards.find(
                  (card) => card.id === association.id,
                )?.fieldNames
              }
              onDragStart={rightHandlers.onDragStart}
              onDragOver={rightHandlers.onDragOver}
              onDrop={rightHandlers.onDrop}
              onDragEnd={rightHandlers.onDragEnd}
            />
          </ItemErrorBoundary>
        );
      })}
    </>
  );

  const page = (
    <div className="rb-recpage">
      <RoboostMergedRecordNotice />
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
          <ItemErrorBoundary itemKind="record page activity column">
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
              customizePath={recordViewSettingsPath}
              overviewSections={recordLayout.overview}
              isPinned={(item) =>
                isDefined(item.objectNameSingular) &&
                isDefined(item.recordId) &&
                isPinned(item.objectNameSingular, item.recordId)
              }
              onTogglePin={(item) => {
                if (
                  isDefined(item.objectNameSingular) &&
                  isDefined(item.recordId)
                ) {
                  togglePin(item.objectNameSingular, item.recordId);
                }
              }}
              onChanged={() => {
                refetchFeed();
                refetch();
              }}
              members={members.map((member) => ({
                id: member.id,
                name: getRoboostPersonName(member.name),
              }))}
            />
          </ItemErrorBoundary>
        }
        right={right}
      />
    </div>
  );

  // The record page also loads trashed records, so a merged one is redirected here too
  return isDefined(record.deletedAt) ? (
    <RoboostMergedRecordRedirect
      objectNameSingular={objectNameSingular}
      recordId={recordId}
      fallback={page}
    />
  ) : (
    page
  );
};
