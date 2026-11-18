import { renderHook } from '@testing-library/react';

import { useLinkedActivityAttachments } from '@/activities/files/hooks/useLinkedActivityAttachments';

jest.mock('@/object-record/hooks/useFindManyRecords', () => ({
  useFindManyRecords: jest.fn(),
}));
jest.mock('@/ui/utilities/state/jotai/hooks/useAtomStateValue', () => ({
  useAtomStateValue: jest.fn(() => []),
}));
jest.mock('@/activities/utils/getActivityTargetsFilter', () => ({
  getActivityTargetsFilter: jest.fn(() => ({
    or: [{ targetCompanyId: { eq: 'company-1' } }],
  })),
}));

const useFindManyRecordsMock = jest.requireMock(
  '@/object-record/hooks/useFindManyRecords',
).useFindManyRecords as jest.Mock;
const useAtomStateValueMock = jest.requireMock(
  '@/ui/utilities/state/jotai/hooks/useAtomStateValue',
).useAtomStateValue as jest.Mock;

const companyRecord = { id: 'company-1', targetObjectNameSingular: 'company' };

const mockRecordsByObject = (
  recordsByObject: Record<string, Record<string, unknown>[]>,
) =>
  useFindManyRecordsMock.mockImplementation(
    ({ objectNameSingular }: { objectNameSingular: string }) => ({
      records: recordsByObject[objectNameSingular] ?? [],
      loading: false,
    }),
  );

describe('useLinkedActivityAttachments', () => {
  beforeEach(() => {
    useAtomStateValueMock.mockReturnValue([
      { nameSingular: 'noteTarget', fields: [] },
      { nameSingular: 'emailTarget', fields: [] },
    ]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('labels files from linked notes and emails with their source', () => {
    mockRecordsByObject({
      noteTarget: [
        {
          id: 'nt-1',
          noteId: 'note-1',
          note: { id: 'note-1', title: 'Kickoff' },
        },
      ],
      emailTarget: [
        {
          id: 'et-1',
          emailId: 'email-1',
          email: { id: 'email-1', subject: 'Signed contract' },
        },
      ],
      attachment: [
        { id: 'a-1', targetNoteId: 'note-1', createdAt: '2026-11-01' },
        { id: 'a-2', targetEmailId: 'email-1', createdAt: '2026-11-02' },
      ],
    });

    const { result } = renderHook(() =>
      useLinkedActivityAttachments(companyRecord),
    );

    expect(result.current.linkedAttachments).toHaveLength(2);
    expect(result.current.sourceLabelByAttachmentId).toEqual({
      'a-1': 'From note: Kickoff',
      'a-2': 'From email: Signed contract',
    });
  });

  it('skips the attachment query when the record has no linked notes or emails', () => {
    mockRecordsByObject({});

    const { result } = renderHook(() =>
      useLinkedActivityAttachments(companyRecord),
    );

    const attachmentQuery = useFindManyRecordsMock.mock.calls.find(
      ([options]) => options.objectNameSingular === 'attachment',
    )?.[0];

    expect(attachmentQuery.skip).toBe(true);
    expect(result.current.linkedAttachments).toEqual([]);
  });

  it('does not query targets when the junction object has no field for the record', () => {
    useAtomStateValueMock.mockReturnValue([]);
    mockRecordsByObject({});

    renderHook(() => useLinkedActivityAttachments(companyRecord));

    const targetQueries = useFindManyRecordsMock.mock.calls.filter(
      ([options]) =>
        ['noteTarget', 'emailTarget'].includes(options.objectNameSingular),
    );

    expect(targetQueries.every(([options]) => options.skip === true)).toBe(
      true,
    );
  });
});
