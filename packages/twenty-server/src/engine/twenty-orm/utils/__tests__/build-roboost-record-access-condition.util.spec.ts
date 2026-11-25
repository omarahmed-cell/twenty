import { buildDefaultRoboostPermissions } from 'twenty-shared/utils';

import { type RoboostRecordAccessSubject } from 'src/engine/metadata-modules/role/types/roboost-record-access-maps.type';
import {
  buildRoboostRecordAccessCondition,
  isRoboostCreateAllowed,
} from 'src/engine/twenty-orm/utils/build-roboost-record-access-condition.util';

const buildSubject = (
  recipe?: (subject: RoboostRecordAccessSubject) => void,
): RoboostRecordAccessSubject => {
  const subject = {
    workspaceMemberId: '11111111-1111-1111-1111-111111111111',
    permissions: buildDefaultRoboostPermissions(),
  };

  recipe?.(subject);

  return subject;
};

const build = (
  subject: RoboostRecordAccessSubject,
  objectNameSingular: string,
  operationType: Parameters<
    typeof buildRoboostRecordAccessCondition
  >[0]['operationType'],
) =>
  buildRoboostRecordAccessCondition({
    subject,
    objectNameSingular,
    operationType,
    alias: 'company',
    schemaName: 'workspace_test',
  });

describe('buildRoboostRecordAccessCondition', () => {
  it('leaves View All open and gates Edit to their own and unassigned records', () => {
    const subject = buildSubject();

    expect(build(subject, 'company', 'select')).toEqual({ kind: 'open' });

    const edit = build(subject, 'company', 'update');

    expect(edit.kind).toBe('gated');
    expect(edit.kind === 'gated' && edit.sql).toBe(
      '(("company"."accountOwnerId" = :roboostAccessMemberId OR "company"."sdrOwnerId" = :roboostAccessMemberId) OR ("company"."accountOwnerId" IS NULL AND "company"."sdrOwnerId" IS NULL))',
    );
    expect(edit.kind === 'gated' && edit.parameters).toEqual({
      roboostAccessMemberId: subject.workspaceMemberId,
    });
  });

  it('denies Delete None and counts only the deal owner on deals', () => {
    const subject = buildSubject((draft) => {
      draft.permissions.objects.opportunity.view = {
        scope: 'TEAM',
        includeUnassigned: false,
      };
    });

    expect(build(subject, 'opportunity', 'soft-delete')).toEqual({
      kind: 'denied',
    });

    const view = build(subject, 'opportunity', 'select');

    expect(view.kind === 'gated' && view.sql).toContain(
      '"company"."ownerId" IN (SELECT "rbtm2"."workspaceMemberId" FROM "workspace_test"."teamMembership"',
    );
    expect(view.kind === 'gated' && view.sql).not.toContain(
      'customerSuccessResponsible',
    );
  });

  it('shows activities linked to a visible record or owned by the user', () => {
    const subject = buildSubject((draft) => {
      draft.permissions.objects.company.view = {
        scope: 'OWN',
        includeUnassigned: false,
      };
    });

    const view = build(subject, 'task', 'select');

    expect(view.kind).toBe('gated');
    expect(view.kind === 'gated' && view.sql).toContain(
      '"company"."createdByWorkspaceMemberId" = :roboostAccessMemberId',
    );
    expect(view.kind === 'gated' && view.sql).toContain(
      'EXISTS (SELECT 1 FROM "workspace_test"."taskTarget" "rbat"',
    );
    expect(build(buildSubject(), 'task', 'select')).toEqual({ kind: 'open' });
  });

  it('uses toggles for products and the Create switch for records', () => {
    const subject = buildSubject((draft) => {
      draft.permissions.objects.person.create = false;
    });

    expect(build(subject, 'product', 'select')).toEqual({ kind: 'open' });
    expect(build(subject, 'product', 'update')).toEqual({ kind: 'denied' });
    expect(
      isRoboostCreateAllowed({ subject, objectNameSingular: 'person' }),
    ).toBe(false);
    expect(
      isRoboostCreateAllowed({ subject, objectNameSingular: 'company' }),
    ).toBe(true);
    expect(
      isRoboostCreateAllowed({ subject, objectNameSingular: 'workflow' }),
    ).toBe(false);
  });
});
