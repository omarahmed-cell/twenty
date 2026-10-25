import { type MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { STANDARD_OBJECTS } from 'twenty-shared/metadata';
import {
  STANDARD_TIMELINE_ACTIVITY_RENDERER_UNIVERSAL_IDENTIFIERS,
  type TimelineActivityAction,
} from 'twenty-shared/timeline';

type StandardTimelineActivityTypeDefinitionSource = {
  name: string;
  universalIdentifier: string;
  label: MessageDescriptor;
  icon: string | null;
  frontComponentUniversalIdentifier: string | null;
  emit: {
    on: TimelineActivityAction;
    objectUniversalIdentifier: string | null;
    through?: {
      relationFieldUniversalIdentifier: string;
      triggerFieldUniversalIdentifiers?: string[];
      happensAtFieldUniversalIdentifier?: string;
    };
  };
};

export type StandardTimelineActivityTypeDefinition =
  StandardTimelineActivityTypeDefinitionSource & {
    action: TimelineActivityAction;
    objectUniversalIdentifier: string | null;
    targetRelationFieldUniversalIdentifier?: string;
    triggerFieldUniversalIdentifiers?: string[];
    happensAtFieldUniversalIdentifier?: string;
  };

// Wildcard emitters are standard-only fallbacks; application manifests require an object on every emitter
const STANDARD_TIMELINE_ACTIVITY_TYPE_DEFINITION_SOURCES: StandardTimelineActivityTypeDefinitionSource[] =
  [
    {
      name: 'recordCreated',
      universalIdentifier: '20202020-0d1a-4f0e-8a55-1c0a2f0a2c01',
      label: msg({
        message: `was created by`,
        context: 'timelineActivityType.label',
      }),
      icon: 'IconCirclePlus',
      frontComponentUniversalIdentifier: null,
      emit: { on: 'created', objectUniversalIdentifier: null },
    },
    {
      name: 'recordUpdated',
      universalIdentifier: '20202020-0d1a-4f0e-8a55-1c0a2f0a2c02',
      label: msg({
        message: `updated`,
        context: 'timelineActivityType.label',
      }),
      icon: 'IconEditCircle',
      frontComponentUniversalIdentifier: null,
      emit: { on: 'updated', objectUniversalIdentifier: null },
    },
    {
      name: 'recordDeleted',
      universalIdentifier: '20202020-0d1a-4f0e-8a55-1c0a2f0a2c03',
      label: msg({
        message: `was deleted by`,
        context: 'timelineActivityType.label',
      }),
      icon: 'IconTrash',
      frontComponentUniversalIdentifier: null,
      emit: { on: 'deleted', objectUniversalIdentifier: null },
    },
    {
      name: 'recordRestored',
      universalIdentifier: '20202020-0d1a-4f0e-8a55-1c0a2f0a2c04',
      label: msg({
        message: `was restored by`,
        context: 'timelineActivityType.label',
      }),
      icon: 'IconRestore',
      frontComponentUniversalIdentifier: null,
      emit: { on: 'restored', objectUniversalIdentifier: null },
    },
    {
      name: 'recordLinked',
      universalIdentifier: '20202020-0d1a-4f0e-8a55-1c0a2f0a2c05',
      label: msg({
        message: `linked`,
        context: 'timelineActivityType.label',
      }),
      icon: 'IconLink',
      frontComponentUniversalIdentifier: null,
      emit: { on: 'linked', objectUniversalIdentifier: null },
    },
    {
      name: 'recordUnlinked',
      universalIdentifier: '20202020-0d1a-4f0e-8a55-1c0a2f0a2c06',
      label: msg({
        message: `unlinked`,
        context: 'timelineActivityType.label',
      }),
      icon: 'IconUnlink',
      frontComponentUniversalIdentifier: null,
      emit: { on: 'unlinked', objectUniversalIdentifier: null },
    },
    {
      name: 'noteLinked',
      universalIdentifier: '20202020-0d1a-4f0e-8a55-1c0a2f0a2c09',
      label: msg({
        message: `added a note`,
        context: 'timelineActivityType.label',
      }),
      icon: 'IconLink',
      frontComponentUniversalIdentifier: null,
      emit: {
        on: 'linked',
        objectUniversalIdentifier: STANDARD_OBJECTS.note.universalIdentifier,
        through: {
          relationFieldUniversalIdentifier:
            STANDARD_OBJECTS.note.fields.noteTargets.universalIdentifier,
        },
      },
    },
    {
      name: 'noteUnlinked',
      universalIdentifier: '20202020-0d1a-4f0e-8a55-1c0a2f0a2c0a',
      label: msg({
        message: `removed a note`,
        context: 'timelineActivityType.label',
      }),
      icon: 'IconUnlink',
      frontComponentUniversalIdentifier: null,
      emit: {
        on: 'unlinked',
        objectUniversalIdentifier: STANDARD_OBJECTS.note.universalIdentifier,
        through: {
          relationFieldUniversalIdentifier:
            STANDARD_OBJECTS.note.fields.noteTargets.universalIdentifier,
        },
      },
    },
    {
      name: 'noteUpdated',
      universalIdentifier: '20202020-0d1a-4f0e-8a55-1c0a2f0a2c0b',
      label: msg({
        message: `updated a note`,
        context: 'timelineActivityType.label',
      }),
      icon: 'IconEditCircle',
      frontComponentUniversalIdentifier: null,
      emit: {
        on: 'updated',
        objectUniversalIdentifier: STANDARD_OBJECTS.note.universalIdentifier,
        through: {
          relationFieldUniversalIdentifier:
            STANDARD_OBJECTS.note.fields.noteTargets.universalIdentifier,
          triggerFieldUniversalIdentifiers: [
            STANDARD_OBJECTS.note.fields.title.universalIdentifier,
          ],
        },
      },
    },
    {
      name: 'callLinked',
      universalIdentifier: 'd1f5aa35-b6ae-4105-a2b6-32ceab737a57',
      label: msg({
        message: `logged a call`,
        context: 'timelineActivityType.label',
      }),
      icon: 'IconLink',
      frontComponentUniversalIdentifier: null,
      emit: {
        on: 'linked',
        objectUniversalIdentifier: STANDARD_OBJECTS.call.universalIdentifier,
        through: {
          relationFieldUniversalIdentifier:
            STANDARD_OBJECTS.call.fields.callTargets.universalIdentifier,
        },
      },
    },
    {
      name: 'callUnlinked',
      universalIdentifier: 'e97cbbff-70f6-47bc-9589-239238256ca9',
      label: msg({
        message: `removed a call`,
        context: 'timelineActivityType.label',
      }),
      icon: 'IconUnlink',
      frontComponentUniversalIdentifier: null,
      emit: {
        on: 'unlinked',
        objectUniversalIdentifier: STANDARD_OBJECTS.call.universalIdentifier,
        through: {
          relationFieldUniversalIdentifier:
            STANDARD_OBJECTS.call.fields.callTargets.universalIdentifier,
        },
      },
    },
    {
      name: 'callUpdated',
      universalIdentifier: '13d57092-f6c4-42d8-8cf1-28b51a5ec224',
      label: msg({
        message: `updated a call`,
        context: 'timelineActivityType.label',
      }),
      icon: 'IconEditCircle',
      frontComponentUniversalIdentifier: null,
      emit: {
        on: 'updated',
        objectUniversalIdentifier: STANDARD_OBJECTS.call.universalIdentifier,
        through: {
          relationFieldUniversalIdentifier:
            STANDARD_OBJECTS.call.fields.callTargets.universalIdentifier,
          triggerFieldUniversalIdentifiers: [
            STANDARD_OBJECTS.call.fields.title.universalIdentifier,
            STANDARD_OBJECTS.call.fields.outcome.universalIdentifier,
          ],
        },
      },
    },
    {
      name: 'communicationLinked',
      universalIdentifier: '4e9ea106-e45d-43fc-92bd-b0445631f753',
      label: msg({
        message: `logged a message`,
        context: 'timelineActivityType.label',
      }),
      icon: 'IconLink',
      frontComponentUniversalIdentifier: null,
      emit: {
        on: 'linked',
        objectUniversalIdentifier:
          STANDARD_OBJECTS.communication.universalIdentifier,
        through: {
          relationFieldUniversalIdentifier:
            STANDARD_OBJECTS.communication.fields.communicationTargets
              .universalIdentifier,
        },
      },
    },
    {
      name: 'communicationUnlinked',
      universalIdentifier: '4a6774c3-500e-4b99-a8d3-996322b5db32',
      label: msg({
        message: `removed a message`,
        context: 'timelineActivityType.label',
      }),
      icon: 'IconUnlink',
      frontComponentUniversalIdentifier: null,
      emit: {
        on: 'unlinked',
        objectUniversalIdentifier:
          STANDARD_OBJECTS.communication.universalIdentifier,
        through: {
          relationFieldUniversalIdentifier:
            STANDARD_OBJECTS.communication.fields.communicationTargets
              .universalIdentifier,
        },
      },
    },
    {
      name: 'communicationUpdated',
      universalIdentifier: 'a39d537c-1f37-4624-bb5d-9506b83dc624',
      label: msg({
        message: `updated a message`,
        context: 'timelineActivityType.label',
      }),
      icon: 'IconEditCircle',
      frontComponentUniversalIdentifier: null,
      emit: {
        on: 'updated',
        objectUniversalIdentifier:
          STANDARD_OBJECTS.communication.universalIdentifier,
        through: {
          relationFieldUniversalIdentifier:
            STANDARD_OBJECTS.communication.fields.communicationTargets
              .universalIdentifier,
          triggerFieldUniversalIdentifiers: [
            STANDARD_OBJECTS.communication.fields.title.universalIdentifier,
          ],
        },
      },
    },
    {
      name: 'taskLinked',
      universalIdentifier: '20202020-0d1a-4f0e-8a55-1c0a2f0a2c0c',
      label: msg({
        message: `added a task`,
        context: 'timelineActivityType.label',
      }),
      icon: 'IconLink',
      frontComponentUniversalIdentifier: null,
      emit: {
        on: 'linked',
        objectUniversalIdentifier: STANDARD_OBJECTS.task.universalIdentifier,
        through: {
          relationFieldUniversalIdentifier:
            STANDARD_OBJECTS.task.fields.taskTargets.universalIdentifier,
        },
      },
    },
    {
      name: 'taskUnlinked',
      universalIdentifier: '20202020-0d1a-4f0e-8a55-1c0a2f0a2c0d',
      label: msg({
        message: `removed a task`,
        context: 'timelineActivityType.label',
      }),
      icon: 'IconUnlink',
      frontComponentUniversalIdentifier: null,
      emit: {
        on: 'unlinked',
        objectUniversalIdentifier: STANDARD_OBJECTS.task.universalIdentifier,
        through: {
          relationFieldUniversalIdentifier:
            STANDARD_OBJECTS.task.fields.taskTargets.universalIdentifier,
        },
      },
    },
    {
      name: 'taskUpdated',
      universalIdentifier: '20202020-0d1a-4f0e-8a55-1c0a2f0a2c0e',
      label: msg({
        message: `updated a task`,
        context: 'timelineActivityType.label',
      }),
      icon: 'IconEditCircle',
      frontComponentUniversalIdentifier: null,
      emit: {
        on: 'updated',
        objectUniversalIdentifier: STANDARD_OBJECTS.task.universalIdentifier,
        through: {
          relationFieldUniversalIdentifier:
            STANDARD_OBJECTS.task.fields.taskTargets.universalIdentifier,
          triggerFieldUniversalIdentifiers: [
            STANDARD_OBJECTS.task.fields.title.universalIdentifier,
          ],
        },
      },
    },
    {
      name: 'messageLinked',
      universalIdentifier: '20202020-0d1a-4f0e-8a55-1c0a2f0a2c0f',
      label: msg({
        message: `sent or received an email`,
        context: 'timelineActivityType.label',
      }),
      icon: 'IconMail',
      frontComponentUniversalIdentifier:
        STANDARD_TIMELINE_ACTIVITY_RENDERER_UNIVERSAL_IDENTIFIERS.message,
      emit: {
        on: 'linked',
        objectUniversalIdentifier: STANDARD_OBJECTS.message.universalIdentifier,
        through: {
          relationFieldUniversalIdentifier:
            STANDARD_OBJECTS.message.fields.messageParticipants
              .universalIdentifier,
          happensAtFieldUniversalIdentifier:
            STANDARD_OBJECTS.message.fields.receivedAt.universalIdentifier,
        },
      },
    },
    {
      name: 'calendarEventLinked',
      universalIdentifier: '20202020-0d1a-4f0e-8a55-1c0a2f0a2c10',
      label: msg({
        message: `attended a meeting`,
        context: 'timelineActivityType.label',
      }),
      icon: 'IconCalendar',
      frontComponentUniversalIdentifier:
        STANDARD_TIMELINE_ACTIVITY_RENDERER_UNIVERSAL_IDENTIFIERS.calendarEvent,
      emit: {
        on: 'linked',
        objectUniversalIdentifier:
          STANDARD_OBJECTS.calendarEvent.universalIdentifier,
        through: {
          relationFieldUniversalIdentifier:
            STANDARD_OBJECTS.calendarEvent.fields.calendarEventParticipants
              .universalIdentifier,
          happensAtFieldUniversalIdentifier:
            STANDARD_OBJECTS.calendarEvent.fields.startsAt.universalIdentifier,
        },
      },
    },
    {
      name: 'attachmentLinked',
      universalIdentifier: '20202020-0d1a-4f0e-8a55-1c0a2f0a2c11',
      label: msg({
        message: `attached a file`,
        context: 'timelineActivityType.label',
      }),
      icon: 'IconPaperclip',
      frontComponentUniversalIdentifier: null,
      emit: {
        on: 'linked',
        objectUniversalIdentifier:
          STANDARD_OBJECTS.attachment.universalIdentifier,
        through: {
          relationFieldUniversalIdentifier:
            STANDARD_OBJECTS.attachment.fields.targetPerson.universalIdentifier,
        },
      },
    },
    {
      name: 'attachmentUnlinked',
      universalIdentifier: '20202020-0d1a-4f0e-8a55-1c0a2f0a2c12',
      label: msg({
        message: `removed an attachment`,
        context: 'timelineActivityType.label',
      }),
      icon: 'IconUnlink',
      frontComponentUniversalIdentifier: null,
      emit: {
        on: 'unlinked',
        objectUniversalIdentifier:
          STANDARD_OBJECTS.attachment.universalIdentifier,
        through: {
          relationFieldUniversalIdentifier:
            STANDARD_OBJECTS.attachment.fields.targetPerson.universalIdentifier,
        },
      },
    },
  ];

// Normalized properties keep the committed 2.34 upgrade command stable
export const STANDARD_TIMELINE_ACTIVITY_TYPE_DEFINITIONS: StandardTimelineActivityTypeDefinition[] =
  STANDARD_TIMELINE_ACTIVITY_TYPE_DEFINITION_SOURCES.map((definition) => ({
    ...definition,
    action: definition.emit.on,
    objectUniversalIdentifier: definition.emit.objectUniversalIdentifier,
    targetRelationFieldUniversalIdentifier:
      definition.emit.through?.relationFieldUniversalIdentifier,
    triggerFieldUniversalIdentifiers:
      definition.emit.through?.triggerFieldUniversalIdentifiers,
    happensAtFieldUniversalIdentifier:
      definition.emit.through?.happensAtFieldUniversalIdentifier,
  }));
