import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';

import { isNonEmptyString } from '@sniptt/guards';
import {
  DEFAULT_WORKING_DAYS_CONFIG,
  isDefined,
  type WorkingDaysConfig,
} from 'twenty-shared/utils';
import { DataSource } from 'typeorm';

import { getWorkspaceSchemaName } from 'src/engine/workspace-datasource/utils/get-workspace-schema-name.util';
import { RoboostNotificationService } from 'src/modules/roboost-notification/services/roboost-notification.service';
import { buildRoboostOverdueTasksPath } from 'src/modules/roboost-notification/utils/build-roboost-overdue-tasks-path.util';
import {
  formatRoboostDueTime,
  getRoboostLocalClock,
} from 'src/modules/roboost-notification/utils/roboost-local-time.util';

export const ROBOOST_REMINDER_OFFSETS = {
  atDue: 0,
  minutes15: 15,
  minutes30: 30,
  hour1: 60,
  day1: 1440,
} as const;

export type RoboostReminderOffset =
  | keyof typeof ROBOOST_REMINDER_OFFSETS
  | 'custom'
  | 'none';

const DIGEST_WINDOW_MINUTES = 15;
const WORKING_DAYS_KEY = 'roboost.default.workingDays';

type TaskRow = {
  id: string;
  title: string | null;
  dueAt: string | Date | null;
  assigneeId: string | null;
};

@Injectable()
export class RoboostTaskNotificationService {
  constructor(
    @InjectDataSource()
    private readonly coreDataSource: DataSource,
    private readonly roboostNotificationService: RoboostNotificationService,
  ) {}

  private schema(workspaceId: string) {
    return `"${getWorkspaceSchemaName(workspaceId)}"`;
  }

  private async getMemberTimeZone(workspaceId: string, memberId: string) {
    const [member]: { timeZone: string | null }[] =
      await this.coreDataSource.query(
        `SELECT "timeZone" FROM ${this.schema(workspaceId)}."workspaceMember" WHERE id = $1`,
        [memberId],
      );

    return member?.timeZone ?? null;
  }

  private async dueLine(workspaceId: string, task: TaskRow) {
    if (!isDefined(task.dueAt) || !isDefined(task.assigneeId)) {
      return '';
    }
    const timeZone = await this.getMemberTimeZone(workspaceId, task.assigneeId);

    return `Due ${formatRoboostDueTime(new Date(task.dueAt), timeZone)}`;
  }

  private taskTitle(task: TaskRow) {
    return isNonEmptyString(task.title?.trim())
      ? task.title.trim()
      : 'Untitled task';
  }

  async notifyTaskAssigned({
    workspaceId,
    task,
    actorWorkspaceMemberId,
    actorName,
  }: {
    workspaceId: string;
    task: TaskRow;
    actorWorkspaceMemberId: string | null;
    actorName: string;
  }) {
    if (!isDefined(task.assigneeId)) {
      return;
    }
    const due = await this.dueLine(workspaceId, task);

    await this.roboostNotificationService.notify({
      workspaceId,
      recipientWorkspaceMemberId: task.assigneeId,
      type: 'task',
      subtype: 'task_assigned',
      title: `${actorName} assigned you a task`,
      body: [this.taskTitle(task), due].filter(isNonEmptyString).join(' · '),
      actorWorkspaceMemberId,
      actorName,
      target: {
        objectNameSingular: 'task',
        recordId: task.id,
        actionLabel: 'View task',
      },
      relatedRecords: [
        { id: task.id, name: this.taskTitle(task), objectNameSingular: 'task' },
      ],
      relatedCount: 1,
    });
  }

  // Keeps the reminder in step with the task: due date moves it, done or deleted cancels it
  async syncReminder({
    workspaceId,
    taskId,
    dueAt,
    isClosed,
    isNew,
  }: {
    workspaceId: string;
    taskId: string;
    dueAt: string | null;
    isClosed: boolean;
    isNew: boolean;
  }) {
    const table = `${this.schema(workspaceId)}."roboostTaskReminder"`;

    if (isClosed) {
      await this.coreDataSource.query(
        `DELETE FROM ${table} WHERE "taskId" = $1`,
        [taskId],
      );

      return;
    }

    if (isNew && isDefined(dueAt)) {
      await this.coreDataSource.query(
        `INSERT INTO ${table} ("taskId", "offset", "remindAt")
        VALUES ($1, 'atDue', $2::timestamptz)
        ON CONFLICT ("taskId") DO NOTHING`,
        [taskId, dueAt],
      );
    }

    await this.coreDataSource.query(
      `UPDATE ${table}
      SET "remindAt" = CASE WHEN $2::timestamptz IS NULL THEN NULL
          ELSE $2::timestamptz - make_interval(mins => "offsetMinutes") END,
        "sentAt" = NULL
      WHERE "taskId" = $1 AND "offset" NOT IN ('custom', 'none')`,
      [taskId, dueAt],
    );
  }

  async setReminder({
    workspaceId,
    taskId,
    offset,
    customAt,
  }: {
    workspaceId: string;
    taskId: string;
    offset: RoboostReminderOffset;
    customAt: string | null;
  }) {
    const schema = this.schema(workspaceId);
    const [task]: { dueAt: string | null }[] = await this.coreDataSource.query(
      `SELECT "dueAt" FROM ${schema}."task" WHERE id = $1`,
      [taskId],
    );

    if (!isDefined(task)) {
      return false;
    }

    const offsetMinutes =
      offset in ROBOOST_REMINDER_OFFSETS
        ? ROBOOST_REMINDER_OFFSETS[
            offset as keyof typeof ROBOOST_REMINDER_OFFSETS
          ]
        : 0;
    const remindAt =
      offset === 'none'
        ? null
        : offset === 'custom'
          ? customAt
          : isDefined(task.dueAt)
            ? new Date(
                new Date(task.dueAt).getTime() - offsetMinutes * 60_000,
              ).toISOString()
            : null;

    await this.coreDataSource.query(
      `INSERT INTO ${schema}."roboostTaskReminder" ("taskId", "offset", "offsetMinutes", "customAt", "remindAt", "sentAt")
      VALUES ($1, $2, $3, $4::timestamptz, $5::timestamptz, NULL)
      ON CONFLICT ("taskId") DO UPDATE SET "offset" = $2, "offsetMinutes" = $3,
        "customAt" = $4::timestamptz, "remindAt" = $5::timestamptz, "sentAt" = NULL`,
      [taskId, offset, offsetMinutes, customAt, remindAt],
    );

    return true;
  }

  async getReminder(workspaceId: string, taskId: string) {
    const [row]: { offset: string; customAt: string | null }[] =
      await this.coreDataSource.query(
        `SELECT "offset", "customAt" FROM ${this.schema(workspaceId)}."roboostTaskReminder" WHERE "taskId" = $1`,
        [taskId],
      );

    return row ?? null;
  }

  async sendDueReminders(workspaceId: string): Promise<number> {
    const schema = this.schema(workspaceId);
    const due: TaskRow[] = await this.coreDataSource.query(
      `WITH due AS (
        UPDATE ${schema}."roboostTaskReminder" r SET "sentAt" = now()
        FROM ${schema}."task" t
        WHERE r."taskId" = t.id AND r."sentAt" IS NULL AND r."remindAt" <= now()
          AND t."deletedAt" IS NULL AND t.status IS DISTINCT FROM 'DONE'
          AND t."assigneeId" IS NOT NULL
        RETURNING t.id, t.title, t."dueAt", t."assigneeId"
      ) SELECT * FROM due`,
    );

    for (const task of due) {
      const dueLine = await this.dueLine(workspaceId, task);

      await this.roboostNotificationService.notify({
        workspaceId,
        recipientWorkspaceMemberId: task.assigneeId as string,
        type: 'task',
        subtype: 'task_reminder',
        title: `Reminder: ${this.taskTitle(task)}`,
        body: dueLine === '' ? this.taskTitle(task) : dueLine,
        target: {
          objectNameSingular: 'task',
          recordId: task.id,
          actionLabel: 'View task',
        },
        relatedRecords: [
          {
            id: task.id,
            name: this.taskTitle(task),
            objectNameSingular: 'task',
          },
        ],
        relatedCount: 1,
      });
    }

    return due.length;
  }

  async notifyNewlyOverdue(workspaceId: string, tasks: TaskRow[]) {
    for (const task of tasks) {
      if (!isDefined(task.assigneeId)) {
        continue;
      }
      const dueLine = await this.dueLine(workspaceId, task);

      await this.roboostNotificationService.notify({
        workspaceId,
        recipientWorkspaceMemberId: task.assigneeId,
        type: 'task',
        subtype: 'task_overdue',
        title: `Task overdue: ${this.taskTitle(task)}`,
        body:
          dueLine === ''
            ? this.taskTitle(task)
            : `Was ${dueLine.toLowerCase()}`,
        target: {
          path: buildRoboostOverdueTasksPath(task.assigneeId),
          actionLabel: 'View overdue tasks',
        },
        relatedRecords: [
          {
            id: task.id,
            name: this.taskTitle(task),
            objectNameSingular: 'task',
          },
        ],
        relatedCount: 1,
        groupKey: `task-overdue:${task.id}`,
      });
    }
  }

  private async getWorkingDays(
    workspaceId: string,
  ): Promise<WorkingDaysConfig> {
    const [row]: { value: Partial<WorkingDaysConfig> | null }[] =
      await this.coreDataSource.query(
        `SELECT value FROM core."keyValuePair"
        WHERE "workspaceId" = $1 AND "userId" IS NULL AND key = $2 AND type = 'USER_VARIABLE'`,
        [workspaceId, WORKING_DAYS_KEY],
      );

    return {
      days: Array.isArray(row?.value?.days)
        ? row.value.days
        : DEFAULT_WORKING_DAYS_CONFIG.days,
      startTime: isNonEmptyString(row?.value?.startTime)
        ? row.value.startTime
        : DEFAULT_WORKING_DAYS_CONFIG.startTime,
    };
  }

  // One digest per member per working day, at the start of their work day in their own time zone
  async sendOverdueDigests(workspaceId: string, now: Date = new Date()) {
    const workingDays = await this.getWorkingDays(workspaceId);
    const [startHour, startMinute] = workingDays.startTime
      .split(':')
      .map((part) => Number(part));
    const startMinutes = startHour * 60 + startMinute;
    const members: { id: string; timeZone: string | null; count: number }[] =
      await this.coreDataSource.query(
        `SELECT m.id, m."timeZone", count(t.id)::int AS count
        FROM ${this.schema(workspaceId)}."workspaceMember" m
        JOIN ${this.schema(workspaceId)}."task" t ON t."assigneeId" = m.id
        WHERE t."isOverdue" = true AND t."deletedAt" IS NULL AND m."deletedAt" IS NULL
        GROUP BY m.id, m."timeZone"`,
      );
    let sent = 0;

    for (const member of members) {
      const clock = getRoboostLocalClock(now, member.timeZone);
      const minutesIntoDay = clock.hour * 60 + clock.minute;

      if (
        member.count === 0 ||
        !workingDays.days.includes(clock.weekDay) ||
        minutesIntoDay < startMinutes ||
        minutesIntoDay >= startMinutes + DIGEST_WINDOW_MINUTES
      ) {
        continue;
      }

      const groupKey = `overdue-digest:${clock.date}`;

      if (
        await this.roboostNotificationService.existsWithGroupKey({
          workspaceId,
          recipientWorkspaceMemberId: member.id,
          groupKey,
        })
      ) {
        continue;
      }

      await this.roboostNotificationService.notify({
        workspaceId,
        recipientWorkspaceMemberId: member.id,
        type: 'task',
        subtype: 'task_overdue_digest',
        title: `You have ${member.count} overdue task${member.count === 1 ? '' : 's'}`,
        body: 'Tasks assigned to you that are past their due date.',
        target: {
          path: buildRoboostOverdueTasksPath(member.id),
          actionLabel: 'View overdue tasks',
        },
        groupKey,
      });
      sent++;
    }

    return sent;
  }
}
