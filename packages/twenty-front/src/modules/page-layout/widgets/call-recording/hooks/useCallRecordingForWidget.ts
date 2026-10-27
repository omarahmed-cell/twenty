import { useObjectMetadataItem } from '@/object-metadata/hooks/useObjectMetadataItem';
import { useFindOneRecord } from '@/object-record/hooks/useFindOneRecord';
import { useCallRecordingIdForWidget } from '@/page-layout/widgets/call-recording/hooks/useCallRecordingIdForWidget';
import { useCallRecordingWidgetRestriction } from '@/page-layout/widgets/call-recording/hooks/useCallRecordingWidgetRestriction';
import { type CallRecordingWidgetKind } from '@/page-layout/widgets/call-recording/types/CallRecordingWidgetKind';
import { type WidgetCallRecordingCandidate } from '@/page-layout/widgets/call-recording/types/WidgetCallRecordingCandidate';
import { type WidgetAccessDenialInfo } from '@/page-layout/widgets/types/WidgetAccessDenialInfo';
import { useCallback, useMemo } from 'react';
import {
  CoreObjectNameSingular,
  type RecordGqlFields,
} from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

const CALL_RECORDING_RECORD_FIELDS_BY_WIDGET_KIND = {
  summary: { id: true, status: true, summary: true },
  transcript: { id: true, status: true, transcript: true },
} as const satisfies Record<CallRecordingWidgetKind, RecordGqlFields>;

export const useCallRecordingForWidget = ({
  kind,
}: {
  kind: CallRecordingWidgetKind;
}): {
  callRecording: WidgetCallRecordingCandidate | undefined;
  loading: boolean;
  error: Error | undefined;
  restriction: WidgetAccessDenialInfo | undefined;
  refetchCallRecording: () => Promise<void>;
} => {
  const { restriction, isFieldRestricted } = useCallRecordingWidgetRestriction({
    requiredFieldNames: ['status', kind],
  });
  const shouldSkipQuery = isDefined(restriction);

  const {
    callRecordingId,
    targetKind,
    loading: callRecordingIdLoading,
    error: callRecordingIdError,
    refetchCallRecordingId,
  } = useCallRecordingIdForWidget({ skip: shouldSkipQuery });

  const isVideoRestricted = isFieldRestricted('video');
  const isAudioRestricted = isFieldRestricted('audio');
  const isTranscriptRestricted = isFieldRestricted('transcript');

  const { objectMetadataItem: callRecordingObjectMetadataItem } =
    useObjectMetadataItem({
      objectNameSingular: CoreObjectNameSingular.CallRecording,
    });
  // Workspaces upgraded before these fields existed do not have them yet
  const canReadField = (fieldName: string) =>
    callRecordingObjectMetadataItem.fields.some(
      (field) => field.name === fieldName,
    ) && !isFieldRestricted(fieldName);
  const canReadRecordingUrl = canReadField('recordingUrl');
  const canReadNotesUrl = canReadField('notesUrl');

  // Requesting a field the role cannot read fails the whole query.
  const recordGqlFields = useMemo<RecordGqlFields>(
    () =>
      kind === 'transcript'
        ? {
            ...CALL_RECORDING_RECORD_FIELDS_BY_WIDGET_KIND.transcript,
            ...(!isVideoRestricted && { video: true }),
            ...(!isAudioRestricted && { audio: true }),
            ...(canReadRecordingUrl && { recordingUrl: true }),
          }
        : {
            ...CALL_RECORDING_RECORD_FIELDS_BY_WIDGET_KIND.summary,
            ...(!isTranscriptRestricted && { transcript: true }),
            ...(canReadNotesUrl && { notesUrl: true }),
          },
    [
      kind,
      isVideoRestricted,
      isAudioRestricted,
      isTranscriptRestricted,
      canReadRecordingUrl,
      canReadNotesUrl,
    ],
  );

  const {
    record: callRecording,
    loading: callRecordingLoading,
    error: callRecordingError,
    refetch: refetchCallRecordingRecord,
  } = useFindOneRecord<WidgetCallRecordingCandidate>({
    objectNameSingular: CoreObjectNameSingular.CallRecording,
    objectRecordId: callRecordingId,
    recordGqlFields,
    withSoftDeleted: targetKind === 'callRecording',
    skip: shouldSkipQuery || !isDefined(callRecordingId),
  });

  const refetchCallRecording = useCallback(async () => {
    await Promise.all([
      refetchCallRecordingId(),
      isDefined(callRecordingId)
        ? refetchCallRecordingRecord()
        : Promise.resolve(),
    ]);
  }, [refetchCallRecordingRecord, refetchCallRecordingId, callRecordingId]);

  return {
    callRecording,
    loading: callRecordingIdLoading || callRecordingLoading,
    error: callRecordingIdError ?? callRecordingError,
    restriction,
    refetchCallRecording,
  };
};
