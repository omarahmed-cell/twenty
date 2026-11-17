import { buildStandardObjectBaseFields } from '@/metadata/utils/internal/build-standard-object-base-fields.util';
import { TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER } from '@/application/constants/TwentyStandardApplicationUniversalIdentifier';
import { getSystemRelationFieldUniversalIdentifier } from '@/application/deterministic-identifier/get-system-relation-field-universal-identifier.util';
import { STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS } from '@/metadata/constants/standard-object-universal-identifiers.constant';
import { buildStandardObjectSystemFields } from '@/metadata/utils/internal/build-standard-object-system-fields.util';

// Never mutate an existing universal identifier, and delete one only rarely.
// System field ids come from buildStandardObjectSystemFields and getSystemRelationFieldUniversalIdentifier;
// name is a default field, not a system one, and keeps its hardcoded id.
export const STANDARD_OBJECT_FIELDS = {
  agentChatThread: {
    ...buildStandardObjectBaseFields(
      STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.agentChatThread,
    ),
    archivedAt: { universalIdentifier: 'b42eaf6f-240f-41ef-af61-51d5ac9cde7d' },
    workspaceMember: {
      universalIdentifier: '6f3ed3b5-0642-4a2a-9558-98376adb60f4',
    },
    title: { universalIdentifier: '9283c05e-127c-46ec-82e9-6424a7c0a2f1' },
    totalInputTokens: {
      universalIdentifier: '2705f4af-24b8-4660-a8a8-8eff689298d1',
    },
    totalOutputTokens: {
      universalIdentifier: '77790c9c-0e91-4142-8482-d70576b8093b',
    },
    contextWindowTokens: {
      universalIdentifier: 'c58dc0b0-bd0e-4ee2-8a80-615a2d8fc7c8',
    },
    conversationSize: {
      universalIdentifier: 'f34617ff-a0de-4116-a5ad-7cfd1d0c6d5a',
    },
    totalInputCredits: {
      universalIdentifier: '3c0a9aa3-01b8-4191-bce4-dc9e77e2fe7a',
    },
    totalOutputCredits: {
      universalIdentifier: '40b2f6e5-eced-44f7-b391-0278ea7df7ef',
    },
    totalCacheReadTokens: {
      universalIdentifier: '494abfc8-d2f6-452c-913e-1f55d148f47f',
    },
    totalCacheCreationTokens: {
      universalIdentifier: '68bdb978-5ccb-4f64-9df2-8203b100c76a',
    },
    activeStreamId: {
      universalIdentifier: 'bcead20f-75b3-45be-92b9-ea7ec4bddfcd',
    },
    pendingQuestionMessageId: {
      universalIdentifier: '51a9b421-7d90-4a59-9712-036ea9721e65',
    },
    turns: { universalIdentifier: 'd5c88fbc-d318-4ee1-b70a-751a925bef5b' },
    messages: { universalIdentifier: '5c851a60-e5d9-4b1e-9926-c2eab6fc9e62' },
    attachments: {
      universalIdentifier: getSystemRelationFieldUniversalIdentifier({
        applicationUniversalIdentifier:
          TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.agentChatThread,
        relationTargetObjectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.attachment,
      }),
    },
    recordTargets: {
      universalIdentifier: '5b37eceb-2992-4d27-9897-14af3e3ce9b2',
    },
    participants: {
      universalIdentifier: '2ede85e4-216b-4308-8556-b045971414e7',
    },
    assignee: {
      universalIdentifier: 'e77858ef-4b01-4a32-b921-8b88b1fd3020',
    },
    lastActivityAt: {
      universalIdentifier: 'b3847509-8e98-4038-88de-dd891767d6fc',
    },
    lastMessageText: {
      universalIdentifier: '1c16eaef-172b-4778-b14b-f302bc6021e4',
    },
    lastMessageSenderWorkspaceMemberId: {
      universalIdentifier: '5c3611a7-7324-472e-9b43-4c7779e5e7cf',
    },
    writerWorkspaceMemberIds: {
      universalIdentifier: 'c8fe2406-ad9c-4274-aeb5-9beb74d4b353',
    },
  },
  agentChatThreadParticipant: {
    ...buildStandardObjectBaseFields(
      STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.agentChatThreadParticipant,
    ),
    thread: { universalIdentifier: '7d0282a5-11ce-4da8-a165-30909ffdf383' },
    workspaceMember: {
      universalIdentifier: '4345764d-878b-4a3a-b1c9-822378f868e6',
    },
    lastReadAt: { universalIdentifier: '7e3a8319-c127-4c4f-add4-6feac37ea555' },
    archivedAt: { universalIdentifier: 'ee092c9d-f27e-4fbc-8dad-9ec950936216' },
    snoozedUntil: {
      universalIdentifier: '65bc5785-877d-4363-b65c-95175ba20fd0',
    },
    isSubscribed: {
      universalIdentifier: '146b1d5e-6603-4493-944b-c3bd2817569b',
    },
    lastMentionedAt: {
      universalIdentifier: '52a54602-633f-496a-966a-9a70437fa887',
    },
  },
  agentChatThreadTarget: {
    target: { universalIdentifier: '2c4cc537-39a2-4df9-81a1-dda26eb19658' },
    ...buildStandardObjectBaseFields(
      STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.agentChatThreadTarget,
    ),
    thread: { universalIdentifier: '54664c16-3c3d-4d5e-904c-59e1b3707cfb' },
    targetPerson: {
      universalIdentifier: getSystemRelationFieldUniversalIdentifier({
        applicationUniversalIdentifier:
          TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.agentChatThreadTarget,
        relationTargetObjectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person,
      }),
    },
    targetCompany: {
      universalIdentifier: getSystemRelationFieldUniversalIdentifier({
        applicationUniversalIdentifier:
          TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.agentChatThreadTarget,
        relationTargetObjectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.company,
      }),
    },
    targetOpportunity: {
      universalIdentifier: getSystemRelationFieldUniversalIdentifier({
        applicationUniversalIdentifier:
          TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.agentChatThreadTarget,
        relationTargetObjectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity,
      }),
    },
  },
  agentTurn: {
    ...buildStandardObjectBaseFields(
      STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.agentTurn,
    ),
    agentId: { universalIdentifier: '4ac55a9a-95e8-4fd9-8c03-47ee3b618ae7' },
    thread: { universalIdentifier: '4e9b4f1f-c1bb-42d0-bb38-eb2b2f830e64' },
    messages: { universalIdentifier: '737c3559-ea1a-4269-aea4-e672b17afbb1' },
    status: { universalIdentifier: 'c17a4d49-f4f5-40e2-b084-11c5c4bae431' },
    error: { universalIdentifier: 'b0ed90f6-5953-4c85-aff8-407a28ec8cc7' },
    startedAt: { universalIdentifier: '578977d7-b0d9-48d1-83f7-29ad6215a6f0' },
    endedAt: { universalIdentifier: '2b13f528-738b-402c-a033-7bbb0cce73a4' },
    modelId: { universalIdentifier: 'b1e1c27b-03dc-40b1-8052-4474c15b8233' },
    inputTokens: {
      universalIdentifier: '0e419986-4255-4858-b252-e6a161d55f58',
    },
    outputTokens: {
      universalIdentifier: '3e7f5fb8-f9cf-45b2-b1a7-b36c1e8ff2fd',
    },
    cacheReadTokens: {
      universalIdentifier: 'c2bcbbf5-81ce-4679-8f08-f6a3cc00569c',
    },
    cacheCreationTokens: {
      universalIdentifier: '4d9feae2-2a80-43b2-965d-8ad40f129503',
    },
    inputCredits: {
      universalIdentifier: '740456a7-c0be-4bc9-8429-52dc3e3a3707',
    },
    outputCredits: {
      universalIdentifier: '1ca5da82-b797-43a8-a2ee-d1a062a24ca5',
    },
    createdBy: { universalIdentifier: 'c3d5e8a2-fde8-452d-a74d-04436aaf17bc' },
  },
  agentMessage: {
    ...buildStandardObjectBaseFields(
      STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.agentMessage,
    ),
    agentId: { universalIdentifier: '880a91ad-4ab1-4067-87f6-970a53aa2234' },
    senderWorkspaceMember: {
      universalIdentifier: '69bea8e1-451d-4c3c-9d34-505b5a67e06e',
    },
    senderApplicationId: {
      universalIdentifier: 'd204d45a-6ccc-40cb-8281-b6ed635c247b',
    },
    role: { universalIdentifier: '5dc985f3-edad-4ebf-9844-b34ca686855b' },
    status: { universalIdentifier: '3845ccfa-9394-4cb9-a75c-4ca704414b83' },
    processedAt: {
      universalIdentifier: 'b1a72274-095e-41f6-95d3-e5b407ff3f0b',
    },
    thread: { universalIdentifier: '48ea202f-ed6d-4ad9-8c9b-71a419b96237' },
    turn: { universalIdentifier: 'b36513fc-ffaf-4e99-8686-b1aefca70b76' },
    parts: { universalIdentifier: '017e4930-118d-4624-8ce4-4e574f89f86d' },
    reactions: { universalIdentifier: '945e1e83-af08-45c9-8d6c-fb49f1e4a21c' },
  },
  agentMessageReaction: {
    ...buildStandardObjectBaseFields(
      STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.agentMessageReaction,
    ),
    message: { universalIdentifier: '18fec29f-89bd-4f33-8b80-f7a83a9a2e31' },
    workspaceMember: {
      universalIdentifier: '77265b6b-b634-426a-8972-8601947ca6ad',
    },
    emoji: { universalIdentifier: '88eeecdd-08a7-4744-bdd1-86b7f4a14394' },
  },
  agentMessagePart: {
    ...buildStandardObjectBaseFields(
      STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.agentMessagePart,
    ),
    orderIndex: { universalIdentifier: 'd2b3e277-380c-4133-977d-f23f8092aebc' },
    type: { universalIdentifier: '16a59a7f-dc43-4483-84be-19c8ffd6c7a7' },
    textContent: {
      universalIdentifier: 'd66ed60a-6c09-4427-a62a-1735e31b02de',
    },
    reasoningContent: {
      universalIdentifier: '34c24bb6-a34a-4373-b8b3-8be22fea3325',
    },
    toolName: { universalIdentifier: 'ed705120-349b-4fce-afd4-15b8cab0df07' },
    toolCallId: { universalIdentifier: '151b6115-7071-4a1b-920d-43818907c69b' },
    toolInput: { universalIdentifier: '14476bb3-8b73-4428-b138-37bd7931e1d6' },
    toolOutput: { universalIdentifier: '5fe8ca78-52ab-466f-8fe7-cbfa618c5463' },
    state: { universalIdentifier: '6fa1fb8e-2335-4b48-838b-dd227958cab2' },
    providerExecuted: {
      universalIdentifier: 'cbfee5eb-748e-4296-88be-ddc13393d88d',
    },
    errorMessage: {
      universalIdentifier: 'f910bb7a-d1f8-4893-ad97-40342af62c21',
    },
    errorDetails: {
      universalIdentifier: 'b9e6f2cf-b2ce-44fe-9507-d47805582654',
    },
    sourceUrlSourceId: {
      universalIdentifier: 'cb66237e-f48a-4858-a882-2330978dcfdc',
    },
    sourceUrlUrl: {
      universalIdentifier: '31a94d35-03f2-41b7-aa2b-5615f286d2bb',
    },
    sourceUrlTitle: {
      universalIdentifier: 'ad17f626-17fc-45e0-a09f-a61790a0f906',
    },
    sourceDocumentSourceId: {
      universalIdentifier: 'a2afae35-4e3e-4fe5-bc96-9bb654adb810',
    },
    sourceDocumentMediaType: {
      universalIdentifier: '44a4e4f9-d005-493d-9832-3a217730eaf8',
    },
    sourceDocumentTitle: {
      universalIdentifier: '2951cfaa-d05e-47be-af17-c7af4685e4c0',
    },
    sourceDocumentFilename: {
      universalIdentifier: '2cdea0b3-0a4d-4fa8-b713-c0fbf0e0a2d4',
    },
    fileFilename: {
      universalIdentifier: 'e908f82c-88d0-477b-a5f2-1798fc4090b8',
    },
    fileId: { universalIdentifier: '060b366e-bb3d-40b5-83e6-166629a40444' },
    providerMetadata: {
      universalIdentifier: '689d988e-3883-4ab6-9cf3-c36a3002f865',
    },
    message: { universalIdentifier: 'efd41407-a49d-4a3a-97b4-94fd180e7652' },
  },
  campaignDelivery: {
    ...buildStandardObjectBaseFields(
      STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.campaignDelivery,
    ),
    campaignId: { universalIdentifier: '5b3b48cd-71ec-4ff6-bd4f-8ea99965d611' },
    personId: { universalIdentifier: 'd12ac3bc-7d2c-4317-9c80-663e58ffbea2' },
    recipientEmail: {
      universalIdentifier: '28e61664-054b-4b41-b33b-d06b2fc7618f',
    },
    state: { universalIdentifier: '668eb863-852e-4846-b3f6-f74fc5d25cf9' },
    skipReason: { universalIdentifier: '86e995b9-467f-4570-a8f8-a647772e0944' },
    failureReason: {
      universalIdentifier: '5a080f14-de17-41a8-a2d7-e9287628db30',
    },
    claimToken: { universalIdentifier: '66b78eb0-7a53-4ad6-929a-156183490eb3' },
    claimExpiresAt: {
      universalIdentifier: 'ba84a4ba-65ca-43dd-b72c-4b0f2f5b2f44',
    },
    providerMessageId: {
      universalIdentifier: 'a560bd1a-716b-4fc3-b931-a34ff46bca6f',
    },
    sentAt: { universalIdentifier: 'c4db7935-d927-49bd-80bd-01a6f39685a4' },
    deliveredAt: {
      universalIdentifier: '2cba1c4e-df5c-496d-8d0d-9f43fc371b5f',
    },
    bouncedAt: { universalIdentifier: 'c3db41d4-3c48-4110-b3b3-a68cb82a1a78' },
    complainedAt: {
      universalIdentifier: '322301c5-62d6-428a-bc33-89f8eee75a47',
    },
    rejectedAt: { universalIdentifier: 'de3599c8-d91b-42fb-a76f-34cd1826dd04' },
    renderingFailedAt: {
      universalIdentifier: 'eca2b84e-a8d0-4641-bf16-48005e1826bd',
    },
  },
  messageSuppression: {
    ...buildStandardObjectBaseFields(
      STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.messageSuppression,
    ),
    emailAddress: {
      universalIdentifier: 'd44cd615-c3ff-4ac5-a0cc-bfbda700df8e',
    },
    reason: { universalIdentifier: '2829a0be-f463-423c-810f-abf7b7a38454' },
    source: { universalIdentifier: 'c0111315-babb-44ab-b4bb-8393ca7a4f98' },
    providerEventId: {
      universalIdentifier: '4959b0da-3ce2-42f7-8cc0-36fd20799a20',
    },
    unsubscribeTopicId: {
      universalIdentifier: '42c74315-d6d3-47f7-8f72-d7d40e41cc84',
    },
  },
  timelineActivity: {
    target: { universalIdentifier: '20202020-9a2b-4c3d-a4e5-f6a7b8c9d0e1' },
    ...buildStandardObjectSystemFields(
      STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.timelineActivity,
    ),
    timelineActivityTypeId: {
      universalIdentifier: '20202020-e5f8-4839-9dcf-781e260624ee',
    },
    timelineActivityTypeSnapshot: {
      universalIdentifier: '20202020-e006-493a-9b07-f2a768a204ca',
    },
    happensAt: {
      universalIdentifier: '20202020-9526-4993-b339-c4318c4d39f0',
    },
    properties: {
      universalIdentifier: '20202020-f142-4b04-b91b-6a2b4af3bf11',
    },
    workspaceMember: {
      universalIdentifier: '20202020-af23-4479-9a30-868edc474b36',
    },
    targetPerson: {
      universalIdentifier: getSystemRelationFieldUniversalIdentifier({
        applicationUniversalIdentifier:
          TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.timelineActivity,
        relationTargetObjectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person,
      }),
    },
    targetCompany: {
      universalIdentifier: getSystemRelationFieldUniversalIdentifier({
        applicationUniversalIdentifier:
          TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.timelineActivity,
        relationTargetObjectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.company,
      }),
    },
    targetOpportunity: {
      universalIdentifier: getSystemRelationFieldUniversalIdentifier({
        applicationUniversalIdentifier:
          TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.timelineActivity,
        relationTargetObjectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity,
      }),
    },
    targetTask: {
      universalIdentifier: getSystemRelationFieldUniversalIdentifier({
        applicationUniversalIdentifier:
          TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.timelineActivity,
        relationTargetObjectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.task,
      }),
    },
    targetNote: {
      universalIdentifier: getSystemRelationFieldUniversalIdentifier({
        applicationUniversalIdentifier:
          TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.timelineActivity,
        relationTargetObjectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.note,
      }),
    },
    targetWorkflow: {
      universalIdentifier: getSystemRelationFieldUniversalIdentifier({
        applicationUniversalIdentifier:
          TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.timelineActivity,
        relationTargetObjectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workflow,
      }),
    },
    targetWorkflowVersion: {
      universalIdentifier: getSystemRelationFieldUniversalIdentifier({
        applicationUniversalIdentifier:
          TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.timelineActivity,
        relationTargetObjectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workflowVersion,
      }),
    },
    targetWorkflowRun: {
      universalIdentifier: getSystemRelationFieldUniversalIdentifier({
        applicationUniversalIdentifier:
          TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.timelineActivity,
        relationTargetObjectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workflowRun,
      }),
    },
    targetDashboard: {
      universalIdentifier: getSystemRelationFieldUniversalIdentifier({
        applicationUniversalIdentifier:
          TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.timelineActivity,
        relationTargetObjectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.dashboard,
      }),
    },
    targetMessageList: {
      universalIdentifier: getSystemRelationFieldUniversalIdentifier({
        applicationUniversalIdentifier:
          TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.timelineActivity,
        relationTargetObjectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.messageList,
      }),
    },
    targetMessageCampaign: {
      universalIdentifier: getSystemRelationFieldUniversalIdentifier({
        applicationUniversalIdentifier:
          TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.timelineActivity,
        relationTargetObjectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.messageCampaign,
      }),
    },
    targetService: {
      universalIdentifier: getSystemRelationFieldUniversalIdentifier({
        applicationUniversalIdentifier:
          TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.timelineActivity,
        relationTargetObjectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.service,
      }),
    },
    targetCall: {
      universalIdentifier: getSystemRelationFieldUniversalIdentifier({
        applicationUniversalIdentifier:
          TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.timelineActivity,
        relationTargetObjectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.call,
      }),
    },
    linkedRecordCachedName: {
      universalIdentifier: '20202020-cfdb-4bef-bbce-a29f41230934',
    },
    linkedRecordId: {
      universalIdentifier: '20202020-2e0e-48c0-b445-ee6c1e61687d',
    },
    linkedObjectMetadataId: {
      universalIdentifier: '20202020-c595-449d-9f89-562758c9ee69',
    },
    targetCommunication: {
      universalIdentifier: getSystemRelationFieldUniversalIdentifier({
        applicationUniversalIdentifier:
          TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.timelineActivity,
        relationTargetObjectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.communication,
      }),
    },
    targetEmail: {
      universalIdentifier: getSystemRelationFieldUniversalIdentifier({
        applicationUniversalIdentifier:
          TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.timelineActivity,
        relationTargetObjectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.email,
      }),
    },
  },
  attachment: {
    target: { universalIdentifier: '20202020-f634-435d-ab8d-e1168b375c69' },
    ...buildStandardObjectSystemFields(
      STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.attachment,
    ),
    name: { universalIdentifier: '20202020-87a5-48f8-bbf7-ade388825a57' },
    file: { universalIdentifier: '20202020-15db-460e-8166-c7b5d87ad4be' },
    //deprecated
    fullPath: { universalIdentifier: '20202020-0d19-453d-8e8d-fbcda8ca3747' },
    //deprecated
    fileCategory: {
      universalIdentifier: '20202020-8c3f-4d9e-9a1b-2e5f7a8c9d0e',
    },
    targetTask: {
      universalIdentifier: getSystemRelationFieldUniversalIdentifier({
        applicationUniversalIdentifier:
          TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.attachment,
        relationTargetObjectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.task,
      }),
    },
    targetNote: {
      universalIdentifier: getSystemRelationFieldUniversalIdentifier({
        applicationUniversalIdentifier:
          TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.attachment,
        relationTargetObjectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.note,
      }),
    },
    targetPerson: {
      universalIdentifier: getSystemRelationFieldUniversalIdentifier({
        applicationUniversalIdentifier:
          TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.attachment,
        relationTargetObjectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person,
      }),
    },
    targetCompany: {
      universalIdentifier: getSystemRelationFieldUniversalIdentifier({
        applicationUniversalIdentifier:
          TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.attachment,
        relationTargetObjectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.company,
      }),
    },
    targetOpportunity: {
      universalIdentifier: getSystemRelationFieldUniversalIdentifier({
        applicationUniversalIdentifier:
          TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.attachment,
        relationTargetObjectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity,
      }),
    },
    targetDashboard: {
      universalIdentifier: getSystemRelationFieldUniversalIdentifier({
        applicationUniversalIdentifier:
          TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.attachment,
        relationTargetObjectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.dashboard,
      }),
    },
    targetWorkflow: {
      universalIdentifier: getSystemRelationFieldUniversalIdentifier({
        applicationUniversalIdentifier:
          TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.attachment,
        relationTargetObjectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workflow,
      }),
    },
    targetAgentChatThread: {
      universalIdentifier: getSystemRelationFieldUniversalIdentifier({
        applicationUniversalIdentifier:
          TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.attachment,
        relationTargetObjectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.agentChatThread,
      }),
    },
    targetCall: {
      universalIdentifier: getSystemRelationFieldUniversalIdentifier({
        applicationUniversalIdentifier:
          TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.attachment,
        relationTargetObjectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.call,
      }),
    },
    targetCommunication: {
      universalIdentifier: getSystemRelationFieldUniversalIdentifier({
        applicationUniversalIdentifier:
          TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.attachment,
        relationTargetObjectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.communication,
      }),
    },
    targetEmail: {
      universalIdentifier: getSystemRelationFieldUniversalIdentifier({
        applicationUniversalIdentifier:
          TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.attachment,
        relationTargetObjectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.email,
      }),
    },
  },
  blocklist: {
    ...buildStandardObjectSystemFields(
      STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.blocklist,
    ),
    handle: { universalIdentifier: '20202020-eef3-44ed-aa32-4641d7fd4a3e' },
    scope: { universalIdentifier: '20202020-1a5f-4c9e-9b3e-7d2a6f4c8e11' },
    workspaceMember: {
      universalIdentifier: '20202020-548d-4084-a947-fa20a39f7c06',
    },
  },
  calendarChannelEventAssociation: {
    ...buildStandardObjectSystemFields(
      STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.calendarChannelEventAssociation,
    ),
    calendarChannelId: {
      universalIdentifier: '20202020-93ee-4da4-8d58-0282c4a9cb7d',
    },
    calendarEvent: {
      universalIdentifier: '20202020-5aa5-437e-bb86-f42d457783e3',
    },
    eventExternalId: {
      universalIdentifier: '20202020-9ec8-48bb-b279-21d0734a75a1',
    },
    recurringEventExternalId: {
      universalIdentifier: '20202020-c58f-4c69-9bf8-9518fa31aa50',
    },
  },
  calendarEventParticipant: {
    ...buildStandardObjectSystemFields(
      STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.calendarEventParticipant,
    ),
    calendarEvent: {
      universalIdentifier: '20202020-fe3a-401c-b889-af4f4657a861',
    },
    handle: {
      universalIdentifier: '20202020-8692-4580-8210-9e09cbd031a7',
    },
    displayName: {
      universalIdentifier: '20202020-ee1e-4f9f-8ac1-5c0b2f69691e',
    },
    isOrganizer: {
      universalIdentifier: '20202020-66e7-4e00-9e06-d06c92650580',
    },
    responseStatus: {
      universalIdentifier: '20202020-cec0-4be8-8fba-c366abc23147',
    },
    person: {
      universalIdentifier: '20202020-5761-4842-8186-e1898ef93966',
    },
    workspaceMember: {
      universalIdentifier: '20202020-20e4-4591-93ed-aeb17a4dcbd2',
    },
  },
  calendarEvent: {
    ...buildStandardObjectSystemFields(
      STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.calendarEvent,
    ),
    recordSource: { universalIdentifier: '7e09807c-ad83-4ad2-b613-4b68fde655d7' },
    title: { universalIdentifier: '20202020-080e-49d1-b21d-9702a7e2525c' },
    recordedVideo: {
      universalIdentifier: '639ca583-524f-4610-ab0c-2a37c907e8d4',
    },
    transcript: { universalIdentifier: '95c36fae-ed54-475b-8403-2242a6ceab5c' },
    isCanceled: {
      universalIdentifier: '20202020-335b-4e04-b470-43b84b64863c',
    },
    isFullDay: {
      universalIdentifier: '20202020-551c-402c-bb6d-dfe9efe86bcb',
    },
    startsAt: {
      universalIdentifier: '20202020-2c57-4c75-93c5-2ac950a6ed67',
    },
    endsAt: { universalIdentifier: '20202020-2554-4ee1-a617-17907f6bab21' },
    externalCreatedAt: {
      universalIdentifier: '20202020-9f03-4058-a898-346c62181599',
    },
    externalUpdatedAt: {
      universalIdentifier: '20202020-b355-4c18-8825-ef42c8a5a755',
    },
    description: {
      universalIdentifier: '20202020-52c4-4266-a98f-e90af0b4d271',
    },
    location: {
      universalIdentifier: '20202020-641a-4ffe-960d-c3c186d95b17',
    },
    iCalUid: {
      universalIdentifier: '20202020-f24b-45f4-b6a3-d2f9fcb98714',
    },
    conferenceSolution: {
      universalIdentifier: '20202020-1c3f-4b5a-b526-5411a82179eb',
    },
    conferenceLink: {
      universalIdentifier: '20202020-35da-43ef-9ca0-e936e9dc237b',
    },
    locationType: {
      universalIdentifier: 'c193fff6-70c9-48fe-8376-e1b7c7c9e883',
    },
    meetingType: {
      universalIdentifier: '1a6e76f5-923f-42f1-9740-1404c7c1ff45',
    },
    meetingOutcome: {
      universalIdentifier: '60b96e80-49a2-484f-b92b-6db0759e4538',
    },
    assignedTo: {
      universalIdentifier: 'd95a25ce-08f6-471a-b0ff-028cdb8cb682',
    },
    hasMeetingTranscript: {
      universalIdentifier: 'ccf62e53-243c-4901-8c87-e28d7cf5292d',
    },
    hubspotHasTranscript: {
      universalIdentifier: '356e5de7-fcfb-4701-8a3a-183ad6943735',
    },
    meetingSource: {
      universalIdentifier: '2879185a-46ca-47ef-8ada-8f2890c4c28e',
    },
    calendarChannelEventAssociations: {
      universalIdentifier: '20202020-bdf8-4572-a2cc-ecbb6bcc3a02',
    },
    calendarEventParticipants: {
      universalIdentifier: '20202020-e07e-4ccb-88f5-6f3d00458eec',
    },
    calendarEventTargets: {
      universalIdentifier: '2b4a0785-3462-485f-b1a8-79ebb2078eab',
    },
    callRecordings: {
      universalIdentifier: '48d6d151-18e2-4111-b405-d85fb9d860d8',
    },
  },
  calendarEventTarget: {
    target: { universalIdentifier: '676e9f68-7b5c-41e6-b46d-2fb9527b7051' },
    ...buildStandardObjectSystemFields(
      STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.calendarEventTarget,
    ),
    calendarEvent: {
      universalIdentifier: 'a47824b0-0e64-4c1f-bbad-ce45209d119b',
    },
    isAutomaticallyAssigned: {
      universalIdentifier: 'b6374fed-9cf2-49ef-b45a-1d6814c16264',
    },
    isManuallyAssigned: {
      universalIdentifier: '6afbd5b8-25b5-4c04-82e5-281e6f90f453',
    },
    targetPerson: {
      universalIdentifier: getSystemRelationFieldUniversalIdentifier({
        applicationUniversalIdentifier:
          TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.calendarEventTarget,
        relationTargetObjectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person,
      }),
    },
    targetCompany: {
      universalIdentifier: getSystemRelationFieldUniversalIdentifier({
        applicationUniversalIdentifier:
          TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.calendarEventTarget,
        relationTargetObjectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.company,
      }),
    },
    targetOpportunity: {
      universalIdentifier: getSystemRelationFieldUniversalIdentifier({
        applicationUniversalIdentifier:
          TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.calendarEventTarget,
        relationTargetObjectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity,
      }),
    },
    targetService: {
      universalIdentifier: getSystemRelationFieldUniversalIdentifier({
        applicationUniversalIdentifier:
          TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.calendarEventTarget,
        relationTargetObjectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.service,
      }),
    },
  },
  call: {
    ...buildStandardObjectSystemFields(
      STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.call,
    ),
    recordSource: { universalIdentifier: '6f278322-415c-4ae4-8bbe-bfaf244ff532' },
    title: { universalIdentifier: 'eb2ab184-bfc6-44da-ba32-76d21ea5e29b' },
    bodyV2: { universalIdentifier: 'a461c678-dac1-4914-8816-eb31ae67c1d3' },
    direction: {
      universalIdentifier: '7f9ca46f-95e3-455d-9514-d7478cac6353',
    },
    outcome: {
      universalIdentifier: '81e9bf18-915e-455e-87e9-d581015b714a',
    },
    timelineActivities: {
      universalIdentifier: getSystemRelationFieldUniversalIdentifier({
        applicationUniversalIdentifier:
          TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
        objectUniversalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.call,
        relationTargetObjectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.timelineActivity,
      }),
    },
    callTargets: {
      universalIdentifier: '844488f7-3e24-465c-9f3f-e33b1df0c0e0',
    },
    attachments: {
      universalIdentifier: getSystemRelationFieldUniversalIdentifier({
        applicationUniversalIdentifier:
          TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
        objectUniversalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.call,
        relationTargetObjectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.attachment,
      }),
    },
  },
  callTarget: {
    target: { universalIdentifier: '46870d3c-505a-4d7a-9251-55c53328934b' },
    ...buildStandardObjectSystemFields(
      STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.callTarget,
    ),
    call: { universalIdentifier: 'bd467504-ba13-474e-a29a-14605180a6a0' },
    targetPerson: {
      universalIdentifier: getSystemRelationFieldUniversalIdentifier({
        applicationUniversalIdentifier:
          TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.callTarget,
        relationTargetObjectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person,
      }),
    },
    targetCompany: {
      universalIdentifier: getSystemRelationFieldUniversalIdentifier({
        applicationUniversalIdentifier:
          TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.callTarget,
        relationTargetObjectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.company,
      }),
    },
    targetOpportunity: {
      universalIdentifier: getSystemRelationFieldUniversalIdentifier({
        applicationUniversalIdentifier:
          TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.callTarget,
        relationTargetObjectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity,
      }),
    },
    targetService: {
      universalIdentifier: getSystemRelationFieldUniversalIdentifier({
        applicationUniversalIdentifier:
          TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.callTarget,
        relationTargetObjectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.service,
      }),
    },
  },
  communication: {
    ...buildStandardObjectSystemFields(
      STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.communication,
    ),
    recordSource: { universalIdentifier: '4d608fda-2c1c-43f1-9a53-4fb57be781c7' },
    title: { universalIdentifier: '2258a1fe-6b0a-48a3-ad97-288d009c6487' },
    bodyV2: { universalIdentifier: '02596eef-47b8-477e-8f87-97a008494000' },
    direction: {
      universalIdentifier: '853e3658-b6ff-4f2a-852c-6f4d57b691bd',
    },
    channelType: {
      universalIdentifier: '99cdaae6-036f-4faf-b8e7-b2ab901426b0',
    },
    timelineActivities: {
      universalIdentifier: getSystemRelationFieldUniversalIdentifier({
        applicationUniversalIdentifier:
          TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.communication,
        relationTargetObjectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.timelineActivity,
      }),
    },
    communicationTargets: {
      universalIdentifier: '9daf74b5-c351-4c5f-ae8d-1f5ab3f5d838',
    },
    attachments: {
      universalIdentifier: getSystemRelationFieldUniversalIdentifier({
        applicationUniversalIdentifier:
          TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.communication,
        relationTargetObjectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.attachment,
      }),
    },
  },
  email: {
    ...buildStandardObjectSystemFields(
      STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.email,
    ),
    recordSource: { universalIdentifier: '16cc3939-c650-4e9e-81ad-d563dafb9242' },
    subject: { universalIdentifier: 'bbf960c6-04b2-450e-a6ae-0c2b677a009b' },
    bodyV2: { universalIdentifier: 'ee124fa0-9a92-47cf-8062-2d1b9f4696d8' },
    direction: {
      universalIdentifier: '3e2902b2-63f4-495f-af23-1f0892976a51',
    },
    from: { universalIdentifier: '9e407c1d-14e6-4c14-8c7f-dd99f6217107' },
    to: { universalIdentifier: '9dc9064d-6cc0-4f0e-b2a8-7948cec95b7c' },
    sentAt: { universalIdentifier: 'd00aa002-2139-434b-9fdf-067fc4a532b3' },
    status: { universalIdentifier: '37d2dc28-0111-45c3-85c6-5aa3b3d3f690' },
    hubspotId: { universalIdentifier: '5da1a434-6172-4a4e-90f7-7902511f297c' },
    timelineActivities: {
      universalIdentifier: getSystemRelationFieldUniversalIdentifier({
        applicationUniversalIdentifier:
          TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
        objectUniversalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.email,
        relationTargetObjectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.timelineActivity,
      }),
    },
    emailTargets: {
      universalIdentifier: '4beb80e5-a610-4c8c-bf53-34ab7d21f3ac',
    },
    attachments: {
      universalIdentifier: getSystemRelationFieldUniversalIdentifier({
        applicationUniversalIdentifier:
          TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
        objectUniversalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.email,
        relationTargetObjectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.attachment,
      }),
    },
  },
  communicationTarget: {
    target: { universalIdentifier: 'd8345104-c199-4f12-befb-79cf41b3c12e' },
    ...buildStandardObjectSystemFields(
      STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.communicationTarget,
    ),
    communication: {
      universalIdentifier: '73be964f-1d92-419f-ada7-94e87f1c454c',
    },
    targetPerson: {
      universalIdentifier: getSystemRelationFieldUniversalIdentifier({
        applicationUniversalIdentifier:
          TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.communicationTarget,
        relationTargetObjectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person,
      }),
    },
    targetCompany: {
      universalIdentifier: getSystemRelationFieldUniversalIdentifier({
        applicationUniversalIdentifier:
          TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.communicationTarget,
        relationTargetObjectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.company,
      }),
    },
    targetOpportunity: {
      universalIdentifier: getSystemRelationFieldUniversalIdentifier({
        applicationUniversalIdentifier:
          TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.communicationTarget,
        relationTargetObjectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity,
      }),
    },
    targetService: {
      universalIdentifier: getSystemRelationFieldUniversalIdentifier({
        applicationUniversalIdentifier:
          TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.communicationTarget,
        relationTargetObjectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.service,
      }),
    },
  },
  emailTarget: {
    target: { universalIdentifier: 'b83d19e1-0655-41fa-a7d7-f3230821658e' },
    ...buildStandardObjectSystemFields(
      STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.emailTarget,
    ),
    email: {
      universalIdentifier: '944ad6a9-aa3c-4296-81c7-64843d370a06',
    },
    targetPerson: {
      universalIdentifier: getSystemRelationFieldUniversalIdentifier({
        applicationUniversalIdentifier:
          TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.emailTarget,
        relationTargetObjectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person,
      }),
    },
    targetCompany: {
      universalIdentifier: getSystemRelationFieldUniversalIdentifier({
        applicationUniversalIdentifier:
          TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.emailTarget,
        relationTargetObjectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.company,
      }),
    },
    targetOpportunity: {
      universalIdentifier: getSystemRelationFieldUniversalIdentifier({
        applicationUniversalIdentifier:
          TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.emailTarget,
        relationTargetObjectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity,
      }),
    },
    targetService: {
      universalIdentifier: getSystemRelationFieldUniversalIdentifier({
        applicationUniversalIdentifier:
          TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.emailTarget,
        relationTargetObjectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.service,
      }),
    },
  },
  callRecording: {
    ...buildStandardObjectSystemFields(
      STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.callRecording,
    ),
    title: {
      universalIdentifier: '4cff8863-a1d1-45fd-a370-4eb6aa1f2a5b',
    },
    status: {
      universalIdentifier: '3e617680-d93e-4309-a54f-90f69528bfd7',
    },
    recordingRequestStatus: {
      universalIdentifier: '7fd681c9-244c-4e98-8939-7b175d472638',
    },
    applicationId: {
      universalIdentifier: '24ec1239-1240-42cb-8a2d-302632378e09',
    },
    externalBotId: {
      universalIdentifier: '0a2da128-9bcc-488b-bc31-65318c41bdf9',
    },
    externalRecordingId: {
      universalIdentifier: '6d17fb71-324b-4625-a5be-b3580607e2c7',
    },
    startedAt: {
      universalIdentifier: '6c56c23f-1987-410a-860a-df3b2b3f9a33',
    },
    endedAt: {
      universalIdentifier: '7a38a9cf-8424-4d6e-b80a-6883d3c662ef',
    },
    video: {
      universalIdentifier: 'bb9523d3-457e-4f4b-8c79-27a77afb87da',
    },
    recordingUrl: {
      universalIdentifier: 'dc3e4543-88a2-492d-8aac-5ce403d61f69',
    },
    notesUrl: {
      universalIdentifier: 'b3cfcab1-7467-4080-8845-d37c67a20cb1',
    },
    audio: {
      universalIdentifier: '2eafc2d0-8fec-430c-a939-65ca5fbc0f08',
    },
    transcript: {
      universalIdentifier: '27b86d68-57d1-4607-aca0-191896b1ad43',
    },
    summary: {
      universalIdentifier: 'adb0f472-756b-4d3f-b21e-ea32bf73a5e4',
    },
    calendarEvent: {
      universalIdentifier: '49e64b28-bd98-4775-80ea-4781bdd45e35',
    },
  },
  company: {
    ...buildStandardObjectSystemFields(
      STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.company,
    ),
    recordSource: { universalIdentifier: 'ecad06e4-de16-4d60-8848-d97b8a3e5fe7' },
    segmentMembers: {
      universalIdentifier: 'd4ec2d5b-1bf7-4041-809c-53e87fe1cbaf',
    },
    segmentMembership: {
      universalIdentifier: '0254606c-eef8-4ce3-9fc6-04d959f3f343',
    },
    name: { universalIdentifier: '20202020-4d99-4e2e-a84c-4a27837b1ece' },
    domainName: {
      universalIdentifier: '20202020-0c28-43d8-8ba5-3659924d3489',
    },
    address: { universalIdentifier: '20202020-c5ce-4adc-b7b6-9c0979fc55e7' },
    linkedinLink: {
      universalIdentifier: '20202020-ebeb-4beb-b9ad-6848036fb451',
    },
    annualRevenue: {
      universalIdentifier: '60f533b7-2166-4071-a767-ceb0286822fd',
    },
    people: { universalIdentifier: '20202020-3213-4ddf-9494-6422bcff8d7c' },
    accountOwner: {
      universalIdentifier: '20202020-95b8-4e10-9881-edb5d4765f9d',
    },
    taskTargets: {
      universalIdentifier: getSystemRelationFieldUniversalIdentifier({
        applicationUniversalIdentifier:
          TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.company,
        relationTargetObjectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.taskTarget,
      }),
    },
    noteTargets: {
      universalIdentifier: getSystemRelationFieldUniversalIdentifier({
        applicationUniversalIdentifier:
          TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.company,
        relationTargetObjectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.noteTarget,
      }),
    },
    agentChatThreadTargets: {
      universalIdentifier: getSystemRelationFieldUniversalIdentifier({
        applicationUniversalIdentifier:
          TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.company,
        relationTargetObjectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.agentChatThreadTarget,
      }),
    },
    calendarEventTargets: {
      universalIdentifier: getSystemRelationFieldUniversalIdentifier({
        applicationUniversalIdentifier:
          TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.company,
        relationTargetObjectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.calendarEventTarget,
      }),
    },
    messageThreadTargets: {
      universalIdentifier: getSystemRelationFieldUniversalIdentifier({
        applicationUniversalIdentifier:
          TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.company,
        relationTargetObjectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.messageThreadTarget,
      }),
    },
    opportunities: {
      universalIdentifier: '20202020-add3-4658-8e23-d70dccb6d0ec',
    },
    services: {
      universalIdentifier: 'cf0f4f8a-b34f-435a-9adf-2c7c7c294e26',
    },
    parentCompany: {
      universalIdentifier: 'f5089e4e-1902-43aa-b7c3-fa7d71d3484a',
    },
    childCompanies: {
      universalIdentifier: '50530a01-3bdd-4d16-85ac-13feb02e37de',
    },
    attachments: {
      universalIdentifier: getSystemRelationFieldUniversalIdentifier({
        applicationUniversalIdentifier:
          TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.company,
        relationTargetObjectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.attachment,
      }),
    },
    timelineActivities: {
      universalIdentifier: getSystemRelationFieldUniversalIdentifier({
        applicationUniversalIdentifier:
          TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.company,
        relationTargetObjectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.timelineActivity,
      }),
    },
    callTargets: {
      universalIdentifier: getSystemRelationFieldUniversalIdentifier({
        applicationUniversalIdentifier:
          TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.company,
        relationTargetObjectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.callTarget,
      }),
    },
    communicationTargets: {
      universalIdentifier: getSystemRelationFieldUniversalIdentifier({
        applicationUniversalIdentifier:
          TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.company,
        relationTargetObjectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.communicationTarget,
      }),
    },
    emailTargets: {
      universalIdentifier: getSystemRelationFieldUniversalIdentifier({
        applicationUniversalIdentifier:
          TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.company,
        relationTargetObjectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.emailTarget,
      }),
    },
    lifecycleStage: {
      universalIdentifier: '31f66b47-5872-4826-a4a4-d0bf051f4fb2',
    },
    isParentCompany: {
      universalIdentifier: '564cb6eb-93da-41c1-99e8-67db49941739',
    },
    isChildCompany: {
      universalIdentifier: '197939c3-5d62-4447-9c09-1e909ff90368',
    },
    numberOfChildCompanies: {
      universalIdentifier: '23e48e31-4c14-4076-b87e-826c142d3d50',
    },
    numberOfAssociatedContacts: {
      universalIdentifier: 'd3c7bcb9-69de-4cf9-be32-0cb0c6631fb7',
    },
    numberOfAssociatedDeals: {
      universalIdentifier: 'f2371015-4afc-4f86-bc3a-097950861aec',
    },
    numberOfOpenDeals: {
      universalIdentifier: '1fc41f94-97f1-44f1-8afd-e57329b676a9',
    },
    lastActivityDate: {
      universalIdentifier: 'e47f3266-19a0-4d47-9ed3-5c28ff832ed7',
    },
    dateEnteredCurrentStage: {
      universalIdentifier: 'e4215a27-cfe2-4e60-8aaf-0d35bd874623',
    },
    dateEnteredNewLifecycleStage: {
      universalIdentifier: '0519bffb-a7ec-4e42-b3e9-a7828ff18e47',
    },
    dateExitedNewLifecycleStage: {
      universalIdentifier: '61c0b470-edbd-4650-b193-6316f20cf588',
    },
    dateEnteredLeadLifecycleStage: {
      universalIdentifier: '5877b642-aee1-4a32-83a3-7c5e63eb3324',
    },
    dateExitedLeadLifecycleStage: {
      universalIdentifier: '0bc89e51-8ebc-4731-9053-57b034168b25',
    },
    dateEnteredMarketingQualifiedLeadLifecycleStage: {
      universalIdentifier: '3923c7a4-ee24-423d-aa8b-213506512410',
    },
    dateExitedMarketingQualifiedLeadLifecycleStage: {
      universalIdentifier: '6235b136-c3cd-4d2f-bf48-7a517ef1e502',
    },
    dateEnteredSalesQualifiedLeadLifecycleStage: {
      universalIdentifier: '86be7fec-e94e-42fd-bc6d-f6721918b0a6',
    },
    dateExitedSalesQualifiedLeadLifecycleStage: {
      universalIdentifier: 'f46cdf4f-0516-4113-85bd-7729551a66d3',
    },
    dateEnteredOpportunityLifecycleStage: {
      universalIdentifier: '69cf4ccb-ada4-42ba-81db-84666137b16a',
    },
    dateExitedOpportunityLifecycleStage: {
      universalIdentifier: '05842970-f5a5-47fa-950b-f1a671eb06c0',
    },
    dateEnteredCustomerLifecycleStage: {
      universalIdentifier: '2236dbfd-bd62-4392-80e9-ce04b22fb69e',
    },
    dateExitedCustomerLifecycleStage: {
      universalIdentifier: '8d4ea361-aae1-4312-a5f1-9bd1fe55f6a7',
    },
    dateEnteredPromoterLifecycleStage: {
      universalIdentifier: '56a76686-b80e-4514-bde0-2f1941ccda2c',
    },
    dateExitedPromoterLifecycleStage: {
      universalIdentifier: '4c313a85-cfbc-458f-85bd-4608544c4f25',
    },
    dateEnteredOtherLifecycleStage: {
      universalIdentifier: '0f08f4da-1580-4a42-a657-99d9023ba371',
    },
    dateExitedOtherLifecycleStage: {
      universalIdentifier: '64d442f5-a404-44e1-a9a3-755452349697',
    },
    dateEnteredClosingLifecycleStage: {
      universalIdentifier: '5f348f67-154f-4654-9691-d5a202fda9ce',
    },
    dateExitedClosingLifecycleStage: {
      universalIdentifier: '905a4bbb-7ed2-438b-b269-fb3032d27b3c',
    },
    dateEnteredOnHoldLifecycleStage: {
      universalIdentifier: '97244df8-a13a-4441-8832-ae466f16ab79',
    },
    dateExitedOnHoldLifecycleStage: {
      universalIdentifier: 'dd45d0d5-ab05-47f0-99e7-d14cbbdb849d',
    },
    dateEnteredBinLifecycleStage: {
      universalIdentifier: '303b099c-fcf7-4fad-a73f-04d8d2ff45ff',
    },
    dateExitedBinLifecycleStage: {
      universalIdentifier: 'b97150d4-4c65-4c84-873d-7957870bcce5',
    },
    ownerAssignedDate: {
      universalIdentifier: 'd72fa7e5-c313-4568-a3de-9ec832c1427d',
    },
    sdrOwner: {
      universalIdentifier: '76b2dc74-c10f-4e39-8a99-b52f37308d5e',
    },
    sdrOwnerAssignedDate: {
      universalIdentifier: '7712d9c6-f161-492e-8d59-2b6566c048c8',
    },
    nextActivityDate: {
      universalIdentifier: 'c6421216-b331-4c40-a080-5fbca8369eaa',
    },
  },
  dashboard: {
    ...buildStandardObjectSystemFields(
      STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.dashboard,
    ),
    title: { universalIdentifier: '20202020-20ee-4091-95dc-44b57eda3a89' },
    pageLayoutId: {
      universalIdentifier: '20202020-bb53-4648-aa36-1d9d54e6f7f2',
    },
    timelineActivities: {
      universalIdentifier: getSystemRelationFieldUniversalIdentifier({
        applicationUniversalIdentifier:
          TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.dashboard,
        relationTargetObjectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.timelineActivity,
      }),
    },
    attachments: {
      universalIdentifier: getSystemRelationFieldUniversalIdentifier({
        applicationUniversalIdentifier:
          TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.dashboard,
        relationTargetObjectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.attachment,
      }),
    },
  },
  messageCampaign: {
    ...buildStandardObjectSystemFields(
      STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.messageCampaign,
    ),
    name: { universalIdentifier: 'dc8bca0e-37c4-4b78-814d-2e91124274e3' },
    subject: { universalIdentifier: '7251544c-b07a-4f0d-9d0a-48514367f230' },
    bodyTemplate: {
      universalIdentifier: 'b3a69d08-31ca-4a8d-8359-5ca462899342',
    },
    fromAddress: {
      universalIdentifier: '91e1a33c-c1ff-411a-b720-9085e13c05db',
    },
    status: { universalIdentifier: 'c7117256-3de6-48e1-87df-c99c32bad610' },
    scheduledAt: {
      universalIdentifier: '0b281092-f5a5-4dd6-969b-5229f6620071',
    },
    sentAt: { universalIdentifier: 'e2315b4f-9edf-4df2-96b9-961e76368671' },
    sentCount: {
      universalIdentifier: '2f333d2b-37b8-4ddc-ad0d-c07c6ce066ad',
    },
    deliveredCount: {
      universalIdentifier: 'f4ee1d33-7379-42fe-ad63-e023449baea6',
    },
    failedCount: {
      universalIdentifier: 'd373fcd7-b1ce-4c77-8031-a5785c475028',
    },
    bouncedCount: {
      universalIdentifier: '20d884a9-34dd-4667-8ecb-ceec224258e2',
    },
    complainedCount: {
      universalIdentifier: '82842cfa-f12a-4bab-bbde-b2cf587d0406',
    },
    skippedCount: {
      universalIdentifier: 'a1f4c6d2-5e8b-4a37-9c60-31b7f0d2a984',
    },
    uniqueClickCount: {
      universalIdentifier: 'd9a4e1c6-5b3f-4e0a-9c8d-4f7b9a3e6c12',
    },
    clickRate: {
      universalIdentifier: '7999aebc-51f4-4b93-9925-717db707c703',
    },
    uniqueOpenCount: {
      universalIdentifier: '865d188f-3178-4173-a986-80d01a8c7147',
    },
    openRate: {
      universalIdentifier: '77529a55-d723-4c91-9df7-0190fd760e93',
    },
    unsubscribeTopicId: {
      universalIdentifier: '0648e7ad-1769-4ff6-a4d5-72da79ef169c',
    },
    list: { universalIdentifier: 'cb24dcdf-f0e8-4c71-8cff-70b714e86530' },
    timelineActivities: {
      universalIdentifier: getSystemRelationFieldUniversalIdentifier({
        applicationUniversalIdentifier:
          TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.messageCampaign,
        relationTargetObjectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.timelineActivity,
      }),
    },
    messages: { universalIdentifier: 'e5a177a7-512b-4778-928e-69777a528f7c' },
    recipients: {
      universalIdentifier: '05a3271c-5b91-493c-8f30-2d27b31d019e',
    },
  },
  messageList: {
    ...buildStandardObjectSystemFields(
      STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.messageList,
    ),
    name: { universalIdentifier: '69b9ed8b-7b26-4108-894f-05700ef7e8ee' },
    description: {
      universalIdentifier: '2484463a-12e0-411e-9586-81892bd7721c',
    },
    members: {
      universalIdentifier: '92df3493-91cf-4665-8587-1b08917d299b',
    },
    campaigns: {
      universalIdentifier: 'e098d838-31ab-4812-91a8-f055f45a6832',
    },
    timelineActivities: {
      universalIdentifier: getSystemRelationFieldUniversalIdentifier({
        applicationUniversalIdentifier:
          TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.messageList,
        relationTargetObjectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.timelineActivity,
      }),
    },
  },
  messageListMember: {
    ...buildStandardObjectSystemFields(
      STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.messageListMember,
    ),
    person: { universalIdentifier: '34288425-8805-42fb-8b98-ee13d09be3d3' },
    list: {
      universalIdentifier: 'd5402005-e8f9-4fbe-8696-b6723cd85018',
    },
  },
  opportunityContact: {
    ...buildStandardObjectSystemFields(
      STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunityContact,
    ),
    opportunity: {
      universalIdentifier: 'c9a0580a-9eab-44f9-b65c-7ba6f20216cf',
    },
    person: { universalIdentifier: 'c1cebe58-bfb0-4ea7-90c1-50de57e62a93' },
  },
  opportunityCollaborator: {
    ...buildStandardObjectSystemFields(
      STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunityCollaborator,
    ),
    opportunity: {
      universalIdentifier: '29d16c8e-42c4-4b89-973a-4085c06a5dc3',
    },
    workspaceMember: {
      universalIdentifier: '8ac45b39-8324-4f14-a63e-685a87327f99',
    },
  },
  opportunityStageHistory: {
    ...buildStandardObjectSystemFields(
      STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunityStageHistory,
    ),
    opportunity: {
      universalIdentifier: '20f805c2-e7d6-4be4-bb73-df34d7d8428d',
    },
    pipeline: { universalIdentifier: '73fa2a03-f9cb-4f06-9d52-a487527c3a0a' },
    fromStage: { universalIdentifier: '8976f6ae-bdb9-4faa-b2d9-70cf7bd74b59' },
    toStage: { universalIdentifier: '12854d71-673a-4ec5-834f-0c3b674b56d5' },
    changedAt: { universalIdentifier: '60669d57-0b7c-414d-8e66-6bd6f9d003cb' },
    changedBy: { universalIdentifier: '56a02e55-60bf-4adf-a354-9d51f9b68044' },
  },
  serviceStageHistory: {
    ...buildStandardObjectSystemFields(
      STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.serviceStageHistory,
    ),
    service: { universalIdentifier: 'bc33ea12-8237-4240-9a60-9616293b2a5d' },
    pipeline: { universalIdentifier: '8fd43566-dd22-49bd-90c6-1c3b80f5c827' },
    fromStage: { universalIdentifier: '96d268a3-6ed3-4232-9981-c26860b680a6' },
    toStage: { universalIdentifier: 'eaa4068c-26ea-4fcb-9974-72cbdbcf5938' },
    changedAt: { universalIdentifier: 'c1db9585-46d5-4b8d-9993-ddcfaedb9d3c' },
    changedBy: { universalIdentifier: '44a311ea-c21e-4052-aa60-0048617ac459' },
  },
  pipeline: {
    ...buildStandardObjectSystemFields(
      STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.pipeline,
    ),
    stageCalculatedPropertyKinds: {
      universalIdentifier: 'e0efc7f6-b5aa-4312-9f26-4df6273dcd79',
    },
    name: { universalIdentifier: '0c2824e7-0005-460d-9fb7-4a46743701fa' },
    description: {
      universalIdentifier: '03b506a7-2cac-4a4e-9190-7f165f6e0899',
    },
    key: { universalIdentifier: 'fec61ea7-0ce3-4aa1-816a-ec3a67c9f25c' },
    objectNameSingular: {
      universalIdentifier: 'cd14386d-ffbc-4147-82cb-868e20a927b2',
    },
    hubspotPipelineId: {
      universalIdentifier: 'ffd1814f-603e-4054-92db-6df24f08c570',
    },
    rules: { universalIdentifier: 'd3b66e48-cec9-4a7a-8246-84eb14e5cc37' },
    stages: { universalIdentifier: '2978657b-987a-44de-84a0-11e563024eb9' },
  },
  pipelineStage: {
    ...buildStandardObjectSystemFields(
      STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.pipelineStage,
    ),
    pipeline: { universalIdentifier: '98c201a6-fa6e-4a65-b984-b1d45460595c' },
    label: { universalIdentifier: 'c90676f2-c1ff-4783-8276-29db4450195e' },
    value: { universalIdentifier: 'e9176c93-79ae-4f08-a9db-259c05f8e914' },
    color: { universalIdentifier: '0ede98de-afb8-4284-aca4-6c8569abee4f' },
    probability: {
      universalIdentifier: '53605fa2-2620-43da-aa97-f636a85094ac',
    },
    hubspotStageId: {
      universalIdentifier: 'da8424bb-7ef6-447f-acde-435541f3358c',
    },
    calcPropsEnabled: {
      universalIdentifier: 'd9476e6e-8296-41ee-ab67-bd4778f9a828',
    },
    conditionalRules: {
      universalIdentifier: '190eee8a-1faf-4e0e-97ec-ab225e2f216f',
    },
  },
  propertyGroup: {
    ...buildStandardObjectSystemFields(
      STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.propertyGroup,
    ),
    name: { universalIdentifier: '69daee0d-7e6c-413b-b938-61c8b8e0c98c' },
    objectMetadataId: {
      universalIdentifier: 'c0f56daa-4303-4ddb-b152-f186537802af',
    },
  },
  propertyGroupMembership: {
    ...buildStandardObjectSystemFields(
      STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.propertyGroupMembership,
    ),
    propertyGroupId: {
      universalIdentifier: 'd80abef7-09a9-4c5b-896a-6a28e49408bb',
    },
    fieldMetadataId: {
      universalIdentifier: '846ac739-6894-4a0c-8223-0bd89f71955b',
    },
    objectMetadataId: {
      universalIdentifier: '268ef415-d879-4f0e-8767-94918a2e3e0f',
    },
  },
  propertyLogicRule: {
    ...buildStandardObjectSystemFields(
      STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.propertyLogicRule,
    ),
    objectMetadataId: {
      universalIdentifier: '1fc8b6b1-22da-4d10-a756-46bf4c9b3d92',
    },
    conditionGroups: {
      universalIdentifier: 'b0a4f821-88e4-4916-b269-8d182bced150',
    },
    properties: {
      universalIdentifier: '027c3177-201e-40f6-aded-e698c9a30800',
    },
  },
  propertyCreation: {
    ...buildStandardObjectSystemFields(
      STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.propertyCreation,
    ),
    fieldMetadataId: {
      universalIdentifier: '2cf21478-75c2-4e5f-b515-6fea0aae959b',
    },
    objectMetadataId: {
      universalIdentifier: 'ac1dbdf2-ff6e-429d-8df5-855cae248d73',
    },
  },
  messageChannelMessageAssociation: {
    ...buildStandardObjectSystemFields(
      STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.messageChannelMessageAssociation,
    ),
    messageChannelId: {
      universalIdentifier: '20202020-b658-408f-bd46-3bd2d15d7e52',
    },
    message: {
      universalIdentifier: '20202020-da5d-4ac5-8743-342ab0a0336b',
    },
    messageExternalId: {
      universalIdentifier: '20202020-37d6-438f-b6fd-6503596c8f34',
    },
    messageThread: {
      universalIdentifier: '20202020-fac8-42a8-94dd-44dbc920ae16',
    },
    messageThreadExternalId: {
      universalIdentifier: '20202020-35fb-421e-afa0-0b8e8f7f9018',
    },
    direction: {
      universalIdentifier: '75c9b0f7-9e76-44d4-a2f9-47051e61eec7',
    },
    messageFolders: {
      universalIdentifier: '9bfc9da7-ae2d-44fd-9563-ede90c5d6222',
    },
  },
  messageChannelMessageAssociationMessageFolder: {
    ...buildStandardObjectSystemFields(
      STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.messageChannelMessageAssociationMessageFolder,
    ),
    messageChannelMessageAssociation: {
      universalIdentifier: '7411cfa3-4fd9-4b90-a636-940015fd7243',
    },
    messageFolderId: {
      universalIdentifier: 'b3369d31-3856-4a7a-b007-ee353918127c',
    },
  },
  messageParticipant: {
    ...buildStandardObjectSystemFields(
      STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.messageParticipant,
    ),
    message: {
      universalIdentifier: '20202020-985b-429a-9db9-9e55f4898a2a',
    },
    role: {
      universalIdentifier: '20202020-65d1-42f4-8729-c9ec1f52aecd',
    },
    handle: {
      universalIdentifier: '20202020-2456-464e-b422-b965a4db4a0b',
    },
    displayName: {
      universalIdentifier: '20202020-36dd-4a4f-ac02-228425be9fac',
    },
    person: {
      universalIdentifier: '20202020-249d-4e0f-82cd-1b9df5cd3da2',
    },
    workspaceMember: {
      universalIdentifier: '20202020-77a7-4845-99ed-1bcbb478be6f',
    },
    messageCampaign: {
      universalIdentifier: '5bc768db-919f-41da-8c43-df08084d526f',
    },
  },
  messageThread: {
    ...buildStandardObjectSystemFields(
      STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.messageThread,
    ),
    messages: {
      universalIdentifier: '20202020-3115-404f-aade-e1154b28e35a',
    },
    messageChannelMessageAssociations: {
      universalIdentifier: '20202020-314e-40a4-906d-a5d5d6c285f6',
    },
    subject: {
      universalIdentifier: 'a8ddbf8c-1137-45d1-b89e-5ffbd83f67c8',
    },
    messageThreadTargets: {
      universalIdentifier: '8d7c8b17-b835-4082-96bd-de704c491d49',
    },
  },
  messageThreadTarget: {
    target: { universalIdentifier: 'e85e853d-c26e-41b3-bec0-7afc4bdbc2f7' },
    ...buildStandardObjectSystemFields(
      STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.messageThreadTarget,
    ),
    messageThread: {
      universalIdentifier: '23ca09e6-149d-452f-bed7-a4aad24d1314',
    },
    isAutomaticallyAssigned: {
      universalIdentifier: '04403730-e960-415a-8790-f0c0f82f3477',
    },
    isManuallyAssigned: {
      universalIdentifier: '16efa36f-d195-42e9-959f-6928164f2395',
    },
    targetPerson: {
      universalIdentifier: getSystemRelationFieldUniversalIdentifier({
        applicationUniversalIdentifier:
          TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.messageThreadTarget,
        relationTargetObjectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person,
      }),
    },
    targetCompany: {
      universalIdentifier: getSystemRelationFieldUniversalIdentifier({
        applicationUniversalIdentifier:
          TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.messageThreadTarget,
        relationTargetObjectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.company,
      }),
    },
    targetOpportunity: {
      universalIdentifier: getSystemRelationFieldUniversalIdentifier({
        applicationUniversalIdentifier:
          TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.messageThreadTarget,
        relationTargetObjectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity,
      }),
    },
    targetService: {
      universalIdentifier: getSystemRelationFieldUniversalIdentifier({
        applicationUniversalIdentifier:
          TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.messageThreadTarget,
        relationTargetObjectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.service,
      }),
    },
  },
  message: {
    ...buildStandardObjectSystemFields(
      STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.message,
    ),
    headerMessageId: {
      universalIdentifier: '20202020-72b5-416d-aed8-b55609067d01',
    },
    messageThread: {
      universalIdentifier: '20202020-30f2-4ccd-9f5c-e41bb9d26214',
    },
    subject: { universalIdentifier: '20202020-52d1-4036-b9ae-84bd722bb37a' },
    text: { universalIdentifier: '20202020-d2ee-4e7e-89de-9a0a9044a143' },
    receivedAt: {
      universalIdentifier: '20202020-140a-4a2a-9f86-f13b6a979afc',
    },
    messageParticipants: {
      universalIdentifier: '20202020-7cff-4a74-b63c-73228448cbd9',
    },
    messageChannelMessageAssociations: {
      universalIdentifier: '20202020-3cef-43a3-82c6-50e7cfbc9ae4',
    },
    messageCampaign: {
      universalIdentifier: '77cff00b-a0ba-48d6-80de-0d5ccf14e45b',
    },
    isDraft: {
      universalIdentifier: '20202020-4d3a-4b6e-9c1f-2a5e7b9d0c34',
    },
  },
  note: {
    ...buildStandardObjectSystemFields(
      STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.note,
    ),
    recordSource: { universalIdentifier: 'cf99643e-9953-41fc-bb7d-a7d82b82eb4e' },
    title: { universalIdentifier: '20202020-faeb-4c76-8ba6-ccbb0b4a965f' },
    bodyV2: { universalIdentifier: '20202020-a7bb-4d94-be51-8f25181502c8' },
    noteTargets: {
      universalIdentifier: '20202020-1f25-43fe-8b00-af212fdde823',
    },
    attachments: {
      universalIdentifier: getSystemRelationFieldUniversalIdentifier({
        applicationUniversalIdentifier:
          TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
        objectUniversalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.note,
        relationTargetObjectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.attachment,
      }),
    },
    timelineActivities: {
      universalIdentifier: getSystemRelationFieldUniversalIdentifier({
        applicationUniversalIdentifier:
          TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
        objectUniversalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.note,
        relationTargetObjectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.timelineActivity,
      }),
    },
  },
  noteTarget: {
    target: { universalIdentifier: '20202020-f635-435d-ab8d-e1168b375c70' },
    ...buildStandardObjectSystemFields(
      STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.noteTarget,
    ),
    note: { universalIdentifier: '20202020-57f3-4f50-9599-fc0f671df003' },
    targetPerson: {
      universalIdentifier: getSystemRelationFieldUniversalIdentifier({
        applicationUniversalIdentifier:
          TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.noteTarget,
        relationTargetObjectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person,
      }),
    },
    targetCompany: {
      universalIdentifier: getSystemRelationFieldUniversalIdentifier({
        applicationUniversalIdentifier:
          TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.noteTarget,
        relationTargetObjectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.company,
      }),
    },
    targetOpportunity: {
      universalIdentifier: getSystemRelationFieldUniversalIdentifier({
        applicationUniversalIdentifier:
          TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.noteTarget,
        relationTargetObjectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity,
      }),
    },
    targetService: {
      universalIdentifier: getSystemRelationFieldUniversalIdentifier({
        applicationUniversalIdentifier:
          TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.noteTarget,
        relationTargetObjectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.service,
      }),
    },
  },
  opportunity: {
    ...buildStandardObjectSystemFields(
      STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity,
    ),
    recordSource: { universalIdentifier: '2f1b7197-6d49-4d1f-adc0-2945287b0db0' },
    segmentMembers: {
      universalIdentifier: '80a590cf-546f-4ab5-adee-18f2d4da57ee',
    },
    segmentMembership: {
      universalIdentifier: 'f4baad0c-10e1-41cd-be36-9413419456e7',
    },
    name: { universalIdentifier: '20202020-8609-4f65-a2d9-44009eb422b5' },
    amount: { universalIdentifier: '20202020-583e-4642-8533-db761d5fa82f' },
    closeDate: {
      universalIdentifier: '20202020-527e-44d6-b1ac-c4158d307b97',
    },
    stage: { universalIdentifier: '20202020-6f76-477d-8551-28cd65b2b4b9' },
    pointOfContact: {
      universalIdentifier: '20202020-8dfb-42fc-92b6-01afb759ed16',
    },
    company: { universalIdentifier: '20202020-cbac-457e-b565-adece5fc815f' },
    owner: { universalIdentifier: '20202020-be7e-4d1e-8e19-3d5c7c4b9f2a' },
    services: {
      universalIdentifier: '6bdc4a51-1b5b-440a-b2ab-13e87a6ae902',
    },
    lineItems: {
      universalIdentifier: '5cc0767e-d40e-4ae8-a6e5-a5ec5551cb85',
    },
    contacts: {
      universalIdentifier: '846b77df-cfd3-4b42-8cad-50b040f3bc4d',
    },
    taskTargets: {
      universalIdentifier: getSystemRelationFieldUniversalIdentifier({
        applicationUniversalIdentifier:
          TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity,
        relationTargetObjectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.taskTarget,
      }),
    },
    noteTargets: {
      universalIdentifier: getSystemRelationFieldUniversalIdentifier({
        applicationUniversalIdentifier:
          TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity,
        relationTargetObjectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.noteTarget,
      }),
    },
    agentChatThreadTargets: {
      universalIdentifier: getSystemRelationFieldUniversalIdentifier({
        applicationUniversalIdentifier:
          TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity,
        relationTargetObjectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.agentChatThreadTarget,
      }),
    },
    calendarEventTargets: {
      universalIdentifier: getSystemRelationFieldUniversalIdentifier({
        applicationUniversalIdentifier:
          TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity,
        relationTargetObjectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.calendarEventTarget,
      }),
    },
    messageThreadTargets: {
      universalIdentifier: getSystemRelationFieldUniversalIdentifier({
        applicationUniversalIdentifier:
          TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity,
        relationTargetObjectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.messageThreadTarget,
      }),
    },
    attachments: {
      universalIdentifier: getSystemRelationFieldUniversalIdentifier({
        applicationUniversalIdentifier:
          TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity,
        relationTargetObjectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.attachment,
      }),
    },
    timelineActivities: {
      universalIdentifier: getSystemRelationFieldUniversalIdentifier({
        applicationUniversalIdentifier:
          TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity,
        relationTargetObjectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.timelineActivity,
      }),
    },
    callTargets: {
      universalIdentifier: getSystemRelationFieldUniversalIdentifier({
        applicationUniversalIdentifier:
          TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity,
        relationTargetObjectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.callTarget,
      }),
    },
    communicationTargets: {
      universalIdentifier: getSystemRelationFieldUniversalIdentifier({
        applicationUniversalIdentifier:
          TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity,
        relationTargetObjectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.communicationTarget,
      }),
    },
    emailTargets: {
      universalIdentifier: getSystemRelationFieldUniversalIdentifier({
        applicationUniversalIdentifier:
          TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity,
        relationTargetObjectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.emailTarget,
      }),
    },
    team: { universalIdentifier: 'df1a7520-16f7-4753-bd3b-66fdfdd15683' },
    dealCollaborators: {
      universalIdentifier: 'acb590ca-c49d-4067-b0ef-ef98d6aed58c',
    },
    ownerAssignedDate: {
      universalIdentifier: '4c12e55a-2c9b-4a77-95b6-90fe7612d5b2',
    },
    lastActivityDate: {
      universalIdentifier: 'a65228b6-69a3-4395-a2dd-29302081a9ff',
    },
    numberOfAssociatedContacts: {
      universalIdentifier: 'c62ee97f-4669-4294-974f-55c21fefa463',
    },
    numberOfAssociatedLineItems: {
      universalIdentifier: 'd235ffb0-68bf-4c09-a0cd-368e8f25489f',
    },
    nextActivityDate: {
      universalIdentifier: 'a75ed1eb-355b-487b-ba44-c33e941b4c48',
    },
    pipeline: { universalIdentifier: '7e8b2b5e-f188-4828-9424-35369e5d5391' },
    dealProbability: {
      universalIdentifier: 'f732cb51-e094-45a7-bc86-82543e273f8f',
    },
    weightedAmount: {
      universalIdentifier: '1f5a289c-d48c-4189-bd1b-f2c698bbaaf3',
    },
    isClosed: { universalIdentifier: '6547baa3-9b49-4c55-9064-3e56a6958ec4' },
    isClosedWon: {
      universalIdentifier: 'dfa8d1ee-f93c-46af-b5b0-b7564d40cd68',
    },
    isClosedLost: {
      universalIdentifier: '5ec4bf17-45df-46e3-a18f-64d0b2235a1f',
    },
    isOpen: { universalIdentifier: '6c0bb04e-bb31-46a0-833d-da7ffcdbdde7' },
    actualDuration: {
      universalIdentifier: 'e6fa4b0f-5b2c-4ef7-8b1e-ec306df9aba4',
    },
    stageHistory: {
      universalIdentifier: '11c45f4c-9798-41d7-8adf-dfdc069bb09d',
    },
    dateEnteredCurrentStage: {
      universalIdentifier: 'b01e2618-fb30-486f-b651-59d55a1c1a68',
    },
    timeInCurrentStage: {
      universalIdentifier: 'fdd5054b-3e80-4bf4-ad90-9a55ae1fa2c2',
    },
  },
  person: {
    ...buildStandardObjectSystemFields(
      STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person,
    ),
    recordSource: { universalIdentifier: '5cb12ad5-ce2f-4c60-89cc-801762ba55fa' },
    segmentMembers: {
      universalIdentifier: '1c757569-68e9-4ca4-98ec-5b86ffd615fd',
    },
    segmentMembership: {
      universalIdentifier: 'b85f8293-a358-45a9-bc7d-a18eb35ed3e0',
    },
    name: { universalIdentifier: '20202020-3875-44d5-8c33-a6239011cab8' },
    emails: { universalIdentifier: '20202020-3c51-43fa-8b6e-af39e29368ab' },
    linkedinLink: {
      universalIdentifier: '20202020-f1af-48f7-893b-2007a73dd508',
    },
    jobTitle: { universalIdentifier: '20202020-b0d0-415a-bef9-640a26dacd9b' },
    phones: { universalIdentifier: '20202020-0638-448e-8825-439134618022' },
    avatarUrl: {
      universalIdentifier: '20202020-b8a6-40df-961c-373dc5d2ec21',
    },
    avatarFile: {
      universalIdentifier: '20202020-a7c9-4e3d-8f1b-2d5a6b7c8e9f',
    },
    company: { universalIdentifier: '20202020-e2f3-448e-b34c-2d625f0025fd' },
    pointOfContactForOpportunities: {
      universalIdentifier: '20202020-911b-4a7d-b67b-918aa9a5b33a',
    },
    services: {
      universalIdentifier: '81b6c188-41f4-4ca0-8909-efc53069a144',
    },
    taskTargets: {
      universalIdentifier: getSystemRelationFieldUniversalIdentifier({
        applicationUniversalIdentifier:
          TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
        objectUniversalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person,
        relationTargetObjectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.taskTarget,
      }),
    },
    noteTargets: {
      universalIdentifier: getSystemRelationFieldUniversalIdentifier({
        applicationUniversalIdentifier:
          TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
        objectUniversalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person,
        relationTargetObjectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.noteTarget,
      }),
    },
    agentChatThreadTargets: {
      universalIdentifier: getSystemRelationFieldUniversalIdentifier({
        applicationUniversalIdentifier:
          TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
        objectUniversalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person,
        relationTargetObjectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.agentChatThreadTarget,
      }),
    },
    calendarEventTargets: {
      universalIdentifier: getSystemRelationFieldUniversalIdentifier({
        applicationUniversalIdentifier:
          TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
        objectUniversalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person,
        relationTargetObjectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.calendarEventTarget,
      }),
    },
    messageThreadTargets: {
      universalIdentifier: getSystemRelationFieldUniversalIdentifier({
        applicationUniversalIdentifier:
          TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
        objectUniversalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person,
        relationTargetObjectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.messageThreadTarget,
      }),
    },
    attachments: {
      universalIdentifier: getSystemRelationFieldUniversalIdentifier({
        applicationUniversalIdentifier:
          TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
        objectUniversalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person,
        relationTargetObjectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.attachment,
      }),
    },
    messageParticipants: {
      universalIdentifier: '20202020-498e-4c61-8158-fa04f0638334',
    },
    calendarEventParticipants: {
      universalIdentifier: '20202020-52ee-45e9-a702-b64b3753e3a9',
    },
    timelineActivities: {
      universalIdentifier: getSystemRelationFieldUniversalIdentifier({
        applicationUniversalIdentifier:
          TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
        objectUniversalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person,
        relationTargetObjectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.timelineActivity,
      }),
    },
    listMemberships: {
      universalIdentifier: '8b8d1be0-4c94-4413-a2c9-c7ede205a81d',
    },
    opportunities: {
      universalIdentifier: 'a0a4848a-5cbc-49fb-b0db-6c1f69b357fb',
    },
    callTargets: {
      universalIdentifier: getSystemRelationFieldUniversalIdentifier({
        applicationUniversalIdentifier:
          TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
        objectUniversalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person,
        relationTargetObjectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.callTarget,
      }),
    },
    communicationTargets: {
      universalIdentifier: getSystemRelationFieldUniversalIdentifier({
        applicationUniversalIdentifier:
          TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
        objectUniversalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person,
        relationTargetObjectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.communicationTarget,
      }),
    },
    emailTargets: {
      universalIdentifier: getSystemRelationFieldUniversalIdentifier({
        applicationUniversalIdentifier:
          TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
        objectUniversalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person,
        relationTargetObjectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.emailTarget,
      }),
    },
    lifecycleStage: {
      universalIdentifier: 'e86c704e-49a9-4a09-8304-8aaed1d05aa5',
    },
    team: {
      universalIdentifier: '4a38fc60-2cdb-4228-891e-b8490663612e',
    },
    contactOwner: {
      universalIdentifier: '0590242c-ad51-46ac-abba-679c027e55b1',
    },
    contactSdrOwner: {
      universalIdentifier: 'ac0d42a1-1879-4f02-9a12-0dae5cc7516f',
    },
    ownerAssignedDate: {
      universalIdentifier: '121ed87f-1a82-4375-ab77-e8b7969434c0',
    },
    sdrOwnerAssignedDate: {
      universalIdentifier: '8d4317a3-e6c9-4eb7-8c31-6f3ddc39118f',
    },
    lastActivityDate: {
      universalIdentifier: '0c60d2de-95b5-469e-9b94-80ce82bfa6f0',
    },
    firstDealCreatedDate: {
      universalIdentifier: 'e9c13cc9-f43a-4093-a8ba-faf229ba022b',
    },
    timeInCurrentStage: {
      universalIdentifier: '9868610b-1351-47bd-abe5-9346372faa4a',
    },
    dateEnteredCurrentStage: {
      universalIdentifier: '9079efb4-cb10-48db-a219-377016c7ba97',
    },
    dateEnteredNewLifecycleStage: {
      universalIdentifier: '4182abc0-480f-4b3a-9e50-7dbc9d7c88af',
    },
    dateExitedNewLifecycleStage: {
      universalIdentifier: '76fad40e-7c5d-445e-972c-7e7e518f09bd',
    },
    dateEnteredLeadLifecycleStage: {
      universalIdentifier: '43285727-e7c4-4946-a956-c5194e383b72',
    },
    dateExitedLeadLifecycleStage: {
      universalIdentifier: 'e6e99385-cf8b-4e4e-9d25-15ed600f13b6',
    },
    dateEnteredMarketingQualifiedLeadLifecycleStage: {
      universalIdentifier: 'a7db1f2b-f588-4140-8c8f-bd24105845f6',
    },
    dateExitedMarketingQualifiedLeadLifecycleStage: {
      universalIdentifier: '2fac3486-6324-4ccc-b27c-86c518ea9f2f',
    },
    dateEnteredSalesQualifiedLeadLifecycleStage: {
      universalIdentifier: '90cee89a-f52d-4ed4-ae65-f12443134baf',
    },
    dateExitedSalesQualifiedLeadLifecycleStage: {
      universalIdentifier: 'c4872a14-5b87-4b3f-962e-178cb26652a9',
    },
    dateEnteredOpportunityLifecycleStage: {
      universalIdentifier: '58e79228-6ee2-4a89-b586-3c5d90a01242',
    },
    dateExitedOpportunityLifecycleStage: {
      universalIdentifier: 'ed5b7b61-23de-4039-b6e9-aeec3c55470d',
    },
    dateEnteredCustomerLifecycleStage: {
      universalIdentifier: 'e90c2c0e-8955-411a-9edd-170c9e3d18b6',
    },
    dateExitedCustomerLifecycleStage: {
      universalIdentifier: 'ebfccf78-ef30-45d2-86b7-333fbe427dd9',
    },
    dateEnteredPromoterLifecycleStage: {
      universalIdentifier: '4dab6d7b-19b3-48b4-9299-b4fd37acad77',
    },
    dateExitedPromoterLifecycleStage: {
      universalIdentifier: '607645d5-731d-49d6-b84e-4171a9951900',
    },
    dateEnteredOtherLifecycleStage: {
      universalIdentifier: '10228ab8-e1a9-4240-9cc0-b3f1b264c2d6',
    },
    dateExitedOtherLifecycleStage: {
      universalIdentifier: '97aca986-f8f2-4677-88e7-ad2d08b165d6',
    },
    dateEnteredClosingLifecycleStage: {
      universalIdentifier: 'abaff562-7e62-444d-b526-67fc38c1237a',
    },
    dateExitedClosingLifecycleStage: {
      universalIdentifier: 'cf17d284-97ec-4464-b630-e0597e392cfc',
    },
    dateEnteredOnHoldLifecycleStage: {
      universalIdentifier: '68b4048f-96f2-48be-9d1d-e20d7af2754f',
    },
    dateExitedOnHoldLifecycleStage: {
      universalIdentifier: '22089e52-9d94-4446-974c-3fe80d5bb4b0',
    },
    dateEnteredBinLifecycleStage: {
      universalIdentifier: '63381340-e2e7-4ca4-a0e7-304d8b5c99a2',
    },
    dateExitedBinLifecycleStage: {
      universalIdentifier: 'b8831b8e-bbf6-498b-b43b-f19c7a6a02a0',
    },
    nextActivityDate: {
      universalIdentifier: '80a5362a-34ab-4fd7-98c4-fedea2841860',
    },
  },
  service: {
    ...buildStandardObjectSystemFields(
      STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.service,
    ),
    pipeline: { universalIdentifier: '20c6b796-9813-4f13-a4ec-1cedf21949bb' },
    stage: { universalIdentifier: '70dbcbd4-0902-470b-afbf-4897ca88bdaf' },
    stageHistory: {
      universalIdentifier: '47ba4bba-cf37-4be7-bc54-9e7729d21d14',
    },
    recordSource: { universalIdentifier: 'dff416a3-1805-4127-a434-df4c45354eef' },
    name: { universalIdentifier: '120f9f98-08d8-4ca3-8af3-5f8911565f64' },
    company: { universalIdentifier: 'a10f3e30-45d3-4ae3-ad28-44d02b7b9bbb' },
    pointOfContact: {
      universalIdentifier: 'bf5cc87b-3e5d-45a0-8751-3000f305a791',
    },
    opportunity: {
      universalIdentifier: '9be58245-dbf3-42cb-b871-714ff74515e9',
    },
    timelineActivities: {
      universalIdentifier: getSystemRelationFieldUniversalIdentifier({
        applicationUniversalIdentifier:
          TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.service,
        relationTargetObjectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.timelineActivity,
      }),
    },
    noteTargets: {
      universalIdentifier: getSystemRelationFieldUniversalIdentifier({
        applicationUniversalIdentifier:
          TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.service,
        relationTargetObjectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.noteTarget,
      }),
    },
    taskTargets: {
      universalIdentifier: getSystemRelationFieldUniversalIdentifier({
        applicationUniversalIdentifier:
          TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.service,
        relationTargetObjectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.taskTarget,
      }),
    },
    callTargets: {
      universalIdentifier: getSystemRelationFieldUniversalIdentifier({
        applicationUniversalIdentifier:
          TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.service,
        relationTargetObjectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.callTarget,
      }),
    },
    communicationTargets: {
      universalIdentifier: getSystemRelationFieldUniversalIdentifier({
        applicationUniversalIdentifier:
          TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.service,
        relationTargetObjectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.communicationTarget,
      }),
    },
    emailTargets: {
      universalIdentifier: getSystemRelationFieldUniversalIdentifier({
        applicationUniversalIdentifier:
          TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.service,
        relationTargetObjectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.emailTarget,
      }),
    },
    messageThreadTargets: {
      universalIdentifier: getSystemRelationFieldUniversalIdentifier({
        applicationUniversalIdentifier:
          TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.service,
        relationTargetObjectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.messageThreadTarget,
      }),
    },
    calendarEventTargets: {
      universalIdentifier: getSystemRelationFieldUniversalIdentifier({
        applicationUniversalIdentifier:
          TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.service,
        relationTargetObjectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.calendarEventTarget,
      }),
    },
  },
  product: {
    ...buildStandardObjectSystemFields(
      STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.product,
    ),
    name: { universalIdentifier: '3f4f9cb2-0d0b-4c14-bbc5-e11600749ffa' },
    sku: { universalIdentifier: '4355bbe5-d65b-4186-8657-98df98eb71fc' },
    description: {
      universalIdentifier: '05c02c42-edcf-4c3d-82b7-fcaa962357ec',
    },
    productType: {
      universalIdentifier: '06b65afb-bab3-4a16-b245-80d14d7ef403',
    },
    billingFrequency: {
      universalIdentifier: '18d221b3-cb4d-4448-9703-d8c7c5b4e71e',
    },
    unitPrice: {
      universalIdentifier: 'c4ce9e7d-4422-4e9a-bbc9-8855549ebe2e',
    },
    unitCost: {
      universalIdentifier: 'c97d4717-7433-4ec0-9252-daca2ec92500',
    },
    lineItems: {
      universalIdentifier: 'a62c7d5c-e621-4e04-9bcf-06520ff49d17',
    },
  },
  lineItem: {
    ...buildStandardObjectSystemFields(
      STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.lineItem,
    ),
    product: {
      universalIdentifier: 'a5a2b43e-6a42-4815-94f1-b16b8917349b',
    },
    deal: { universalIdentifier: '6f30aad5-4a94-41f2-865c-4547c7cbb4ec' },
    name: { universalIdentifier: '216d3447-af05-453c-8bf9-01bf2a315b49' },
    term: { universalIdentifier: '6eb98a80-89d9-46b0-a228-044be9c024df' },
    billingFrequency: {
      universalIdentifier: '04177cf1-7061-48ef-a424-de7efd2ba164',
    },
    quantity: {
      universalIdentifier: 'fa07f116-c10e-4621-aef1-c2c8d9d7c2ba',
    },
    unitPrice: {
      universalIdentifier: '8a3b1e64-8b6f-42b7-8b33-37ae609f2b85',
    },
    unitDiscount: {
      universalIdentifier: '9cfaf65c-afc4-4a7f-bc1b-4da33bc74a36',
    },
    totalPrice: {
      universalIdentifier: '7ec17a65-4715-451e-bbbb-fa91b41652e5',
    },
  },
  segment: {
    ...buildStandardObjectSystemFields(
      STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.segment,
    ),
    name: { universalIdentifier: '453c4101-a03d-4743-b282-dc60ea8c0f47' },
    targetObject: {
      universalIdentifier: '5a1c9077-d655-4f0c-a4a6-854fd4d00672',
    },
    memberCount: {
      universalIdentifier: '4042b1c8-43bb-42f5-97c9-db1159b51aad',
    },
    segmentMembers: {
      universalIdentifier: 'bbe6c5fd-2271-4acb-8781-176763d082f8',
    },
    pulledFrom: {
      universalIdentifier: 'a7d6d259-01fe-4278-bbab-dfe7b19e5a7d',
    },
    pulledSegments: {
      universalIdentifier: '1946868d-5c4f-4572-96c5-d4f93f302d5e',
    },
    pullRelationFieldMetadataId: {
      universalIdentifier: 'f42738de-166d-4a32-90b4-30a459fbae32',
    },
  },
  segmentMember: {
    target: { universalIdentifier: 'e6fbeeb0-b479-4b01-9ca2-176a83651a3e' },
    ...buildStandardObjectSystemFields(
      STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.segmentMember,
    ),
    segment: { universalIdentifier: 'b3b9cacf-816d-40a1-a4c2-d32f048f5926' },
    targetCompany: {
      universalIdentifier: 'e3a6652d-ffb1-40e5-943f-e4f1fac31423',
    },
    targetPerson: {
      universalIdentifier: 'b3e5028e-02d4-4e80-aaab-5e133eadd160',
    },
    targetOpportunity: {
      universalIdentifier: '8a2e5e73-14e6-4f5b-aed2-60888772b6e8',
    },
  },
  recordShare: {
    ...buildStandardObjectSystemFields(
      STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.recordShare,
    ),
    recordId: {
      universalIdentifier: '01edb657-6339-475c-b581-784a0c3e0509',
    },
    objectMetadataId: {
      universalIdentifier: '504cec47-6aae-4e5b-85fd-1581b62602e3',
    },
    principalId: {
      universalIdentifier: 'c1849ee2-1d2a-409e-800d-16fc16621257',
    },
    principalType: {
      universalIdentifier: '556161f6-1a01-478e-8f01-acc413102e44',
    },
    accessLevel: {
      universalIdentifier: '943b9926-9620-43de-8a46-8ebfee74dea3',
    },
    rowCause: {
      universalIdentifier: 'be27640e-f739-4d07-8979-dba4526e406a',
    },
    sourceId: {
      universalIdentifier: '534a2244-9feb-4d21-afd9-c9a20052b300',
    },
  },
  shortLink: {
    ...buildStandardObjectSystemFields(
      STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.shortLink,
    ),
    authoredTemplateUrl: {
      universalIdentifier: '6f588340-ddff-4113-984b-c37c045d496c',
    },
    resolvedDestinationUrl: {
      universalIdentifier: '5ba068eb-0594-4945-9183-7174a37a9406',
    },
    templateAndResolvedUrlHash: {
      universalIdentifier: '175f7743-b027-4374-b577-6503679d00fc',
    },
  },
  task: {
    ...buildStandardObjectSystemFields(
      STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.task,
    ),
    recordSource: { universalIdentifier: '14762e20-45c5-4021-a6a3-15ecbff86401' },
    title: { universalIdentifier: '20202020-b386-4cb7-aa5a-08d4a4d92680' },
    bodyV2: { universalIdentifier: '20202020-4aa0-4ae8-898d-7df0afd47ab1' },
    dueAt: { universalIdentifier: '20202020-fd99-40da-951b-4cb9a352fce3' },
    status: { universalIdentifier: '20202020-70bc-48f9-89c5-6aa730b151e0' },
    taskTargets: {
      universalIdentifier: '20202020-de9c-4d0e-a452-713d4a3e5fc7',
    },
    attachments: {
      universalIdentifier: getSystemRelationFieldUniversalIdentifier({
        applicationUniversalIdentifier:
          TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
        objectUniversalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.task,
        relationTargetObjectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.attachment,
      }),
    },
    assignee: { universalIdentifier: '20202020-065a-4f42-a906-e20422c1753f' },
    timelineActivities: {
      universalIdentifier: getSystemRelationFieldUniversalIdentifier({
        applicationUniversalIdentifier:
          TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
        objectUniversalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.task,
        relationTargetObjectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.timelineActivity,
      }),
    },
  },
  taskTarget: {
    target: { universalIdentifier: '20202020-f636-435d-ab8d-e1168b375c71' },
    ...buildStandardObjectSystemFields(
      STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.taskTarget,
    ),
    task: { universalIdentifier: '20202020-e881-457a-8758-74aaef4ae78a' },
    targetPerson: {
      universalIdentifier: getSystemRelationFieldUniversalIdentifier({
        applicationUniversalIdentifier:
          TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.taskTarget,
        relationTargetObjectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person,
      }),
    },
    targetCompany: {
      universalIdentifier: getSystemRelationFieldUniversalIdentifier({
        applicationUniversalIdentifier:
          TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.taskTarget,
        relationTargetObjectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.company,
      }),
    },
    targetOpportunity: {
      universalIdentifier: getSystemRelationFieldUniversalIdentifier({
        applicationUniversalIdentifier:
          TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.taskTarget,
        relationTargetObjectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity,
      }),
    },
    targetService: {
      universalIdentifier: getSystemRelationFieldUniversalIdentifier({
        applicationUniversalIdentifier:
          TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.taskTarget,
        relationTargetObjectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.service,
      }),
    },
  },
  workflow: {
    ...buildStandardObjectSystemFields(
      STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workflow,
    ),
    name: { universalIdentifier: '20202020-b3d3-478f-acc0-5d901e725b20' },
    lastPublishedVersionId: {
      universalIdentifier: '20202020-326a-4fba-8639-3456c0a169e8',
    },
    coreWorkflowId: {
      universalIdentifier: '20202020-058a-42ad-8eb8-0662a5552aad',
    },
    statuses: { universalIdentifier: '20202020-357c-4432-8c50-8c31b4a552d9' },
    versions: { universalIdentifier: '20202020-9432-416e-8f3c-27ee3153d099' },
    runs: { universalIdentifier: '20202020-759b-4340-b58b-e73595c4df4f' },
    automatedTriggers: {
      universalIdentifier: '20202020-3319-4234-a34c-117ecad2b8a9',
    },
    timelineActivities: {
      universalIdentifier: getSystemRelationFieldUniversalIdentifier({
        applicationUniversalIdentifier:
          TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workflow,
        relationTargetObjectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.timelineActivity,
      }),
    },
    attachments: {
      universalIdentifier: getSystemRelationFieldUniversalIdentifier({
        applicationUniversalIdentifier:
          TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workflow,
        relationTargetObjectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.attachment,
      }),
    },
  },
  workflowAutomatedTrigger: {
    ...buildStandardObjectSystemFields(
      STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workflowAutomatedTrigger,
    ),
    type: {
      universalIdentifier: '20202020-3319-4234-a34c-3f92c1ab56e7',
    },
    settings: {
      universalIdentifier: '20202020-3319-4234-a34c-bac8f903de12',
    },
    workflow: {
      universalIdentifier: '20202020-3319-4234-a34c-8e1a4d2f7c03',
    },
  },
  workflowRun: {
    ...buildStandardObjectSystemFields(
      STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workflowRun,
    ),
    name: { universalIdentifier: '20202020-b840-4253-aef9-4e5013694587' },
    workflowVersion: {
      universalIdentifier: '20202020-2f52-4ba8-8dc4-d0d6adb9578d',
    },
    workflow: {
      universalIdentifier: '20202020-8c57-4e7f-84f5-f373f68e1b82',
    },
    enqueuedAt: {
      universalIdentifier: '20202020-f1e3-4de1-a461-b5c4fdbc861d',
    },
    startedAt: {
      universalIdentifier: '20202020-a234-4e2d-bd15-85bcea6bb183',
    },
    endedAt: { universalIdentifier: '20202020-e1c1-4b6b-bbbd-b2beaf2e159e' },
    status: { universalIdentifier: '20202020-6b3e-4f9c-8c2b-2e5b8e6d6f3b' },
    state: { universalIdentifier: '20202020-611f-45f3-9cde-d64927e8ec57' },
    stepLogs: {
      universalIdentifier: '20202020-7c4e-4e1a-8fc1-1e3a55d6c2a1',
    },
    coreWorkflowId: {
      universalIdentifier: 'e07d8ac0-6b6e-4685-81fa-50d82ae7f880',
    },
    coreWorkflowVersionId: {
      universalIdentifier: '58e3f476-425d-4c66-b391-779d0412e107',
    },
    timelineActivities: {
      universalIdentifier: getSystemRelationFieldUniversalIdentifier({
        applicationUniversalIdentifier:
          TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workflowRun,
        relationTargetObjectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.timelineActivity,
      }),
    },
  },
  workflowVersion: {
    ...buildStandardObjectSystemFields(
      STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workflowVersion,
    ),
    name: { universalIdentifier: '20202020-a12f-4cca-9937-a2e40cc65509' },
    workflow: {
      universalIdentifier: '20202020-afa3-46c3-91b0-0631ca6aa1c8',
    },
    trigger: {
      universalIdentifier: '20202020-4eae-43e7-86e0-212b41a30b48',
    },
    status: {
      universalIdentifier: '20202020-5a34-440e-8a25-39d8c3d1d4cf',
    },
    runs: { universalIdentifier: '20202020-1d08-46df-901a-85045f18099a' },
    steps: { universalIdentifier: '20202020-5988-4a64-b94a-1f9b7b989039' },
    coreWorkflowVersionId: {
      universalIdentifier: '20202020-58b4-46e8-b6d2-f1f3c74cf7f4',
    },
    timelineActivities: {
      universalIdentifier: getSystemRelationFieldUniversalIdentifier({
        applicationUniversalIdentifier:
          TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workflowVersion,
        relationTargetObjectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.timelineActivity,
      }),
    },
  },
  workspaceMember: {
    ...buildStandardObjectSystemFields(
      STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workspaceMember,
    ),
    name: { universalIdentifier: '20202020-e914-43a6-9c26-3603c59065f4' },
    colorScheme: {
      universalIdentifier: '20202020-66bc-47f2-adac-f2ef7c598b63',
    },
    uiScale: {
      universalIdentifier: '20202020-1581-4bfb-b87d-58fa9cd5b817',
    },
    openRecordIn: {
      universalIdentifier: '20202020-1b16-419d-9323-6f3ea850e5d9',
    },
    locale: {
      universalIdentifier: '20202020-402e-4695-b169-794fa015afbe',
    },
    avatarUrl: {
      universalIdentifier: '20202020-0ced-4c4f-a376-c98a966af3f6',
    },
    userEmail: {
      universalIdentifier: '20202020-4c5f-4e09-bebc-9e624e21ecf4',
    },
    jobTitle: {
      universalIdentifier: '20202020-4dd4-4619-826e-08f6c06b374d',
    },
    userId: {
      universalIdentifier: '20202020-75a9-4dfc-bf25-2e4b43e89820',
    },
    assignedTasks: {
      universalIdentifier: '20202020-61dc-4a1c-99e8-38ebf8d2bbeb',
    },
    ownedOpportunities: {
      universalIdentifier: '20202020-9e4d-4b3a-8c1f-6d7e8f9a0b1c',
    },
    assignedCalendarEvents: {
      universalIdentifier: 'ba4eca98-bb20-48d1-a108-98653cd20d33',
    },
    accountOwnerForCompanies: {
      universalIdentifier: '20202020-dc29-4bd4-a3c1-29eafa324bee',
    },
    messageParticipants: {
      universalIdentifier: '20202020-8f99-48bc-a5eb-edd33dd54188',
    },
    blocklist: {
      universalIdentifier: '20202020-6cb2-4161-9f29-a4b7f1283859',
    },
    calendarEventParticipants: {
      universalIdentifier: '20202020-0dbc-4841-9ce1-3e793b5b3512',
    },
    timelineActivities: {
      universalIdentifier: '20202020-e15b-47b8-94fe-8200e3c66615',
    },
    agentMessages: {
      universalIdentifier: '211b2717-450a-4f5f-808f-39695c819319',
    },
    agentChatThreads: {
      universalIdentifier: 'fbaf92a6-44ae-4b6d-9d10-2c15d84eaea1',
    },
    agentChatThreadParticipants: {
      universalIdentifier: 'd1de909f-a0eb-4e94-8903-abec012864c9',
    },
    agentMessageReactions: {
      universalIdentifier: '9242d7b0-bb3a-4bb6-a830-5e84e722c684',
    },
    assignedAgentChatThreads: {
      universalIdentifier: 'a89c46f5-cdb7-40e9-9a87-a8ecf0818c3c',
    },
    timeZone: {
      universalIdentifier: '20202020-2d33-4c21-a86e-5943b050dd54',
    },
    dateFormat: {
      universalIdentifier: '20202020-af13-4e11-b1e7-b8cf5ea13dc0',
    },
    timeFormat: {
      universalIdentifier: '20202020-8acb-4cf8-a851-a6ed443c8d81',
    },
    calendarStartDay: {
      universalIdentifier: '20202020-1ecc-4562-84c9-ff3a2f6cce85',
    },
    numberFormat: {
      universalIdentifier: '20202020-7f40-4e7f-b126-11c0eda6b141',
    },
    ownedPeople: {
      universalIdentifier: '2e493318-2fb6-46ac-b87b-abeb761cf7a3',
    },
    sdrOwnedPeople: {
      universalIdentifier: 'bbdb9c89-4a1d-4ffe-886c-00b1b7c106ea',
    },
    sdrOwnedCompanies: {
      universalIdentifier: 'c3edab47-d356-43da-8516-3e230a53e09b',
    },
    collaboratingOpportunities: {
      universalIdentifier: '6c559b88-f7ff-4b5d-b4fb-30737b4918b7',
    },
  },
} satisfies Record<string, Record<string, { universalIdentifier: string }>>;
