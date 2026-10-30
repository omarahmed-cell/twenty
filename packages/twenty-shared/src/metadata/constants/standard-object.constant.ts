import { STANDARD_OBJECT_FIELDS } from '@/metadata/constants/standard-object-fields.constant';
import { STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS } from '@/metadata/constants/standard-object-universal-identifiers.constant';
import { buildStandardObjectIndexView } from '@/metadata/utils/internal/build-standard-object-index-view.util';
import { buildStandardObjectRecordPageFieldsView } from '@/metadata/utils/internal/build-standard-object-record-page-fields-view.util';

// Never mutate an existing universal identifier, and delete one only rarely.
// Group names passed to buildStandardObjectRecordPageFieldsView MUST match the server's standard view-field-group builders.
export const STANDARD_OBJECTS = {
  attachment: {
    universalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.attachment,
    fields: STANDARD_OBJECT_FIELDS.attachment,
    morphIds: {
      targetMorphId: {
        morphId: STANDARD_OBJECT_FIELDS.attachment.target.universalIdentifier,
      },
    },
    indexes: {
      taskIdIndex: {
        universalIdentifier: 'b8d4f9a3-0c25-4e7b-9f6a-2d3e4c5b6f70',
      },
      noteIdIndex: {
        universalIdentifier: '9d31ea73-13b6-4e06-84ee-c66c72bf7787',
      },
      personIdIndex: {
        universalIdentifier: '55637a5a-1edc-4351-8d76-d40020bf8944',
      },
      companyIdIndex: {
        universalIdentifier: '4137ba06-184d-438f-b484-080f02a97659',
      },
      opportunityIdIndex: {
        universalIdentifier: '8cc162d1-c127-4981-878d-f78622f8f12d',
      },
      dashboardIdIndex: {
        universalIdentifier: 'c10eba2d-ff1a-4eab-9285-50481c12a003',
      },
      workflowIdIndex: {
        universalIdentifier: 'fadeab4b-79ee-4173-af79-72c51fbad888',
      },
      agentChatThreadIdIndex: {
        universalIdentifier: '69857371-6ff9-48fa-a9de-db4f71593431',
      },
      callIdIndex: {
        universalIdentifier: '3bd8ed36-0e01-4508-8b48-62af38aa00de',
      },
      communicationIdIndex: {
        universalIdentifier: '3aec16b7-3d7b-4027-8756-3b189c8b2765',
      },
    },
    views: {
      allAttachments: buildStandardObjectIndexView({
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.attachment,
        fields: STANDARD_OBJECT_FIELDS.attachment,
        viewFieldNames: [
          'name',
          'file',
          'createdBy',
          'createdAt',
          'targetPerson',
          'targetCompany',
          'targetOpportunity',
          'targetTask',
          'targetNote',
          'targetDashboard',
          'targetWorkflow',
        ],
      }),
      attachmentRecordPageFields: buildStandardObjectRecordPageFieldsView({
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.attachment,
        fields: STANDARD_OBJECT_FIELDS.attachment,
        viewFieldNames: ['createdBy', 'createdAt'],
        viewFieldGroupNames: {},
      }),
    },
  },
  blocklist: {
    universalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.blocklist,
    fields: STANDARD_OBJECT_FIELDS.blocklist,
    indexes: {
      workspaceMemberIdIndex: {
        universalIdentifier: '4daf320e-74d0-4f24-a45a-af3a09d741cb',
      },
    },
    views: {
      allBlocklists: buildStandardObjectIndexView({
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.blocklist,
        fields: STANDARD_OBJECT_FIELDS.blocklist,
        viewFieldNames: ['handle', 'workspaceMember', 'createdAt'],
      }),
      blocklistRecordPageFields: buildStandardObjectRecordPageFieldsView({
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.blocklist,
        fields: STANDARD_OBJECT_FIELDS.blocklist,
        viewFieldNames: ['workspaceMember', 'createdAt', 'createdBy'],
        viewFieldGroupNames: {
          general: 'General',
          system: 'System',
        },
      }),
    },
  },
  calendarChannelEventAssociation: {
    universalIdentifier:
      STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.calendarChannelEventAssociation,
    fields: STANDARD_OBJECT_FIELDS.calendarChannelEventAssociation,
    indexes: {
      calendarChannelIdIndex: {
        universalIdentifier: 'ff6b86c1-3112-4dfa-b734-c4789111a716',
      },
      calendarEventIdIndex: {
        universalIdentifier: '47a3c8d2-9f14-4b6e-8c5d-1a2b3f4e5c69',
      },
      eventExternalIdIndex: {
        universalIdentifier: 'b14d63d0-c1ab-470f-927d-9c0c05277caa',
      },
    },
    views: {
      allCalendarChannelEventAssociations: buildStandardObjectIndexView({
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.calendarChannelEventAssociation,
        fields: STANDARD_OBJECT_FIELDS.calendarChannelEventAssociation,
        viewFieldNames: [
          'calendarChannelId',
          'calendarEvent',
          'eventExternalId',
          'createdAt',
        ],
      }),
      calendarChannelEventAssociationRecordPageFields:
        buildStandardObjectRecordPageFieldsView({
          objectUniversalIdentifier:
            STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.calendarChannelEventAssociation,
          fields: STANDARD_OBJECT_FIELDS.calendarChannelEventAssociation,
          viewFieldNames: [
            'calendarChannelId',
            'calendarEvent',
            'eventExternalId',
            'createdAt',
            'createdBy',
          ],
          viewFieldGroupNames: {
            general: 'General',
            system: 'System',
          },
        }),
    },
  },
  calendarEventParticipant: {
    universalIdentifier:
      STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.calendarEventParticipant,
    fields: STANDARD_OBJECT_FIELDS.calendarEventParticipant,
    indexes: {
      calendarEventIdIndex: {
        universalIdentifier: 'c458ad97-8b95-43de-9003-88eb68576049',
      },
      personIdIndex: {
        universalIdentifier: '30e9b75a-881f-4a85-aaf1-f2d2464be1cf',
      },
      workspaceMemberIdIndex: {
        universalIdentifier: '898aa202-428f-4a7a-a3b3-8f0a17a6658e',
      },
    },
    views: {
      allCalendarEventParticipants: buildStandardObjectIndexView({
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.calendarEventParticipant,
        fields: STANDARD_OBJECT_FIELDS.calendarEventParticipant,
        viewFieldNames: [
          'calendarEvent',
          'handle',
          'displayName',
          'isOrganizer',
          'responseStatus',
          'person',
          'workspaceMember',
          'createdAt',
        ],
      }),
      calendarEventParticipantRecordPageFields:
        buildStandardObjectRecordPageFieldsView({
          objectUniversalIdentifier:
            STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.calendarEventParticipant,
          fields: STANDARD_OBJECT_FIELDS.calendarEventParticipant,
          viewFieldNames: [
            'calendarEvent',
            'handle',
            'displayName',
            'isOrganizer',
            'responseStatus',
            'person',
            'workspaceMember',
            'createdAt',
            'createdBy',
          ],
          viewFieldGroupNames: {
            general: 'General',
            system: 'System',
          },
        }),
    },
  },
  calendarEvent: {
    universalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.calendarEvent,
    fields: STANDARD_OBJECT_FIELDS.calendarEvent,
    indexes: {
      iCalUidIndex: {
        universalIdentifier: 'e38d1418-f994-4f0d-b0cd-41d4da240ea0',
      },
      assignedToIdIndex: {
        universalIdentifier: '432b9702-97f7-449c-a8db-a0916170cd83',
      },
    },
    views: {
      allCalendarEvents: buildStandardObjectIndexView({
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.calendarEvent,
        fields: STANDARD_OBJECT_FIELDS.calendarEvent,
        viewFieldNames: [
          'title',
          'startsAt',
          'endsAt',
          'isFullDay',
          'location',
          'conferenceLink',
          'isCanceled',
          'meetingOutcome',
          'assignedTo',
          'createdAt',
        ],
      }),
      calendarEventRecordPageFields: buildStandardObjectRecordPageFieldsView({
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.calendarEvent,
        fields: STANDARD_OBJECT_FIELDS.calendarEvent,
        viewFieldNames: [
          'title',
          'startsAt',
          'endsAt',
          'isFullDay',
          'isCanceled',
          'conferenceLink',
          'location',
          'description',
          'calendarEventTargets',
          'locationType',
          'meetingType',
          'meetingOutcome',
          'assignedTo',
          'externalCreatedAt',
          'externalUpdatedAt',
          'iCalUid',
          'conferenceSolution',
        ],
        viewFieldGroupNames: {
          general: 'General',
          system: 'System',
        },
      }),
    },
  },
  calendarEventTarget: {
    universalIdentifier:
      STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.calendarEventTarget,
    fields: STANDARD_OBJECT_FIELDS.calendarEventTarget,
    morphIds: {
      targetMorphId: {
        morphId:
          STANDARD_OBJECT_FIELDS.calendarEventTarget.target.universalIdentifier,
      },
    },
    indexes: {
      calendarEventIdIndex: {
        universalIdentifier: 'ce1c180c-0236-4673-ad1d-359dddf59f93',
      },
      personIdIndex: {
        universalIdentifier: 'f151bc84-ba45-40cb-b064-02ef359ac17b',
      },
      companyIdIndex: {
        universalIdentifier: '30413277-505d-4f08-be38-a56257460f9f',
      },
      opportunityIdIndex: {
        universalIdentifier: '7920092d-281f-473a-8ea4-53c209b36a37',
      },
      calendarEventPersonUniqueIndex: {
        universalIdentifier: '15b9e394-d451-4186-aaf0-612f6be1ea91',
      },
      calendarEventCompanyUniqueIndex: {
        universalIdentifier: '3fa22398-6e7d-47a5-95eb-4971f9d62135',
      },
      calendarEventOpportunityUniqueIndex: {
        universalIdentifier: 'c8183b17-5dfe-4e02-8d9d-aef8e54ef07d',
      },
      serviceIdIndex: {
        universalIdentifier: '887f5eb6-82ea-4cbb-bf51-ff6ad6bc7724',
      },
      calendarEventServiceUniqueIndex: {
        universalIdentifier: '5e331298-9ac9-4170-8b8d-e27cf37ef1f4',
      },
    },
    views: {},
  },
  call: {
    universalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.call,
    fields: STANDARD_OBJECT_FIELDS.call,
    indexes: {
      searchVectorGinIndex: {
        universalIdentifier: 'e4f82180-f1d1-4813-b6f1-577350523d07',
      },
    },
    views: {
      allCalls: buildStandardObjectIndexView({
        objectUniversalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.call,
        fields: STANDARD_OBJECT_FIELDS.call,
        viewFieldNames: [
          'title',
          'callTargets',
          'direction',
          'outcome',
          'bodyV2',
          'createdBy',
          'createdAt',
        ],
      }),
      callRecordPageFields: buildStandardObjectRecordPageFieldsView({
        objectUniversalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.call,
        fields: STANDARD_OBJECT_FIELDS.call,
        viewFieldNames: [
          'callTargets',
          'direction',
          'outcome',
          'createdAt',
          'createdBy',
          'attachments',
          'timelineActivities',
        ],
        viewFieldGroupNames: {
          general: 'General',
        },
      }),
    },
  },
  callTarget: {
    universalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.callTarget,
    fields: STANDARD_OBJECT_FIELDS.callTarget,
    morphIds: {
      targetMorphId: {
        morphId: STANDARD_OBJECT_FIELDS.callTarget.target.universalIdentifier,
      },
    },
    indexes: {
      callIdIndex: {
        universalIdentifier: '60e87ab0-ffff-43fc-9c0f-6cb740da6d3c',
      },
      personIdIndex: {
        universalIdentifier: 'a8b58d15-a1bb-4c60-991e-673c4fdda5e2',
      },
      companyIdIndex: {
        universalIdentifier: '99f304a7-ec05-4bc3-8c1f-379daee3fe7d',
      },
      opportunityIdIndex: {
        universalIdentifier: 'ab3ee2f9-2d91-4936-9128-6aa89cb98ad4',
      },
      serviceIdIndex: {
        universalIdentifier: '79b6bb77-e0b2-4606-b35e-522de4523a4b',
      },
      callPersonUniqueIndex: {
        universalIdentifier: 'c94fdcea-f90e-4bda-aa46-0926b3b22d26',
      },
      callCompanyUniqueIndex: {
        universalIdentifier: '0c383184-0d22-4cdd-935b-78f893e9a9fc',
      },
      callOpportunityUniqueIndex: {
        universalIdentifier: 'acae3e53-8b56-4277-8fa1-9f722d22b70b',
      },
      callServiceUniqueIndex: {
        universalIdentifier: '1951aad5-fb4a-4618-bdf7-338dbf2c8f12',
      },
    },
    views: {
      allCallTargets: buildStandardObjectIndexView({
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.callTarget,
        fields: STANDARD_OBJECT_FIELDS.callTarget,
        viewFieldNames: [
          'id',
          'call',
          'targetPerson',
          'targetCompany',
          'targetOpportunity',
          'targetService',
        ],
      }),
    },
  },
  communication: {
    universalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.communication,
    fields: STANDARD_OBJECT_FIELDS.communication,
    indexes: {
      searchVectorGinIndex: {
        universalIdentifier: 'eadec858-6de0-4770-a9d1-11436bcb1f73',
      },
    },
    views: {
      allCommunications: buildStandardObjectIndexView({
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.communication,
        fields: STANDARD_OBJECT_FIELDS.communication,
        viewFieldNames: [
          'title',
          'communicationTargets',
          'channelType',
          'direction',
          'bodyV2',
          'createdBy',
          'createdAt',
        ],
      }),
      communicationRecordPageFields: buildStandardObjectRecordPageFieldsView({
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.communication,
        fields: STANDARD_OBJECT_FIELDS.communication,
        viewFieldNames: [
          'communicationTargets',
          'channelType',
          'direction',
          'createdAt',
          'createdBy',
          'attachments',
          'timelineActivities',
        ],
        viewFieldGroupNames: {
          general: 'General',
        },
      }),
    },
  },
  communicationTarget: {
    universalIdentifier:
      STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.communicationTarget,
    fields: STANDARD_OBJECT_FIELDS.communicationTarget,
    morphIds: {
      targetMorphId: {
        morphId:
          STANDARD_OBJECT_FIELDS.communicationTarget.target.universalIdentifier,
      },
    },
    indexes: {
      communicationIdIndex: {
        universalIdentifier: '8b8357e7-374a-416e-a96c-6a7a0af9a299',
      },
      personIdIndex: {
        universalIdentifier: '62878271-acf2-4428-8679-9a7641bd0fa8',
      },
      companyIdIndex: {
        universalIdentifier: '2ccaefbe-1ce9-4f36-9c16-c155efb598f8',
      },
      opportunityIdIndex: {
        universalIdentifier: '6700a2cc-105f-463c-8752-af1422d66d0b',
      },
      serviceIdIndex: {
        universalIdentifier: '741dd1be-9ac2-478e-97bf-dfeb9e0717b4',
      },
      communicationPersonUniqueIndex: {
        universalIdentifier: '615f6e3b-66b9-4855-bb56-8c919e42a229',
      },
      communicationCompanyUniqueIndex: {
        universalIdentifier: '90fb3590-ee0d-4ce0-ac08-a9145160da30',
      },
      communicationOpportunityUniqueIndex: {
        universalIdentifier: 'ea524389-12bf-4cf9-9bf3-e618a55eb991',
      },
      communicationServiceUniqueIndex: {
        universalIdentifier: '7f7fc1ec-9461-475e-88a2-7d009b132002',
      },
    },
    views: {
      allCommunicationTargets: buildStandardObjectIndexView({
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.communicationTarget,
        fields: STANDARD_OBJECT_FIELDS.communicationTarget,
        viewFieldNames: [
          'id',
          'communication',
          'targetPerson',
          'targetCompany',
          'targetOpportunity',
          'targetService',
        ],
      }),
    },
  },
  callRecording: {
    universalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.callRecording,
    fields: STANDARD_OBJECT_FIELDS.callRecording,
    indexes: {
      calendarEventIdIndex: {
        universalIdentifier: '8be3cc47-9352-4a1b-ad19-bb186bc0865d',
      },
    },
    views: {
      allCallRecordings: buildStandardObjectIndexView({
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.callRecording,
        fields: STANDARD_OBJECT_FIELDS.callRecording,
        viewFieldNames: [
          'status',
          'recordingRequestStatus',
          'title',
          'startedAt',
        ],
      }),
      callRecordingRecordPageFields: buildStandardObjectRecordPageFieldsView({
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.callRecording,
        fields: STANDARD_OBJECT_FIELDS.callRecording,
        viewFieldNames: [
          'title',
          'status',
          'recordingRequestStatus',
          'startedAt',
          'endedAt',
          'video',
          'audio',
          'transcript',
          'summary',
        ],
        viewFieldGroupNames: {
          general: 'General',
        },
      }),
    },
  },
  company: {
    universalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.company,
    fields: STANDARD_OBJECT_FIELDS.company,
    indexes: {
      accountOwnerIdIndex: {
        universalIdentifier: 'ec2ebfc9-0c9b-4597-a87d-aa295e2d8bfe',
      },
      domainNameUniqueIndex: {
        universalIdentifier: 'dd300c61-f422-467a-91f4-de4f83c4175b',
      },
      parentCompanyIdIndex: {
        universalIdentifier: '42690d5f-4acc-4ba0-887e-99cc21f72246',
      },
      searchVectorGinIndex: {
        universalIdentifier: 'c3eb62df-2cc1-4cc3-b7aa-e96a4d65c633',
      },
    },
    views: {
      allCompanies: buildStandardObjectIndexView({
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.company,
        fields: STANDARD_OBJECT_FIELDS.company,
        viewFieldNames: [
          'name',
          'domainName',
          'createdBy',
          'accountOwner',
          'createdAt',
          'linkedinLink',
          'address',
        ],
      }),
      companyRecordPageFields: buildStandardObjectRecordPageFieldsView({
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.company,
        fields: STANDARD_OBJECT_FIELDS.company,
        viewFieldNames: [
          'domainName',
          'accountOwner',
          'annualRevenue',
          'linkedinLink',
          'address',
          'parentCompany',
          'createdAt',
          'createdBy',
          'updatedAt',
          'updatedBy',
          'people',
          'taskTargets',
          'noteTargets',
          'opportunities',
          'attachments',
          'timelineActivities',
          'services',
          'childCompanies',
          'callTargets',
          'communicationTargets',
        ],
        viewFieldGroupNames: {
          general: 'General',
          business: 'Business',
          contact: 'Contact',
          system: 'System',
        },
      }),
    },
  },
  dashboard: {
    universalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.dashboard,
    fields: STANDARD_OBJECT_FIELDS.dashboard,
    indexes: {
      searchVectorGinIndex: {
        universalIdentifier: 'e69f71aa-de0f-4b70-845f-7a8369c47928',
      },
    },
    views: {
      allDashboards: buildStandardObjectIndexView({
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.dashboard,
        fields: STANDARD_OBJECT_FIELDS.dashboard,
        viewFieldNames: ['title', 'createdBy', 'createdAt', 'updatedAt'],
      }),
    },
  },
  messageCampaign: {
    universalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.messageCampaign,
    fields: STANDARD_OBJECT_FIELDS.messageCampaign,
    indexes: {
      unsubscribeTopicIdIndex: {
        universalIdentifier: 'efe8c20e-d12b-4475-969e-e86e0bbfe444',
      },
      listIdIndex: {
        universalIdentifier: '17bffd6a-714a-458d-a547-f9e2183d9520',
      },
      searchVectorGinIndex: {
        universalIdentifier: '975823ad-9b97-4f39-b2c7-fbd7d77f4bd1',
      },
    },
    views: {
      allMessageCampaigns: buildStandardObjectIndexView({
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.messageCampaign,
        fields: STANDARD_OBJECT_FIELDS.messageCampaign,
        viewFieldNames: [
          'name',
          'subject',
          'status',
          'list',
          'fromAddress',
          'scheduledAt',
          'sentAt',
          'recipients',
          'createdAt',
        ],
      }),
      messageCampaignList: {
        universalIdentifier: '99ca5417-e5e0-4fd4-8e64-67acd7b21e25',
        viewFields: {
          name: {
            universalIdentifier: 'fcda0c3b-7ee3-40dd-b280-da3ff4da5452',
          },
          subject: {
            universalIdentifier: '700087d2-bd10-4ab9-b8a9-b0710146927c',
          },
          status: {
            universalIdentifier: 'ff29b192-5a52-42a1-8a1e-1a03d26f5464',
          },
          list: {
            universalIdentifier: '8e28bc70-eaa0-4768-bb13-606571e65ac8',
          },
          fromAddress: {
            universalIdentifier: 'b9798ecc-de06-4717-8b42-057181437dbc',
          },
          scheduledAt: {
            universalIdentifier: 'caba5417-964d-416c-a5a9-b64ef71e5964',
          },
          sentAt: {
            universalIdentifier: '9d546249-b029-4b01-8389-65a88ae583c8',
          },
          recipients: {
            universalIdentifier: 'e065a2d1-1352-4869-b527-58e3c37557c0',
          },
          createdAt: {
            universalIdentifier: '27548f0a-5ed4-4412-b23a-718b99eb697e',
          },
        },
      },
      messageCampaignRecordPageFields: buildStandardObjectRecordPageFieldsView({
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.messageCampaign,
        fields: STANDARD_OBJECT_FIELDS.messageCampaign,
        viewFieldNames: [
          'status',
          'scheduledAt',
          'sentAt',
          'sentCount',
          'deliveredCount',
          'failedCount',
          'skippedCount',
          'bouncedCount',
          'complainedCount',
          'uniqueClickCount',
          'clickRate',
          'uniqueOpenCount',
          'openRate',
        ],
        viewFieldGroupNames: {
          stats: 'Stats',
        },
      }),
    },
  },
  messageList: {
    universalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.messageList,
    fields: STANDARD_OBJECT_FIELDS.messageList,
    indexes: {
      searchVectorGinIndex: {
        universalIdentifier: '8e205171-ed74-4620-b7d2-674aab85033a',
      },
    },
    views: {
      allMessageLists: buildStandardObjectIndexView({
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.messageList,
        fields: STANDARD_OBJECT_FIELDS.messageList,
        viewFieldNames: [
          'name',
          'description',
          'members',
          'campaigns',
          'createdAt',
        ],
      }),
    },
  },
  messageListMember: {
    universalIdentifier:
      STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.messageListMember,
    fields: STANDARD_OBJECT_FIELDS.messageListMember,
    indexes: {
      listIdIndex: {
        universalIdentifier: '61188470-6dcb-4b2a-b1a9-baeb688bccae',
      },
      personListUniqueIndex: {
        universalIdentifier: 'e5497dc2-1d72-418c-a389-a0645ca0195a',
      },
    },
    views: {
      allMessageListMembers: buildStandardObjectIndexView({
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.messageListMember,
        fields: STANDARD_OBJECT_FIELDS.messageListMember,
        viewFieldNames: ['id', 'person', 'list', 'createdAt'],
      }),
    },
  },
  messageChannelMessageAssociation: {
    universalIdentifier:
      STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.messageChannelMessageAssociation,
    fields: STANDARD_OBJECT_FIELDS.messageChannelMessageAssociation,
    indexes: {
      messageChannelIdIndex: {
        universalIdentifier: '9894f9a3-0225-4e7b-9f6a-23d4e2576784',
      },
      messageIdIndex: {
        universalIdentifier: '9bb24d40-60dd-4beb-8c64-a74e8c67f9ee',
      },
      messageChannelIdMessageIdUniqueIndex: {
        universalIdentifier: '1b86ece8-7ce3-4df3-8771-fd4b5d45b2f2',
      },
    },
    views: {
      allMessageChannelMessageAssociations: buildStandardObjectIndexView({
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.messageChannelMessageAssociation,
        fields: STANDARD_OBJECT_FIELDS.messageChannelMessageAssociation,
        viewFieldNames: [
          'messageChannelId',
          'message',
          'messageExternalId',
          'direction',
          'createdAt',
        ],
      }),
      messageChannelMessageAssociationRecordPageFields:
        buildStandardObjectRecordPageFieldsView({
          objectUniversalIdentifier:
            STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.messageChannelMessageAssociation,
          fields: STANDARD_OBJECT_FIELDS.messageChannelMessageAssociation,
          viewFieldNames: [
            'messageChannelId',
            'message',
            'messageExternalId',
            'direction',
            'createdAt',
            'createdBy',
          ],
          viewFieldGroupNames: {
            general: 'General',
            system: 'System',
          },
        }),
    },
  },
  messageChannelMessageAssociationMessageFolder: {
    universalIdentifier:
      STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.messageChannelMessageAssociationMessageFolder,
    fields:
      STANDARD_OBJECT_FIELDS.messageChannelMessageAssociationMessageFolder,
    indexes: {
      messageChannelMessageAssociationIdIndex: {
        universalIdentifier: '8e6038aa-1f79-4a84-87b5-f33caa172e98',
      },
      messageFolderIdIndex: {
        universalIdentifier: '905299c3-ca81-435d-901c-f68b87562516',
      },
      messageChannelMessageAssociationIdMessageFolderIdUniqueIndex: {
        universalIdentifier: 'a3de1788-5dff-4849-ac5a-0dabe5fab216',
      },
    },
    views: {
      allMessageChannelMessageAssociationMessageFolders:
        buildStandardObjectIndexView({
          objectUniversalIdentifier:
            STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.messageChannelMessageAssociationMessageFolder,
          fields:
            STANDARD_OBJECT_FIELDS.messageChannelMessageAssociationMessageFolder,
          viewFieldNames: [
            'messageChannelMessageAssociation',
            'messageFolderId',
            'createdAt',
          ],
        }),
      messageChannelMessageAssociationMessageFolderRecordPageFields:
        buildStandardObjectRecordPageFieldsView({
          objectUniversalIdentifier:
            STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.messageChannelMessageAssociationMessageFolder,
          fields:
            STANDARD_OBJECT_FIELDS.messageChannelMessageAssociationMessageFolder,
          viewFieldNames: [
            'messageChannelMessageAssociation',
            'messageFolderId',
            'createdAt',
            'createdBy',
          ],
          viewFieldGroupNames: {
            general: 'General',
            system: 'System',
          },
        }),
    },
  },
  messageParticipant: {
    universalIdentifier:
      STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.messageParticipant,
    fields: STANDARD_OBJECT_FIELDS.messageParticipant,
    indexes: {
      messageIdIndex: {
        universalIdentifier: 'ab0863ba-f95e-493c-b86c-56e1bc7e5bc2',
      },
      personIdIndex: {
        universalIdentifier: 'df805c2e-3bfe-4d51-8309-75e5eb4052fe',
      },
      workspaceMemberIdIndex: {
        universalIdentifier: 'ce1e3a9e-afe9-439d-abb7-6cc98a6fa405',
      },
      messageCampaignIdIndex: {
        universalIdentifier: 'e9bcdd77-cc8b-4532-833c-124dfdc8e5ff',
      },
    },
    views: {
      allMessageParticipants: buildStandardObjectIndexView({
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.messageParticipant,
        fields: STANDARD_OBJECT_FIELDS.messageParticipant,
        viewFieldNames: [
          'message',
          'role',
          'handle',
          'displayName',
          'person',
          'workspaceMember',
          'createdAt',
        ],
      }),
      messageParticipantRecordPageFields:
        buildStandardObjectRecordPageFieldsView({
          objectUniversalIdentifier:
            STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.messageParticipant,
          fields: STANDARD_OBJECT_FIELDS.messageParticipant,
          viewFieldNames: [
            'message',
            'role',
            'displayName',
            'person',
            'workspaceMember',
            'createdAt',
            'createdBy',
          ],
          viewFieldGroupNames: {
            general: 'General',
            system: 'System',
          },
        }),
    },
  },
  messageThread: {
    universalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.messageThread,
    fields: STANDARD_OBJECT_FIELDS.messageThread,
    indexes: {},
    views: {
      allMessageThreads: buildStandardObjectIndexView({
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.messageThread,
        fields: STANDARD_OBJECT_FIELDS.messageThread,
        viewFieldNames: ['subject', 'messages', 'updatedAt', 'createdAt'],
      }),
    },
  },
  messageThreadTarget: {
    universalIdentifier:
      STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.messageThreadTarget,
    fields: STANDARD_OBJECT_FIELDS.messageThreadTarget,
    morphIds: {
      targetMorphId: {
        morphId:
          STANDARD_OBJECT_FIELDS.messageThreadTarget.target.universalIdentifier,
      },
    },
    indexes: {
      messageThreadIdIndex: {
        universalIdentifier: '222fdd8b-0863-4f2a-816a-29745537b6b6',
      },
      personIdIndex: {
        universalIdentifier: '280ee419-ac3c-4599-bd62-3e5cb268342c',
      },
      companyIdIndex: {
        universalIdentifier: 'b98005e4-3811-41b6-82d0-3ccd27757eba',
      },
      opportunityIdIndex: {
        universalIdentifier: '7679ee05-cf6c-40a7-9ee6-c3e8053caca5',
      },
      messageThreadPersonUniqueIndex: {
        universalIdentifier: '087f97cb-8c3c-4ea1-9556-933acde6c83b',
      },
      messageThreadCompanyUniqueIndex: {
        universalIdentifier: '30d4f1af-8b6f-4685-802f-8a7cf29f318b',
      },
      messageThreadOpportunityUniqueIndex: {
        universalIdentifier: '1dc0e37e-afb1-4e90-90b4-052374126a6a',
      },
      serviceIdIndex: {
        universalIdentifier: 'a7ceabe5-ecb0-4508-932c-c51ac3d50382',
      },
      messageThreadServiceUniqueIndex: {
        universalIdentifier: '808ee479-7cc6-449c-afd7-ea95da1ca467',
      },
    },
    views: {},
  },
  message: {
    universalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.message,
    fields: STANDARD_OBJECT_FIELDS.message,
    indexes: {
      messageThreadIdIndex: {
        universalIdentifier: '7a05b45e-7aa6-4a7e-9bbc-299cbed53c96',
      },
      messageCampaignIdIndex: {
        universalIdentifier: '79e777ca-7008-46c5-b3a6-3108b7c7dfb6',
      },
      headerMessageIdIndex: {
        universalIdentifier: '0904b3e4-6052-4a8d-bf41-f12a27c7e34a',
      },
    },
    views: {
      allMessages: buildStandardObjectIndexView({
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.message,
        fields: STANDARD_OBJECT_FIELDS.message,
        viewFieldNames: [
          'subject',
          'messageThread',
          'messageParticipants',
          'receivedAt',
          'headerMessageId',
          'text',
          'createdAt',
        ],
      }),
      messageRecordPageFields: buildStandardObjectRecordPageFieldsView({
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.message,
        fields: STANDARD_OBJECT_FIELDS.message,
        viewFieldNames: [
          'messageThread',
          'messageParticipants',
          'receivedAt',
          'text',
          'headerMessageId',
          'createdAt',
          'createdBy',
        ],
        viewFieldGroupNames: {
          general: 'General',
          system: 'System',
        },
      }),
    },
  },
  note: {
    universalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.note,
    fields: STANDARD_OBJECT_FIELDS.note,
    indexes: {
      searchVectorGinIndex: {
        universalIdentifier: '8183c8d2-9114-4b6e-8c5d-12a3b14a5a13',
      },
    },
    views: {
      allNotes: buildStandardObjectIndexView({
        objectUniversalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.note,
        fields: STANDARD_OBJECT_FIELDS.note,
        viewFieldNames: [
          'title',
          'noteTargets',
          'bodyV2',
          'createdBy',
          'createdAt',
        ],
      }),
      noteRecordPageFields: buildStandardObjectRecordPageFieldsView({
        objectUniversalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.note,
        fields: STANDARD_OBJECT_FIELDS.note,
        viewFieldNames: ['noteTargets', 'attachments', 'timelineActivities'],
        viewFieldGroupNames: {
          general: 'General',
        },
      }),
    },
  },
  noteTarget: {
    universalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.noteTarget,
    fields: STANDARD_OBJECT_FIELDS.noteTarget,
    morphIds: {
      targetMorphId: {
        morphId: STANDARD_OBJECT_FIELDS.noteTarget.target.universalIdentifier,
      },
    },
    indexes: {
      noteIdIndex: {
        universalIdentifier: '9294d9e3-0225-4c7f-9d6e-23b4c25b6b24',
      },
      personIdIndex: {
        universalIdentifier: '7c069dc0-e83b-4cd5-aaa2-cac7f3e00d80',
      },
      companyIdIndex: {
        universalIdentifier: '2d83909a-a383-4e82-b00a-8b7739f3f906',
      },
      opportunityIdIndex: {
        universalIdentifier: '0d1a59b4-cc87-4b7d-804a-656e8504f371',
      },
      notePersonUniqueIndex: {
        universalIdentifier: '29be76d1-ff4f-4f0f-b05c-f679a234e90a',
      },
      noteCompanyUniqueIndex: {
        universalIdentifier: 'e3b92659-04cf-4496-8fd4-4f32c747c26a',
      },
      noteOpportunityUniqueIndex: {
        universalIdentifier: '58002741-8aa7-4812-b7af-f4cf98dd2433',
      },
      serviceIdIndex: {
        universalIdentifier: 'ba440ea3-4b1f-44e7-8cf8-0742f34b5f28',
      },
      noteServiceUniqueIndex: {
        universalIdentifier: '67fbcd2c-eab4-405d-b26a-ea593e451450',
      },
    },
    views: {
      allNoteTargets: buildStandardObjectIndexView({
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.noteTarget,
        fields: STANDARD_OBJECT_FIELDS.noteTarget,
        viewFieldNames: [
          'id',
          'note',
          'targetPerson',
          'targetCompany',
          'targetOpportunity',
          'targetService',
        ],
      }),
    },
  },
  opportunity: {
    universalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity,
    fields: STANDARD_OBJECT_FIELDS.opportunity,
    indexes: {
      pointOfContactIdIndex: {
        universalIdentifier: 'b8c2a673-a981-4357-a43d-313a358e4daa',
      },
      companyIdIndex: {
        universalIdentifier: 'e161072d-37b1-477a-b944-ef0d65289574',
      },
      stageIndex: {
        universalIdentifier: 'ae60d580-b562-44f2-a24d-7b8040063f83',
      },
      searchVectorGinIndex: {
        universalIdentifier: 'f53fdd28-a26b-47ba-81b5-6813ad622720',
      },
    },
    views: {
      allOpportunities: buildStandardObjectIndexView({
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity,
        fields: STANDARD_OBJECT_FIELDS.opportunity,
        viewFieldNames: [
          'name',
          'amount',
          'createdBy',
          'closeDate',
          'company',
          'pointOfContact',
        ],
      }),
      byStage: {
        universalIdentifier: '20202020-a004-4a04-8a04-0aa0b1ca1ba0',
        viewFields: {
          name: {
            universalIdentifier: '20202020-af04-4a04-8a04-0aa0b2ca2baf',
          },
          amount: {
            universalIdentifier: '20202020-af04-4a04-8a04-0aa0b2ca2bb0',
          },
          createdBy: {
            universalIdentifier: '20202020-af04-4a04-8a04-0aa0b2ca2bb1',
          },
          closeDate: {
            universalIdentifier: '20202020-af04-4a04-8a04-0aa0b2ca2bb2',
          },
          company: {
            universalIdentifier: '20202020-af04-4a04-8a04-0aa0b2ca2bb3',
          },
          pointOfContact: {
            universalIdentifier: '20202020-af04-4a04-8a04-0aa0b2ca2bb4',
          },
        },
        viewGroups: {
          new: {
            universalIdentifier: '20202020-af14-4a04-8a04-0aa0b2ca2bf1',
          },
          screening: {
            universalIdentifier: '20202020-af14-4a04-8a04-0aa0b2ca2bf2',
          },
          meeting: {
            universalIdentifier: '20202020-af14-4a04-8a04-0aa0b2ca2bf3',
          },
          proposal: {
            universalIdentifier: '20202020-af14-4a04-8a04-0aa0b2ca2bf4',
          },
          customer: {
            universalIdentifier: '20202020-af14-4a04-8a04-0aa0b2ca2bf5',
          },
        },
      },
      opportunityRecordPageFields: buildStandardObjectRecordPageFieldsView({
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity,
        fields: STANDARD_OBJECT_FIELDS.opportunity,
        viewFieldNames: [
          'amount',
          'closeDate',
          'stage',
          'company',
          'pointOfContact',
          'owner',
          'createdAt',
          'createdBy',
          'updatedAt',
          'updatedBy',
          'taskTargets',
          'noteTargets',
          'attachments',
          'timelineActivities',
          'services',
          'lineItems',
          'callTargets',
          'communicationTargets',
        ],
        viewFieldGroupNames: {
          deal: 'Deal',
          relations: 'Relations',
          system: 'System',
        },
      }),
    },
  },
  person: {
    universalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person,
    fields: STANDARD_OBJECT_FIELDS.person,
    indexes: {
      companyIdIndex: {
        universalIdentifier: '8a265a5c-d3ae-47dc-bdf9-b42cfa2ba639',
      },
      emailsUniqueIndex: {
        universalIdentifier: '8183a8b2-9114-4f6c-8a5b-12e3f14e5e13',
      },
      searchVectorGinIndex: {
        universalIdentifier: '9294b9c3-0225-4a7d-9b6c-23f4a25f6f24',
      },
    },
    views: {
      allPeople: buildStandardObjectIndexView({
        objectUniversalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person,
        fields: STANDARD_OBJECT_FIELDS.person,
        viewFieldNames: [
          'name',
          'emails',
          'createdBy',
          'company',
          'phones',
          'createdAt',
          'jobTitle',
          'linkedinLink',
        ],
      }),
      personRecordPageFields: buildStandardObjectRecordPageFieldsView({
        objectUniversalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person,
        fields: STANDARD_OBJECT_FIELDS.person,
        viewFieldNames: [
          'emails',
          'phones',
          'company',
          'jobTitle',
          'linkedinLink',
          'avatarUrl',
          'createdAt',
          'createdBy',
          'updatedAt',
          'updatedBy',
          'avatarFile',
          'pointOfContactForOpportunities',
          'taskTargets',
          'noteTargets',
          'attachments',
          'messageParticipants',
          'calendarEventParticipants',
          'timelineActivities',
          'services',
          'callTargets',
          'communicationTargets',
        ],
        viewFieldGroupNames: {
          general: 'General',
          work: 'Work',
          social: 'Social',
          system: 'System',
        },
      }),
      messageListRecordPageMembers: {
        universalIdentifier: 'bef79e8e-9ef3-4458-81ed-78a299e2566f',
        viewFields: {
          name: {
            universalIdentifier: 'a4f0d7b4-3956-44a6-8bb2-df45a699609b',
          },
          emails: {
            universalIdentifier: '180e9cbb-34c2-4e27-8648-2915be88a50e',
          },
          company: {
            universalIdentifier: '3db54119-df4d-449b-91c9-22fca1e5d599',
          },
        },
        viewFilters: {
          listMembershipsListIsCurrentRecord: {
            universalIdentifier: '256dceea-a9b5-42b7-8461-a6ce62e7fa6c',
          },
        },
      },
    },
  },
  service: {
    universalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.service,
    fields: STANDARD_OBJECT_FIELDS.service,
    indexes: {
      companyIdIndex: {
        universalIdentifier: '917d0dd4-c7e2-4cab-8fbb-73cd2b0b5335',
      },
      pointOfContactIdIndex: {
        universalIdentifier: 'a323060e-3c73-4415-be78-fdef56247788',
      },
      opportunityIdIndex: {
        universalIdentifier: '773c96f3-6540-4517-933b-9264dbd872ef',
      },
      searchVectorGinIndex: {
        universalIdentifier: 'bde7f1c3-9e77-49bd-9fa4-58df4494668c',
      },
    },
    views: {
      allServices: buildStandardObjectIndexView({
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.service,
        fields: STANDARD_OBJECT_FIELDS.service,
        viewFieldNames: [
          'name',
          'company',
          'pointOfContact',
          'opportunity',
          'createdBy',
          'createdAt',
        ],
      }),
      serviceRecordPageFields: buildStandardObjectRecordPageFieldsView({
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.service,
        fields: STANDARD_OBJECT_FIELDS.service,
        viewFieldNames: [
          'company',
          'pointOfContact',
          'opportunity',
          'createdAt',
          'createdBy',
          'updatedAt',
          'updatedBy',
          'timelineActivities',
          'noteTargets',
          'taskTargets',
          'callTargets',
          'communicationTargets',
          'messageThreadTargets',
          'calendarEventTargets',
        ],
        viewFieldGroupNames: {
          relations: 'Relations',
          system: 'System',
        },
      }),
    },
  },
  product: {
    universalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.product,
    fields: STANDARD_OBJECT_FIELDS.product,
    indexes: {
      searchVectorGinIndex: {
        universalIdentifier: '38628aca-524b-4abe-bad8-85657446ad88',
      },
    },
    views: {
      allProducts: buildStandardObjectIndexView({
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.product,
        fields: STANDARD_OBJECT_FIELDS.product,
        viewFieldNames: [
          'name',
          'sku',
          'productType',
          'billingFrequency',
          'unitPrice',
          'unitCost',
          'createdAt',
        ],
      }),
      productRecordPageFields: buildStandardObjectRecordPageFieldsView({
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.product,
        fields: STANDARD_OBJECT_FIELDS.product,
        viewFieldNames: [
          'sku',
          'description',
          'productType',
          'billingFrequency',
          'unitPrice',
          'unitCost',
          'createdAt',
          'createdBy',
          'updatedAt',
          'updatedBy',
          'lineItems',
        ],
        viewFieldGroupNames: {
          general: 'General',
          system: 'System',
        },
      }),
    },
  },
  lineItem: {
    universalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.lineItem,
    fields: STANDARD_OBJECT_FIELDS.lineItem,
    indexes: {
      productIdIndex: {
        universalIdentifier: '2e74ad7c-eb84-4c1d-94d4-63f6c5a0531e',
      },
      dealIdIndex: {
        universalIdentifier: '455d4930-db47-4ecb-8098-059308f50eb5',
      },
      searchVectorGinIndex: {
        universalIdentifier: '4143982d-a14a-4424-9b53-7e450a9cec9d',
      },
    },
    views: {
      allLineItems: buildStandardObjectIndexView({
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.lineItem,
        fields: STANDARD_OBJECT_FIELDS.lineItem,
        viewFieldNames: [
          'name',
          'deal',
          'product',
          'term',
          'billingFrequency',
          'quantity',
          'unitPrice',
          'unitDiscount',
          'totalPrice',
        ],
      }),
      dealRecordPageLineItems: {
        universalIdentifier: 'fbee3008-ded1-4fda-9356-17f2ed2e5477',
        viewFields: {
          name: {
            universalIdentifier: '0cd09a78-1f02-42d6-b4af-8ac66b7e131b',
          },
          term: {
            universalIdentifier: 'bc2b740d-9b53-4670-80cb-1ff79cb09d31',
          },
          billingFrequency: {
            universalIdentifier: '275702f1-92c3-49e3-b540-e8e06ceddb09',
          },
          quantity: {
            universalIdentifier: 'c919e403-12df-4506-a627-52b4154b09ca',
          },
          unitPrice: {
            universalIdentifier: '08b544de-8a0d-41fd-9012-41f83b4b8e62',
          },
          unitDiscount: {
            universalIdentifier: 'c2f2af17-edb2-45cc-a6c9-540f994e387e',
          },
          totalPrice: {
            universalIdentifier: '4398d6e8-6d02-45d2-ba19-27a40aa471fb',
          },
        },
        viewFilters: {
          dealIsCurrentRecord: {
            universalIdentifier: 'ee801174-f93a-445d-bf72-227ea96eeffb',
          },
        },
      },
      lineItemRecordPageFields: buildStandardObjectRecordPageFieldsView({
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.lineItem,
        fields: STANDARD_OBJECT_FIELDS.lineItem,
        viewFieldNames: [
          'product',
          'deal',
          'term',
          'billingFrequency',
          'quantity',
          'unitPrice',
          'unitDiscount',
          'totalPrice',
          'createdAt',
          'createdBy',
          'updatedAt',
          'updatedBy',
        ],
        viewFieldGroupNames: {
          general: 'General',
          system: 'System',
        },
      }),
    },
  },
  segment: {
    universalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.segment,
    fields: STANDARD_OBJECT_FIELDS.segment,
    indexes: {
      searchVectorGinIndex: {
        universalIdentifier: 'eeff4f45-4230-41a5-bb8f-a27e26177f4f',
      },
      pulledFromIdIndex: {
        universalIdentifier: '7feecaa1-c24b-4fcc-8f40-1cda2fc02ca3',
      },
    },
    views: {
      allSegments: buildStandardObjectIndexView({
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.segment,
        fields: STANDARD_OBJECT_FIELDS.segment,
        viewFieldNames: [
          'name',
          'targetObject',
          'memberCount',
          'createdBy',
          'createdAt',
        ],
      }),
      segmentRecordPageFields: buildStandardObjectRecordPageFieldsView({
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.segment,
        fields: STANDARD_OBJECT_FIELDS.segment,
        viewFieldNames: [
          'targetObject',
          'memberCount',
          'pulledFrom',
          'createdAt',
          'createdBy',
          'updatedAt',
          'updatedBy',
        ],
        viewFieldGroupNames: {
          general: 'General',
          system: 'System',
        },
      }),
    },
  },
  segmentMember: {
    universalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.segmentMember,
    fields: STANDARD_OBJECT_FIELDS.segmentMember,
    morphIds: {
      targetMorphId: {
        morphId:
          STANDARD_OBJECT_FIELDS.segmentMember.target.universalIdentifier,
      },
    },
    indexes: {
      segmentIdIndex: {
        universalIdentifier: 'ee673e17-7fea-4c3b-83a7-9c4f19fe806d',
      },
      companyIdIndex: {
        universalIdentifier: 'bcec488d-b1e0-4cdb-9a63-9ae8643eedda',
      },
      personIdIndex: {
        universalIdentifier: '7691990b-f014-447b-83cf-cd2abe605430',
      },
      opportunityIdIndex: {
        universalIdentifier: 'c9e80ce3-9067-45e7-9dcc-90c943bc91c4',
      },
      segmentCompanyUniqueIndex: {
        universalIdentifier: '7d559224-ebe3-4ed7-b1ed-5caf82440310',
      },
      segmentPersonUniqueIndex: {
        universalIdentifier: '466fe804-5cd3-4bbc-b494-8c084067634d',
      },
      segmentOpportunityUniqueIndex: {
        universalIdentifier: 'c0fc1d2a-1ea8-4db0-9180-c56c16278ccd',
      },
    },
    views: {
      allSegmentMembers: buildStandardObjectIndexView({
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.segmentMember,
        fields: STANDARD_OBJECT_FIELDS.segmentMember,
        viewFieldNames: [
          'id',
          'segment',
          'targetCompany',
          'targetPerson',
          'targetOpportunity',
          'createdBy',
          'createdAt',
        ],
      }),
    },
  },
  recordShare: {
    universalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.recordShare,
    fields: STANDARD_OBJECT_FIELDS.recordShare,
    indexes: {
      recordPrincipalCauseSourceUniqueIndex: {
        universalIdentifier: '4580f104-47a7-4110-87a8-26cb6f63ce7b',
      },
      principalIdIndex: {
        universalIdentifier: '66fbc3d2-6126-4e29-a306-dbe9995bf062',
      },
      sourceIdIndex: {
        universalIdentifier: '21b84593-c647-40ce-bdf4-a8b4ac658f57',
      },
    },
    views: {},
  },
  shortLink: {
    universalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.shortLink,
    fields: STANDARD_OBJECT_FIELDS.shortLink,
    indexes: {
      templateAndResolvedUrlHashUniqueIndex: {
        universalIdentifier: 'b1330e3c-bd74-4bd1-a9dc-1ecefe41f199',
      },
    },
    views: {},
  },
  task: {
    universalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.task,
    fields: STANDARD_OBJECT_FIELDS.task,
    indexes: {
      assigneeIdIndex: {
        universalIdentifier: 'f48fa3b1-0cec-44da-a9e5-f8a5e766637e',
      },
      searchVectorGinIndex: {
        universalIdentifier: 'a86b32b3-01d3-4302-a152-8b7f247db7b4',
      },
    },
    views: {
      allTasks: buildStandardObjectIndexView({
        objectUniversalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.task,
        fields: STANDARD_OBJECT_FIELDS.task,
        viewFieldNames: [
          'title',
          'status',
          'taskTargets',
          'createdBy',
          'dueAt',
          'assignee',
          'bodyV2',
          'createdAt',
        ],
      }),
      assignedToMe: {
        universalIdentifier: '20202020-a007-4a07-8a07-ba5ca551aaed',
        viewFields: {
          title: {
            universalIdentifier: '20202020-af07-4a07-8a07-ba5ca551aaed',
          },
          taskTargets: {
            universalIdentifier: '20202020-af07-4a07-8a07-ba5ca551aaee',
          },
          createdBy: {
            universalIdentifier: '20202020-af07-4a07-8a07-ba5ca551aaef',
          },
          dueAt: {
            universalIdentifier: '20202020-af07-4a07-8a07-ba5ca551aaf0',
          },
          assignee: {
            universalIdentifier: '20202020-af07-4a07-8a07-ba5ca551aaf1',
          },
          bodyV2: {
            universalIdentifier: '20202020-af07-4a07-8a07-ba5ca551aaf2',
          },
          createdAt: {
            universalIdentifier: '20202020-af07-4a07-8a07-ba5ca551aaf3',
          },
        },
        viewFilters: {
          assigneeIsMe: {
            universalIdentifier: '20202020-af17-4a07-8a07-ba5ca551abf1',
          },
        },
        viewGroups: {
          todo: {
            universalIdentifier: '20202020-af17-4a07-8a07-ba5ca551abf2',
          },
          inProgress: {
            universalIdentifier: '20202020-af17-4a07-8a07-ba5ca551abf3',
          },
          done: {
            universalIdentifier: '20202020-af17-4a07-8a07-ba5ca551abf4',
          },
          empty: {
            universalIdentifier: '20202020-af17-4a07-8a07-ba5ca551abf5',
          },
        },
      },
      byStatus: {
        universalIdentifier: '20202020-a008-4a08-8a08-ba5cba51aba5',
        viewFields: {
          title: {
            universalIdentifier: '20202020-af08-4a08-8a08-ba5cba5babf0',
          },
          status: {
            universalIdentifier: '20202020-af08-4a08-8a08-ba5cba5babf1',
          },
          dueAt: {
            universalIdentifier: '20202020-af08-4a08-8a08-ba5cba5babf2',
          },
          assignee: {
            universalIdentifier: '20202020-af08-4a08-8a08-ba5cba5babf3',
          },
          createdAt: {
            universalIdentifier: '20202020-af08-4a08-8a08-ba5cba5babf4',
          },
        },
        viewGroups: {
          todo: {
            universalIdentifier: '20202020-af18-4a08-8a08-ba5cba5bbf01',
          },
          inProgress: {
            universalIdentifier: '20202020-af18-4a08-8a08-ba5cba5bbf02',
          },
          done: {
            universalIdentifier: '20202020-af18-4a08-8a08-ba5cba5bbf03',
          },
        },
      },
      taskRecordPageFields: buildStandardObjectRecordPageFieldsView({
        objectUniversalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.task,
        fields: STANDARD_OBJECT_FIELDS.task,
        viewFieldNames: [
          'dueAt',
          'status',
          'assignee',
          'taskTargets',
          'attachments',
          'timelineActivities',
        ],
        viewFieldGroupNames: {
          general: 'General',
        },
      }),
    },
  },
  taskTarget: {
    universalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.taskTarget,
    fields: STANDARD_OBJECT_FIELDS.taskTarget,
    morphIds: {
      targetMorphId: {
        morphId: STANDARD_OBJECT_FIELDS.taskTarget.target.universalIdentifier,
      },
    },
    indexes: {
      taskIdIndex: {
        universalIdentifier: 'c882f7a4-b025-4d32-aa26-5ef2595bdbf9',
      },
      personIdIndex: {
        universalIdentifier: 'b7d305d1-6fae-4ed6-9bdc-354fe9032c0e',
      },
      companyIdIndex: {
        universalIdentifier: 'c0af54c7-751b-4bb2-b102-677cc4e47402',
      },
      opportunityIdIndex: {
        universalIdentifier: '6942e0ba-90f6-4c33-bf40-7f00b1ec35ab',
      },
      taskPersonUniqueIndex: {
        universalIdentifier: '4adf4d5a-ad69-4c5c-bc62-2807816b3aa8',
      },
      taskCompanyUniqueIndex: {
        universalIdentifier: '637dce5e-f609-49f4-89e3-c0ef9e330d3a',
      },
      taskOpportunityUniqueIndex: {
        universalIdentifier: 'eb5422ff-7a41-48d2-a2df-3de1cbf7bced',
      },
      serviceIdIndex: {
        universalIdentifier: 'c70be6ea-67c3-4161-91b9-65f1aa1399de',
      },
      taskServiceUniqueIndex: {
        universalIdentifier: '0d55346a-a531-413c-8ef0-89772b22ef56',
      },
    },
    views: {
      allTaskTargets: buildStandardObjectIndexView({
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.taskTarget,
        fields: STANDARD_OBJECT_FIELDS.taskTarget,
        viewFieldNames: [
          'id',
          'task',
          'targetPerson',
          'targetCompany',
          'targetOpportunity',
          'targetService',
        ],
      }),
    },
  },
  timelineActivity: {
    universalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.timelineActivity,
    fields: STANDARD_OBJECT_FIELDS.timelineActivity,
    morphIds: {
      targetMorphId: {
        morphId:
          STANDARD_OBJECT_FIELDS.timelineActivity.target.universalIdentifier,
      },
    },
    indexes: {
      workspaceMemberIdIndex: {
        universalIdentifier: '5e0b2391-85ca-4a66-aef4-52d74245bec2',
      },
      personIdIndex: {
        universalIdentifier: '3e89a914-7bec-47bd-9cf9-743c6b83d001',
      },
      companyIdIndex: {
        universalIdentifier: '8183e8f2-9114-4d6a-8e5f-12c3d14c5c13',
      },
      opportunityIdIndex: {
        universalIdentifier: '9294f9a3-0225-4e7b-9f6a-23d4e25d6d24',
      },
      noteIdIndex: {
        universalIdentifier: '995db1d8-0d3e-40f7-b0eb-5e6897bc9966',
      },
      taskIdIndex: {
        universalIdentifier: '609cf622-86ef-48d1-812b-e1cab610a46c',
      },
      workflowIdIndex: {
        universalIdentifier: 'd6059ec2-92b0-4cfc-9fd8-78050f03108f',
      },
      workflowVersionIdIndex: {
        universalIdentifier: 'd94329b3-5dc8-4141-ae28-31afe28f7135',
      },
      workflowRunIdIndex: {
        universalIdentifier: '1a2bd046-7c23-4e0a-9f8a-c3ca3a16d3b9',
      },
      dashboardIdIndex: {
        universalIdentifier: 'e8821da9-728d-470a-bf5b-5a981fff7880',
      },
      messageListIdIndex: {
        universalIdentifier: 'a251f71a-c698-4526-8817-0e7c803c158e',
      },
      messageCampaignIdIndex: {
        universalIdentifier: 'e808e721-91cc-4b9b-b24b-806d64b4d5e2',
      },
      serviceIdIndex: {
        universalIdentifier: 'e9cd6149-5ea4-4c6b-95af-107f48cc8d8c',
      },
      callIdIndex: {
        universalIdentifier: '4eefa3a6-f80c-4dda-a4dc-9c584de02e40',
      },
      communicationIdIndex: {
        universalIdentifier: '755f8b6e-9b3a-4d73-8231-5bac3bd49786',
      },
    },
    views: {
      allTimelineActivities: buildStandardObjectIndexView({
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.timelineActivity,
        fields: STANDARD_OBJECT_FIELDS.timelineActivity,
        viewFieldNames: [
          'linkedRecordCachedName',
          'happensAt',
          'workspaceMember',
          'targetPerson',
          'targetCompany',
          'targetOpportunity',
          'targetTask',
          'targetNote',
          'targetWorkflow',
          'targetWorkflowVersion',
          'targetWorkflowRun',
          'targetDashboard',
        ],
      }),
    },
  },
  workflow: {
    universalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workflow,
    fields: STANDARD_OBJECT_FIELDS.workflow,
    indexes: {
      searchVectorGinIndex: {
        universalIdentifier: 'c7e64c55-eb0c-4b93-b076-5cfcf2e2e042',
      },
    },
    views: {
      allWorkflows: buildStandardObjectIndexView({
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workflow,
        fields: STANDARD_OBJECT_FIELDS.workflow,
        viewFieldNames: [
          'name',
          'statuses',
          'updatedAt',
          'createdBy',
          'versions',
          'runs',
        ],
      }),
    },
  },
  workflowAutomatedTrigger: {
    universalIdentifier:
      STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workflowAutomatedTrigger,
    fields: STANDARD_OBJECT_FIELDS.workflowAutomatedTrigger,
    indexes: {
      workflowIdIndex: {
        universalIdentifier: '7331ff89-a3f9-4ac0-9fa9-0de5663ae7b2',
      },
    },
    views: {
      allWorkflowAutomatedTriggers: buildStandardObjectIndexView({
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workflowAutomatedTrigger,
        fields: STANDARD_OBJECT_FIELDS.workflowAutomatedTrigger,
        viewFieldNames: ['type', 'workflow', 'createdAt'],
      }),
      workflowAutomatedTriggerRecordPageFields:
        buildStandardObjectRecordPageFieldsView({
          objectUniversalIdentifier:
            STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workflowAutomatedTrigger,
          fields: STANDARD_OBJECT_FIELDS.workflowAutomatedTrigger,
          viewFieldNames: ['type', 'workflow', 'createdAt', 'createdBy'],
          viewFieldGroupNames: {
            general: 'General',
            system: 'System',
          },
        }),
    },
  },
  workflowRun: {
    universalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workflowRun,
    fields: STANDARD_OBJECT_FIELDS.workflowRun,
    indexes: {
      workflowVersionIdIndex: {
        universalIdentifier: '8183c8d2-9114-4b6e-8c5d-12a3b14a5a14',
      },
      workflowIdIndex: {
        universalIdentifier: '9294d9e3-0225-4c7f-9d6e-23b4c25b6b25',
      },
      searchVectorGinIndex: {
        universalIdentifier: 'e0ac5ad2-d0c8-4f72-b710-8e53b9dc18d9',
      },
    },
    views: {
      allWorkflowRuns: buildStandardObjectIndexView({
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workflowRun,
        fields: STANDARD_OBJECT_FIELDS.workflowRun,
        viewFieldNames: ['name', 'workflow', 'status'],
      }),
      workflowRunRecordPageFields: buildStandardObjectRecordPageFieldsView({
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workflowRun,
        fields: STANDARD_OBJECT_FIELDS.workflowRun,
        viewFieldNames: [
          'status',
          'workflow',
          'workflowVersion',
          'startedAt',
          'endedAt',
          'createdAt',
          'createdBy',
          'enqueuedAt',
          'state',
          'updatedAt',
          'updatedBy',
          'timelineActivities',
        ],
        viewFieldGroupNames: {
          general: 'General',
          system: 'System',
        },
      }),
    },
  },
  workflowVersion: {
    universalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workflowVersion,
    fields: STANDARD_OBJECT_FIELDS.workflowVersion,
    indexes: {
      workflowIdIndex: {
        universalIdentifier: '8138c3b3-0b14-4ee1-be0e-debdde6b3219',
      },
      searchVectorGinIndex: {
        universalIdentifier: '6f3a65eb-2aee-4108-b8a0-c62da419d1dc',
      },
    },
    views: {
      allWorkflowVersions: buildStandardObjectIndexView({
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workflowVersion,
        fields: STANDARD_OBJECT_FIELDS.workflowVersion,
        viewFieldNames: ['name', 'workflow', 'status', 'updatedAt', 'runs'],
      }),
      workflowVersionRecordPageFields: buildStandardObjectRecordPageFieldsView({
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workflowVersion,
        fields: STANDARD_OBJECT_FIELDS.workflowVersion,
        viewFieldNames: [
          'status',
          'workflow',
          'trigger',
          'createdAt',
          'steps',
          'createdBy',
          'updatedAt',
          'updatedBy',
          'runs',
          'timelineActivities',
        ],
        viewFieldGroupNames: {
          general: 'General',
          system: 'System',
        },
      }),
    },
  },
  workspaceMember: {
    universalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workspaceMember,
    fields: STANDARD_OBJECT_FIELDS.workspaceMember,
    indexes: {
      userEmailUniqueIndex: {
        universalIdentifier: '76da5f27-523c-44b6-ad06-12954f6b949f',
      },
      searchVectorGinIndex: {
        universalIdentifier: '8678dde9-a804-4a9e-80e3-9af35e471ec5',
      },
    },
    views: {
      allWorkspaceMembers: buildStandardObjectIndexView({
        objectUniversalIdentifier:
          STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workspaceMember,
        fields: STANDARD_OBJECT_FIELDS.workspaceMember,
        viewFieldNames: [
          'name',
          'createdAt',
          'ownedOpportunities',
          'assignedTasks',
        ],
      }),
    },
  },
  agentChatThread: {
    universalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.agentChatThread,
    fields: STANDARD_OBJECT_FIELDS.agentChatThread,
    indexes: {
      workspaceMemberIndex: {
        universalIdentifier: '079f2dd7-6c11-4eae-be8a-cce2d1bee0fb',
      },
      assigneeIndex: {
        universalIdentifier: 'a65524f8-c999-448b-b9f4-c9ecce15fd13',
      },
    },
  },
  agentChatThreadParticipant: {
    universalIdentifier:
      STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.agentChatThreadParticipant,
    fields: STANDARD_OBJECT_FIELDS.agentChatThreadParticipant,
    indexes: {
      threadWorkspaceMemberUniqueIndex: {
        universalIdentifier: 'e5bbe244-cf74-49a3-938a-e6fff7a8710b',
      },
      workspaceMemberIndex: {
        universalIdentifier: '73d8bb5d-18eb-47bb-89e6-12d8f89aecf6',
      },
    },
  },
  agentChatThreadTarget: {
    universalIdentifier:
      STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.agentChatThreadTarget,
    fields: STANDARD_OBJECT_FIELDS.agentChatThreadTarget,
    morphIds: {
      targetMorphId: {
        morphId:
          STANDARD_OBJECT_FIELDS.agentChatThreadTarget.target
            .universalIdentifier,
      },
    },
    indexes: {
      threadIdIndex: {
        universalIdentifier: '19291d2c-15ab-43a0-91f7-1694b34813dd',
      },
      personIdIndex: {
        universalIdentifier: 'fe9c48d0-5b2a-4a51-bd47-f9205ea0c09d',
      },
      companyIdIndex: {
        universalIdentifier: 'ab45593a-3614-41c8-aab1-20aa91f1095c',
      },
      opportunityIdIndex: {
        universalIdentifier: 'b68e2031-73c6-4bc4-b062-5f795539e452',
      },
      threadPersonUniqueIndex: {
        universalIdentifier: '5a12050f-4de2-4076-aecc-959b863e14b2',
      },
      threadCompanyUniqueIndex: {
        universalIdentifier: 'd9067628-fd16-4843-955b-5fd47fea52a9',
      },
      threadOpportunityUniqueIndex: {
        universalIdentifier: '1b9bec10-2788-40be-9435-44937b9f7018',
      },
    },
    views: {},
  },
  agentTurn: {
    universalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.agentTurn,
    fields: STANDARD_OBJECT_FIELDS.agentTurn,
    indexes: {
      agentIndex: {
        universalIdentifier: '606e8ba3-f322-426b-bef8-2208f67a541a',
      },
      threadIndex: {
        universalIdentifier: '7d351559-4546-4307-ba28-de9fc4c40ef4',
      },
    },
  },
  agentMessage: {
    universalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.agentMessage,
    fields: STANDARD_OBJECT_FIELDS.agentMessage,
    indexes: {
      agentIndex: {
        universalIdentifier: '465b20e1-d4cd-4d80-a85b-78bd1f0e70ad',
      },
      threadIndex: {
        universalIdentifier: '2054f1a5-554f-42ac-a41a-b8ccd6ba72ec',
      },
      turnIndex: {
        universalIdentifier: 'dc46f804-a55f-4283-884e-9cb938741da3',
      },
      senderWorkspaceMemberIndex: {
        universalIdentifier: '8ecdac01-7bbe-411e-8461-6ff265c90759',
      },
    },
  },
  agentMessageReaction: {
    universalIdentifier:
      STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.agentMessageReaction,
    fields: STANDARD_OBJECT_FIELDS.agentMessageReaction,
    indexes: {
      messageWorkspaceMemberEmojiUniqueIndex: {
        universalIdentifier: '4089a239-e2d0-4e3e-83e8-e9b555a8a31d',
      },
      workspaceMemberIndex: {
        universalIdentifier: '565d89ab-2c11-4ebe-aaaf-8dbc4d79a9e5',
      },
    },
  },
  agentMessagePart: {
    universalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.agentMessagePart,
    fields: STANDARD_OBJECT_FIELDS.agentMessagePart,
    indexes: {
      messageOrderIndex: {
        universalIdentifier: 'f5a08f6f-cf91-4996-9c21-2af64a17ca83',
      },
    },
  },
  campaignDelivery: {
    universalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.campaignDelivery,
    fields: STANDARD_OBJECT_FIELDS.campaignDelivery,
    indexes: {
      campaignPersonUniqueIndex: {
        universalIdentifier: '8d719548-d34f-4891-bbc9-e0e09f0e363b',
      },
      expiredClaimIndex: {
        universalIdentifier: 'a4d7e8ed-0008-4f6a-a20c-a2b821487481',
      },
      countsIndex: {
        universalIdentifier: '1ea1ae7a-158f-436a-95a0-e9c998ad94f7',
      },
      claimTokenIndex: {
        universalIdentifier: '91640dcd-3f6b-4378-b284-bb02cc8b81ec',
      },
      providerMessageIdUniqueIndex: {
        universalIdentifier: '4de6f73d-ef3a-4c80-b71a-88739213f1c0',
      },
    },
  },
  messageSuppression: {
    universalIdentifier:
      STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.messageSuppression,
    fields: STANDARD_OBJECT_FIELDS.messageSuppression,
    indexes: {
      emailAddressTopicUniqueIndex: {
        universalIdentifier: 'a6c1f4dc-d925-49f9-8205-3e7f95545966',
      },
    },
  },
} as const satisfies Record<
  string,
  {
    universalIdentifier: string;
    morphIds?: Record<string, { morphId: string }>;
    fields: Record<string, { universalIdentifier: string }>;
    indexes: Record<string, { universalIdentifier: string }>;
    views?: Record<
      string,
      {
        universalIdentifier: string;
        viewFields: Record<string, { universalIdentifier: string }>;
        viewFieldGroups?: Record<string, { universalIdentifier: string }>;
        viewFilters?: Record<string, { universalIdentifier: string }>;
        viewGroups?: Record<string, { universalIdentifier: string }>;
      }
    >;
  }
>;
