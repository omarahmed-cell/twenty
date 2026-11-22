import { useObjectMetadataItems } from '@/object-metadata/hooks/useObjectMetadataItems';
import { RoboostActivityTextEditor } from '@/roboost-app/activity/components/RoboostActivityTextEditor';
import { RoboostActivityTargetsMenu } from '@/roboost-app/activity/components/RoboostActivityTargetsMenu';
import {
  ROBOOST_ACTIVITY_OBJECT_BY_TYPE,
  useRoboostSaveActivity,
} from '@/roboost-app/activity/hooks/useRoboostSaveActivity';
import {
  type RoboostActivityComposer as RoboostActivityComposerRequest,
  type RoboostActivityTarget,
  type RoboostActivityType,
  roboostActivityComposerState,
} from '@/roboost-app/activity/states/roboostActivityComposerState';
import { addRoboostBusinessDays } from '@/roboost-app/activity/utils/addRoboostBusinessDays';
import { RoboostRecordPicker } from '@/roboost-app/fields/RoboostRecordPicker';
import { Button } from '@/roboost-ui/components/Button';
import { Checkbox } from '@/roboost-ui/components/Checkbox';
import { Icon } from '@/roboost-ui/components/Icon';
import { Input } from '@/roboost-ui/components/Input';
import { Menu } from '@/roboost-ui/components/Menu';
import { Select } from '@/roboost-ui/components/Select';
import { cx } from '@/roboost-ui/utils/cx';
import { useAtomState } from '@/ui/utilities/state/jotai/hooks/useAtomState';
import { useLingui } from '@lingui/react/macro';
import { isNonEmptyString } from '@sniptt/guards';
import { type PointerEvent as ReactPointerEvent, useState } from 'react';
import { createPortal } from 'react-dom';
import { isDefined } from 'twenty-shared/utils';

type RoboostComposerSize = 'normal' | 'expanded' | 'minimised';

const FOLLOW_UP_DAY_OPTIONS = [1, 2, 3, 5, 7];
const CHANNEL_BY_TYPE: Partial<Record<RoboostActivityType, string>> = {
  whatsapp: 'WHATSAPP',
  linkedin: 'LINKEDIN',
  sms: 'SMS',
};

const toLocalInputValue = (date: Date) => {
  const offset = date.getTimezoneOffset() * 60000;

  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

const RoboostActivityComposerForm = ({
  request,
  onClose,
}: {
  request: RoboostActivityComposerRequest;
  onClose: () => void;
}) => {
  const { t } = useLingui();
  const { objectMetadataItems } = useObjectMetadataItems();
  const { saveActivity } = useRoboostSaveActivity();
  const { type } = request;
  const [size, setSize] = useState<RoboostComposerSize>('normal');
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [targets, setTargets] = useState<RoboostActivityTarget[]>(
    request.targets,
  );
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [selects, setSelects] = useState<Record<string, string>>({});
  const [activityDate, setActivityDate] = useState(
    toLocalInputValue(new Date()),
  );
  const [endDate, setEndDate] = useState(
    toLocalInputValue(new Date(Date.now() + 30 * 60000)),
  );
  const [location, setLocation] = useState('');
  const [assigneeId, setAssigneeId] = useState<string | null>(null);
  const [assigneeLabel, setAssigneeLabel] = useState('');
  const [hasFollowUp, setHasFollowUp] = useState(false);
  const [followUpDays, setFollowUpDays] = useState(3);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const objectNameSingular = ROBOOST_ACTIVITY_OBJECT_BY_TYPE[type];
  const objectMetadataItem = objectMetadataItems.find(
    (item) => item.nameSingular === objectNameSingular,
  );
  const getOptions = (fieldName: string) =>
    [
      ...(objectMetadataItem?.fields.find(
        (field) => field.name === fieldName && field.isActive,
      )?.options ?? []),
    ]
      .sort((first, second) => first.position - second.position)
      .map((option) => ({ value: option.value, label: option.label }));

  const channelLabel =
    type === 'whatsapp'
      ? t`WhatsApp`
      : type === 'linkedin'
        ? t`LinkedIn`
        : t`SMS`;
  const headingByType: Record<RoboostActivityType, string> = {
    note: t`Note`,
    call: t`Log call`,
    task: t`Task`,
    meeting: t`Meeting`,
    whatsapp: t`Log WhatsApp`,
    linkedin: t`Log LinkedIn message`,
    sms: t`Log SMS`,
  };
  const saveLabelByType: Record<RoboostActivityType, string> = {
    note: t`Create note`,
    call: t`Log call`,
    task: t`Create task`,
    meeting: t`Create meeting`,
    whatsapp: t`Log WhatsApp`,
    linkedin: t`Log LinkedIn message`,
    sms: t`Log SMS`,
  };
  const placeholderByType: Record<RoboostActivityType, string> = {
    note: t`Start typing to leave a note…`,
    call: t`Start typing to log a call…`,
    task: t`Notes for this task…`,
    meeting: t`Agenda or notes…`,
    whatsapp: t`What was said on WhatsApp…`,
    linkedin: t`What was said on LinkedIn…`,
    sms: t`What was said by SMS…`,
  };

  const followUpDate = addRoboostBusinessDays(new Date(), followUpDays);
  const followUpDayName = new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
  }).format(followUpDate);

  const needsTitle = type === 'task' || type === 'meeting';
  const canSave =
    !isSaving &&
    (needsTitle
      ? isNonEmptyString(title.trim())
      : isNonEmptyString(body.trim()));

  const bodyV2 = isNonEmptyString(body.trim())
    ? { markdown: body, blocknote: null }
    : undefined;
  const dateIso = new Date(activityDate).toISOString();

  const buildInput = (): Record<string, unknown> => {
    switch (type) {
      case 'note':
        return {
          title: isNonEmptyString(title.trim())
            ? title.trim()
            : body.trim().slice(0, 80),
          bodyV2,
        };
      case 'call':
        return {
          title: isNonEmptyString(title.trim())
            ? title.trim()
            : (targets[0]?.label ?? t`Call`),
          bodyV2,
          createdAt: dateIso,
          ...(isNonEmptyString(selects.outcome)
            ? { outcome: selects.outcome }
            : {}),
          ...(isNonEmptyString(selects.direction)
            ? { direction: selects.direction }
            : {}),
        };
      case 'task':
        return {
          title: title.trim(),
          bodyV2,
          dueAt: dateIso,
          status: isNonEmptyString(selects.status) ? selects.status : 'TODO',
          ...(isDefined(assigneeId) ? { assigneeId } : {}),
        };
      case 'meeting':
        return {
          title: title.trim(),
          description: body,
          startsAt: dateIso,
          endsAt: new Date(endDate).toISOString(),
          location,
          ...(isNonEmptyString(selects.meetingType)
            ? { meetingType: selects.meetingType }
            : {}),
        };
      default:
        return {
          title: `${channelLabel} · ${targets[0]?.label ?? ''}`.trim(),
          bodyV2,
          createdAt: dateIso,
          channelType: CHANNEL_BY_TYPE[type],
          ...(isNonEmptyString(selects.direction)
            ? { direction: selects.direction }
            : {}),
        };
    }
  };

  const save = async () => {
    setIsSaving(true);
    setError(null);
    try {
      await saveActivity({
        type,
        input: buildInput(),
        targets,
        followUp: hasFollowUp
          ? {
              dueAt: followUpDate.toISOString(),
              title: t`Follow up with ${targets[0]?.label ?? t`this record`}`,
            }
          : undefined,
      });
      onClose();
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : t`Could not save`,
      );
      setIsSaving(false);
    }
  };

  const startDrag = (event: ReactPointerEvent<HTMLElement>) => {
    if (size === 'expanded') {
      return;
    }
    const startX = event.clientX - offset.x;
    const startY = event.clientY - offset.y;
    const move = (moveEvent: PointerEvent) =>
      setOffset({
        x: moveEvent.clientX - startX,
        y: moveEvent.clientY - startY,
      });
    const stop = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', stop);
    };

    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', stop);
  };

  const selectField = (fieldName: string, label: string) => {
    const options = getOptions(fieldName);

    if (options.length === 0) {
      return null;
    }

    return (
      <label className="rb-act-field">
        <span className="rb-act-label">{label}</span>
        <Select
          aria-label={label}
          value={selects[fieldName]}
          placeholder={t`Select ${label.toLowerCase()}`}
          options={options}
          onChange={(value) => setSelects({ ...selects, [fieldName]: value })}
        />
      </label>
    );
  };

  const dateField = (
    label: string,
    value: string,
    onChange: (value: string) => void,
  ) => (
    <label className="rb-act-field">
      <span className="rb-act-label">{label}</span>
      <Input
        type="datetime-local"
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );

  return (
    <div
      className={cx('rb-act-pop', `is-${size}`)}
      role="dialog"
      aria-label={headingByType[type]}
      style={
        size === 'expanded'
          ? undefined
          : { transform: `translate(${offset.x}px, ${offset.y}px)` }
      }
    >
      <div className="rb-act-head">
        <button
          type="button"
          className="rb-rc-iconbtn"
          aria-label={size === 'minimised' ? t`Restore` : t`Minimise`}
          onClick={() => setSize(size === 'minimised' ? 'normal' : 'minimised')}
        >
          <Icon
            name={size === 'minimised' ? 'chevron-up' : 'caret'}
            size={16}
          />
        </button>
        <span className="rb-act-title">{headingByType[type]}</span>
        <span
          className="rb-act-drag"
          title={t`Drag to move`}
          onPointerDown={startDrag}
        >
          <Icon name="grip" size={16} />
        </span>
        <button
          type="button"
          className="rb-rc-iconbtn"
          aria-label={size === 'expanded' ? t`Shrink` : t`Expand`}
          onClick={() => {
            setOffset({ x: 0, y: 0 });
            setSize(size === 'expanded' ? 'normal' : 'expanded');
          }}
        >
          <Icon
            name={size === 'expanded' ? 'minimize' : 'maximize'}
            size={15}
          />
        </button>
        <button
          type="button"
          className="rb-rc-iconbtn"
          aria-label={t`Close`}
          onClick={onClose}
        >
          <Icon name="x" size={16} />
        </button>
      </div>
      {size !== 'minimised' && (
        <>
          <div className="rb-act-body">
            {(type === 'note' || needsTitle) && (
              <Input
                className="rb-act-titleinput"
                value={title}
                placeholder={
                  type === 'note'
                    ? t`Title (optional)`
                    : type === 'task'
                      ? t`Task title *`
                      : t`Meeting title *`
                }
                aria-label={t`Title`}
                onChange={(event) => setTitle(event.target.value)}
              />
            )}
            {type !== 'note' && (
              <div className="rb-act-grid">
                {(type === 'call' ||
                  type === 'whatsapp' ||
                  type === 'linkedin' ||
                  type === 'sms') && (
                  <>
                    <div className="rb-act-field">
                      <span className="rb-act-label">{t`Contacted`}</span>
                      <span className="rb-act-static">
                        {targets.filter(
                          (target) => target.objectNameSingular === 'person',
                        ).length === 1
                          ? t`1 contact`
                          : t`${targets.filter((target) => target.objectNameSingular === 'person').length} contacts`}
                      </span>
                    </div>
                    {type === 'call' && selectField('outcome', t`Call outcome`)}
                    {selectField(
                      'direction',
                      type === 'call' ? t`Call direction` : t`Direction`,
                    )}
                    {dateField(t`Activity date`, activityDate, setActivityDate)}
                  </>
                )}
                {type === 'task' && (
                  <>
                    {dateField(t`Due date`, activityDate, setActivityDate)}
                    {selectField('status', t`Status`)}
                    <div className="rb-act-field">
                      <span className="rb-act-label">{t`Assigned to`}</span>
                      <RoboostRecordPicker
                        objectNameSingular="workspaceMember"
                        selectedLabel={assigneeLabel}
                        placeholder={t`Unassigned`}
                        onSelect={(record) => {
                          setAssigneeId(record?.id ?? null);
                          setAssigneeLabel(record?.label ?? '');
                        }}
                      />
                    </div>
                  </>
                )}
                {type === 'meeting' && (
                  <>
                    {dateField(t`Starts`, activityDate, setActivityDate)}
                    {dateField(t`Ends`, endDate, setEndDate)}
                    {selectField('meetingType', t`Meeting type`)}
                    <label className="rb-act-field">
                      <span className="rb-act-label">{t`Location`}</span>
                      <Input
                        value={location}
                        aria-label={t`Location`}
                        onChange={(event) => setLocation(event.target.value)}
                      />
                    </label>
                  </>
                )}
              </div>
            )}
            <RoboostActivityTextEditor
              value={body}
              placeholder={placeholderByType[type]}
              onChange={setBody}
            />
            <RoboostActivityTargetsMenu
              targets={targets}
              onChange={setTargets}
            />
            {type !== 'task' && (
              <div className="rb-act-followup">
                <Checkbox
                  checked={hasFollowUp}
                  aria-label={t`Create a follow-up task`}
                  onChange={setHasFollowUp}
                />
                <span>
                  {t`Create a`} <b>{t`To-do`}</b> {t`task to follow up`}
                </span>
                <Menu
                  placement="above"
                  entries={FOLLOW_UP_DAY_OPTIONS.map((days) => ({
                    id: String(days),
                    label:
                      days === 1
                        ? t`In 1 business day`
                        : t`In ${days} business days`,
                    isSelected: days === followUpDays,
                    onSelect: () => {
                      setFollowUpDays(days);
                      setHasFollowUp(true);
                    },
                  }))}
                  trigger={({ toggle, isOpen }) => (
                    <button
                      type="button"
                      className="rb-act-inline"
                      aria-expanded={isOpen}
                      onClick={toggle}
                    >
                      {followUpDays === 1
                        ? t`In 1 business day (${followUpDayName})`
                        : t`In ${followUpDays} business days (${followUpDayName})`}
                      <Icon name="caret" size={12} />
                    </button>
                  )}
                />
              </div>
            )}
            {isNonEmptyString(error) && (
              <div className="rb-rc-error">{error}</div>
            )}
          </div>
          <div className="rb-act-foot">
            <Button variant="primary" disabled={!canSave} onClick={save}>
              {isSaving ? t`Saving…` : saveLabelByType[type]}
            </Button>
            <Button variant="ghost" onClick={onClose}>
              {t`Cancel`}
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

// One floating composer at a time; nothing is saved until its save button is clicked
export const RoboostActivityComposer = () => {
  const [roboostActivityComposer, setRoboostActivityComposer] = useAtomState(
    roboostActivityComposerState,
  );

  if (roboostActivityComposer === null) {
    return null;
  }

  return createPortal(
    <div className="rb-ui rb-act-layer">
      <RoboostActivityComposerForm
        key={`${roboostActivityComposer.type}-${roboostActivityComposer.targets
          .map((target) => target.recordId)
          .join(',')}`}
        request={roboostActivityComposer}
        onClose={() => setRoboostActivityComposer(null)}
      />
    </div>,
    document.body,
  );
};
