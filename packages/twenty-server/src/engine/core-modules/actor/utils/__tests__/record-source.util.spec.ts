import { FieldActorSource } from 'twenty-shared/types';

import { CommonQueryRunnerExceptionCode } from 'src/engine/api/common/common-query-runners/errors/common-query-runner.exception';
import { applyRecordSourceFromCreatedBy } from 'src/engine/core-modules/actor/utils/apply-record-source-from-created-by.util';
import { assertRecordSourceNotWritten } from 'src/engine/core-modules/actor/utils/assert-record-source-not-written.util';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';

const workspace = {
  id: '20202020-1111-4111-8111-111111111111',
} as WorkspaceAuthContext['workspace'];

const SYSTEM_AUTH_CONTEXT = {
  type: 'system',
  workspace,
} as WorkspaceAuthContext;

const USER_AUTH_CONTEXT = { type: 'user', workspace } as WorkspaceAuthContext;

describe('record source utils', () => {
  it('lets the system write the record source on create and update', () => {
    for (const isUpdate of [false, true]) {
      expect(() =>
        assertRecordSourceNotWritten({
          records: [{ recordSource: FieldActorSource.EMAIL }],
          objectMetadataNameSingular: 'company',
          authContext: SYSTEM_AUTH_CONTEXT,
          isUpdate,
        }),
      ).not.toThrow();
    }
  });

  it('keeps the record source the system set instead of the createdBy source', () => {
    expect(
      applyRecordSourceFromCreatedBy({
        records: [
          {
            recordSource: FieldActorSource.EMAIL,
            createdBy: { source: FieldActorSource.SYSTEM },
          },
        ],
        authContext: SYSTEM_AUTH_CONTEXT,
      }),
    ).toEqual([
      {
        recordSource: FieldActorSource.EMAIL,
        createdBy: { source: FieldActorSource.SYSTEM },
      },
    ]);
  });

  it('accepts an empty record source on create, since it is filled from createdBy', () => {
    expect(() =>
      assertRecordSourceNotWritten({
        records: [{ recordSource: null }],
        objectMetadataNameSingular: 'company',
        authContext: USER_AUTH_CONTEXT,
        isUpdate: false,
      }),
    ).not.toThrow();
  });

  it('leaves a custom recordSource field on other objects writable', () => {
    expect(() =>
      assertRecordSourceNotWritten({
        records: [{ recordSource: 'Referral' }],
        objectMetadataNameSingular: 'invoice',
        authContext: USER_AUTH_CONTEXT,
        isUpdate: true,
      }),
    ).not.toThrow();
  });

  it('refuses a record source a user sends', () => {
    expect(() =>
      assertRecordSourceNotWritten({
        records: [{ recordSource: FieldActorSource.API }],
        objectMetadataNameSingular: 'note',
        authContext: USER_AUTH_CONTEXT,
        isUpdate: false,
      }),
    ).toThrow(
      expect.objectContaining({
        code: CommonQueryRunnerExceptionCode.BAD_REQUEST,
      }),
    );
  });
});
