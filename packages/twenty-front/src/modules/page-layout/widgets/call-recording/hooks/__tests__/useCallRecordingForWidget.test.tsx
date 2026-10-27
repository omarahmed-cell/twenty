import { useFindOneRecord } from '@/object-record/hooks/useFindOneRecord';
import { useCallRecordingForWidget } from '@/page-layout/widgets/call-recording/hooks/useCallRecordingForWidget';
import { renderHook } from '@testing-library/react';

let restrictedFields = new Set<string>();
let callRecordingFieldNames: string[] = [];

jest.mock('@/object-metadata/hooks/useObjectMetadataItem', () => ({
  useObjectMetadataItem: () => ({
    objectMetadataItem: {
      fields: callRecordingFieldNames.map((name) => ({ name })),
    },
  }),
}));

jest.mock('@/object-record/hooks/useFindOneRecord', () => ({
  useFindOneRecord: jest.fn(() => ({ loading: false, refetch: jest.fn() })),
}));

jest.mock(
  '@/page-layout/widgets/call-recording/hooks/useCallRecordingIdForWidget',
  () => ({
    useCallRecordingIdForWidget: () => ({
      callRecordingId: 'call-recording-id',
      targetKind: 'callRecording',
      loading: false,
      refetchCallRecordingId: jest.fn(),
    }),
  }),
);

jest.mock(
  '@/page-layout/widgets/call-recording/hooks/useCallRecordingWidgetRestriction',
  () => ({
    useCallRecordingWidgetRestriction: () => ({
      restriction: undefined,
      isFieldRestricted: (fieldName: string) => restrictedFields.has(fieldName),
    }),
  }),
);

const getRequestedFields = () =>
  jest.mocked(useFindOneRecord).mock.calls.at(-1)?.[0].recordGqlFields;

describe('useCallRecordingForWidget', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    restrictedFields = new Set();
    callRecordingFieldNames = [];
  });

  it.each([
    { restricted: [], mediaFields: { video: true, audio: true } },
    { restricted: ['video'], mediaFields: { audio: true } },
    { restricted: ['audio'], mediaFields: { video: true } },
    { restricted: ['video', 'audio'], mediaFields: {} },
  ])(
    'omits restricted media fields: $restricted',
    ({ restricted, mediaFields }) => {
      restrictedFields = new Set(restricted);

      renderHook(() => useCallRecordingForWidget({ kind: 'transcript' }));

      expect(getRequestedFields()).toEqual({
        id: true,
        status: true,
        transcript: true,
        ...mediaFields,
      });
    },
  );

  it('requests the transcript but not media for the summary widget', () => {
    renderHook(() => useCallRecordingForWidget({ kind: 'summary' }));

    expect(getRequestedFields()).toEqual({
      id: true,
      status: true,
      summary: true,
      transcript: true,
    });
  });

  it('omits the transcript for the summary widget when it is restricted', () => {
    restrictedFields = new Set(['transcript']);

    renderHook(() => useCallRecordingForWidget({ kind: 'summary' }));

    expect(getRequestedFields()).toEqual({
      id: true,
      status: true,
      summary: true,
    });
  });

  it('keeps fields stable until media permissions change', () => {
    const { rerender } = renderHook(() =>
      useCallRecordingForWidget({ kind: 'transcript' }),
    );
    const initialFields = getRequestedFields();

    rerender();

    expect(getRequestedFields()).toBe(initialFields);

    restrictedFields = new Set(['video']);
    rerender();

    expect(getRequestedFields()).toEqual({
      id: true,
      status: true,
      transcript: true,
      audio: true,
    });
  });

  it('requests the recording link on the transcript and the notes link on the summary', () => {
    callRecordingFieldNames = ['recordingUrl', 'notesUrl'];

    renderHook(() => useCallRecordingForWidget({ kind: 'transcript' }));
    expect(getRequestedFields()).toEqual(
      expect.objectContaining({ recordingUrl: true }),
    );
    expect(getRequestedFields()).not.toHaveProperty('notesUrl');

    renderHook(() => useCallRecordingForWidget({ kind: 'summary' }));
    expect(getRequestedFields()).toEqual(
      expect.objectContaining({ notesUrl: true }),
    );
    expect(getRequestedFields()).not.toHaveProperty('recordingUrl');
  });

  it('omits the notes link while the workspace lacks the field', () => {
    callRecordingFieldNames = ['recordingUrl'];

    renderHook(() => useCallRecordingForWidget({ kind: 'summary' }));

    expect(getRequestedFields()).not.toHaveProperty('notesUrl');
  });

  it('omits the recording link when the role cannot read it', () => {
    callRecordingFieldNames = ['recordingUrl'];
    restrictedFields = new Set(['recordingUrl']);

    renderHook(() => useCallRecordingForWidget({ kind: 'transcript' }));

    expect(getRequestedFields()).not.toHaveProperty('recordingUrl');
  });
});
