import { useComposeEmailForTargetRecord } from '@/activities/emails/hooks/useComposeEmailForTargetRecord';
import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { roboostActivityComposerState } from '@/roboost-app/activity/states/roboostActivityComposerState';
import { formatRoboostRelativeTime } from '@/roboost-app/board/utils/formatRoboostRelativeTime';
import { getRoboostRecordLabel } from '@/roboost-app/fields/getRoboostRecordLabel';
import { formatRoboostFieldValue } from '@/roboost-app/utils/formatRoboostFieldValue';
import { getRoboostAvatarTone } from '@/roboost-app/utils/getRoboostAvatarTone';
import { getRoboostOptionTone } from '@/roboost-app/utils/getRoboostOptionTone';
import {
  getRoboostPersonName,
  type RoboostFullName,
} from '@/roboost-app/utils/getRoboostPersonName';
import { Avatar } from '@/roboost-ui/components/Avatar';
import { Icon } from '@/roboost-ui/components/Icon';
import { Menu } from '@/roboost-ui/components/Menu';
import { Tag } from '@/roboost-ui/components/Tag';
import { useSetAtomState } from '@/ui/utilities/state/jotai/hooks/useSetAtomState';
import { useLingui } from '@lingui/react/macro';
import { isNonEmptyString, isString } from '@sniptt/guards';
import { Link } from 'react-router-dom';
import { AppPath } from 'twenty-shared/types';
import { getAppPath, isDefined } from 'twenty-shared/utils';
import { FieldMetadataType } from '~/generated-metadata/graphql';

type RoboostBoardCardProps = {
  record: Record<string, unknown> & { id: string };
  objectMetadataItem: EnrichedObjectMetadataItem;
  cardFields: FieldMetadataItem[];
  ownerField: FieldMetadataItem | undefined;
  isDragging: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
};

export const RoboostBoardCard = ({
  record,
  objectMetadataItem,
  cardFields,
  ownerField,
  isDragging,
  onDragStart,
  onDragEnd,
}: RoboostBoardCardProps) => {
  const { t } = useLingui();
  const setRoboostActivityComposer = useSetAtomState(
    roboostActivityComposerState,
  );
  const target = {
    id: record.id,
    targetObjectNameSingular: objectMetadataItem.nameSingular,
  };
  const { openComposer } = useComposeEmailForTargetRecord(target);
  const name =
    getRoboostRecordLabel(record, objectMetadataItem) ||
    t`Untitled ${objectMetadataItem.labelSingular.toLowerCase()}`;
  const recordPath = getAppPath(AppPath.RecordShowPage, {
    objectNameSingular: objectMetadataItem.nameSingular,
    objectRecordId: record.id,
  });
  const owner = isDefined(ownerField)
    ? (record[ownerField.name] as { name?: RoboostFullName } | null)
    : null;
  const ownerName = getRoboostPersonName(owner?.name);
  const nextActivity = record.nextActivityDate;
  const lastActivity = record.lastActivityDate;
  const now = new Date();
  const activityChip =
    isString(nextActivity) && new Date(nextActivity) > now
      ? formatRoboostRelativeTime(nextActivity, now)
      : isString(lastActivity)
        ? formatRoboostRelativeTime(lastActivity, now)
        : '';

  const openActivity = (type: 'task' | 'note' | 'call') =>
    setRoboostActivityComposer({
      type,
      targets: [
        {
          objectNameSingular: objectMetadataItem.nameSingular,
          recordId: record.id,
          label: name,
        },
      ],
    });

  return (
    <article
      className={isDragging ? 'rb-bcard is-dragging' : 'rb-bcard'}
      draggable
      onDragStart={(event) => {
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', record.id);
        onDragStart();
      }}
      onDragEnd={onDragEnd}
    >
      <Link className="rb-bcard-name" to={recordPath} title={name}>
        {name}
      </Link>
      <div className="rb-bcard-props">
        {cardFields.map((field) => {
          const value = record[field.name];
          const option =
            field.type === FieldMetadataType.SELECT
              ? field.options?.find((candidate) => candidate.value === value)
              : undefined;

          return (
            <div key={field.id} className="rb-bcard-prop">
              <span className="rb-bcard-key">{field.label}: </span>
              {isDefined(option) ? (
                <Tag
                  tone={
                    getRoboostOptionTone({
                      value: option.value,
                      color: option.color,
                    }).tone
                  }
                >
                  {option.label}
                </Tag>
              ) : field.type === FieldMetadataType.RELATION ? (
                <b>
                  {getRoboostRecordLabel(
                    value as Record<string, unknown> & { id: string },
                  ) || '—'}
                </b>
              ) : (
                <b>{formatRoboostFieldValue(field, value, record)}</b>
              )}
            </div>
          );
        })}
      </div>
      <div className="rb-bcard-meta">
        {isNonEmptyString(ownerName) ? (
          <Avatar
            name={ownerName}
            size="xs"
            tone={getRoboostAvatarTone(ownerName)}
          />
        ) : (
          <span className="rb-bcard-noowner">{t`No owner`}</span>
        )}
        <span className="rb-sp" />
        {isNonEmptyString(activityChip) && (
          <span className="rb-bcard-time">
            <Icon name="clock" size={12} />
            {activityChip}
          </span>
        )}
      </div>
      <div className="rb-bcard-actions">
        <Link
          className="rb-rc-iconbtn"
          to={recordPath}
          aria-label={t`Open ${name}`}
          title={t`Open`}
        >
          <Icon name="pencil" size={14} />
        </Link>
        <button
          type="button"
          className="rb-rc-iconbtn"
          aria-label={t`Email`}
          title={t`Email`}
          onClick={openComposer}
        >
          <Icon name="mail" size={14} />
        </button>
        <button
          type="button"
          className="rb-rc-iconbtn"
          aria-label={t`Create task`}
          title={t`Create task`}
          onClick={() => openActivity('task')}
        >
          <Icon name="tasks" size={14} />
        </button>
        <Menu
          entries={[
            {
              id: 'note',
              label: t`Add note`,
              icon: 'note',
              onSelect: () => openActivity('note'),
            },
            {
              id: 'call',
              label: t`Log call`,
              icon: 'phone',
              onSelect: () => openActivity('call'),
            },
          ]}
          trigger={({ toggle, isOpen }) => (
            <button
              type="button"
              className="rb-rc-iconbtn"
              aria-label={t`More actions`}
              aria-expanded={isOpen}
              onClick={toggle}
            >
              <Icon name="more" size={14} />
            </button>
          )}
        />
      </div>
    </article>
  );
};
