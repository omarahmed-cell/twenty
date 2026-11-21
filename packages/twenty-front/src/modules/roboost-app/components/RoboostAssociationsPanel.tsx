import { useObjectMetadataItems } from '@/object-metadata/hooks/useObjectMetadataItems';
import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { useOpenRoboostCreatePanel } from '@/roboost-app/hooks/useOpenRoboostCreatePanel';
import {
  type RoboostAssociationCard,
  RoboostAssociationGroup,
} from '@/roboost-app/components/RoboostAssociationGroup';
import { useRoboostRelatedRecords } from '@/roboost-app/hooks/useRoboostRelatedRecords';
import { formatRoboostDate } from '@/roboost-app/utils/formatRoboostDate';
import { formatRoboostFieldValue } from '@/roboost-app/utils/formatRoboostFieldValue';
import { getRoboostOptionTone } from '@/roboost-app/utils/getRoboostOptionTone';
import { getRoboostPersonName } from '@/roboost-app/utils/getRoboostPersonName';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { isNonEmptyString } from '@sniptt/guards';
import { useNavigateApp } from '~/hooks/useNavigateApp';
import { AppPath, CoreObjectNameSingular } from 'twenty-shared/types';
import { getAppPath, isDefined } from 'twenty-shared/utils';

const StyledPanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
`;

type RoboostAssociationsPanelProps = {
  companyObjectMetadataItem: EnrichedObjectMetadataItem;
  companyId: string;
  classicPagePath: string;
};

const getRecordPath = (objectNameSingular: string, recordId: string) =>
  getAppPath(AppPath.RecordShowPage, {
    objectNameSingular,
    objectRecordId: recordId,
  });

export const RoboostAssociationsPanel = ({
  companyObjectMetadataItem,
  companyId,
  classicPagePath,
}: RoboostAssociationsPanelProps) => {
  const { t } = useLingui();
  const navigateApp = useNavigateApp();
  const { objectMetadataItems } = useObjectMetadataItems();

  const findObject = (nameSingular: string | undefined) =>
    objectMetadataItems.find((item) => item.nameSingular === nameSingular);

  const contacts = useRoboostRelatedRecords({
    sourceObjectMetadataItem: companyObjectMetadataItem,
    relationFieldName: 'people',
    sourceRecordId: companyId,
    recordGqlFields: {
      id: true,
      name: true,
      jobTitle: true,
      emails: true,
      phones: true,
      avatarUrl: true,
      createdAt: true,
    },
  });

  const deals = useRoboostRelatedRecords({
    sourceObjectMetadataItem: companyObjectMetadataItem,
    relationFieldName: 'opportunities',
    sourceRecordId: companyId,
    recordGqlFields: {
      id: true,
      name: true,
      stage: true,
      amount: true,
      closeDate: true,
      createdAt: true,
    },
  });

  const serviceObject = findObject('service');
  const services = useRoboostRelatedRecords({
    sourceObjectMetadataItem: companyObjectMetadataItem,
    relationFieldName: 'services',
    sourceRecordId: companyId,
    recordGqlFields: {
      id: true,
      name: true,
      createdAt: true,
      ...(serviceObject?.fields.some((field) => field.name === 'stage')
        ? { stage: true }
        : {}),
      ...(serviceObject?.fields.some((field) => field.name === 'pipeline')
        ? { pipeline: true }
        : {}),
    },
  });

  const attachments = useRoboostRelatedRecords({
    sourceObjectMetadataItem: companyObjectMetadataItem,
    relationFieldName: 'attachments',
    sourceRecordId: companyId,
    joinColumnNameOverride: 'targetCompanyId',
    recordGqlFields: { id: true, name: true, createdAt: true },
  });

  const openCreatePanel = useOpenRoboostCreatePanel();

  const openCreate = (
    objectNameSingular: string | undefined,
    joinColumnName: string | undefined,
  ) => {
    if (!isDefined(objectNameSingular) || !isDefined(joinColumnName)) {
      return;
    }
    openCreatePanel({
      objectNameSingular,
      presetValues: { [joinColumnName]: companyId },
    });
  };

  const getSelectTag = (
    objectNameSingular: string | undefined,
    fieldName: string,
    value: unknown,
  ) => {
    const field = findObject(objectNameSingular)?.fields.find(
      (candidate) => candidate.name === fieldName,
    );
    const option = field?.options?.find(
      (candidate) => candidate.value === value,
    );

    return isDefined(option)
      ? {
          ...getRoboostOptionTone({ value: option.value, color: option.color }),
          label: option.label,
        }
      : undefined;
  };

  const formatField = (
    objectNameSingular: string | undefined,
    fieldName: string,
    value: unknown,
  ) => {
    const field = findObject(objectNameSingular)?.fields.find(
      (candidate) => candidate.name === fieldName,
    );

    return isDefined(field) ? formatRoboostFieldValue(field, value) : '—';
  };

  const withValue = (lines: { label: string; value: string }[]) =>
    lines.filter((line) => isNonEmptyString(line.value) && line.value !== '—');

  const contactCards: RoboostAssociationCard[] = contacts.records.map(
    (record) => ({
      id: record.id,
      name: getRoboostPersonName(record.name) || t`Untitled contact`,
      avatarUrl: record.avatarUrl,
      href: getRecordPath(CoreObjectNameSingular.Person, record.id),
      lines: withValue([
        { label: t`Title`, value: record.jobTitle ?? '' },
        {
          label: t`Email`,
          value: formatField('person', 'emails', record.emails),
        },
        {
          label: t`Phone`,
          value: formatField('person', 'phones', record.phones),
        },
      ]),
    }),
  );

  const dealCards: RoboostAssociationCard[] = deals.records.map((record) => {
    const tag = getSelectTag('opportunity', 'stage', record.stage);

    return {
      id: record.id,
      name: isNonEmptyString(record.name) ? record.name : t`Untitled deal`,
      href: getRecordPath(CoreObjectNameSingular.Opportunity, record.id),
      tag: isDefined(tag) ? { tone: tag.tone, label: tag.label } : undefined,
      lines: withValue([
        {
          label: t`Amount`,
          value: formatField('opportunity', 'amount', record.amount),
        },
        {
          label: t`Close`,
          value: formatRoboostDate(record.closeDate),
        },
      ]),
    };
  });

  const serviceCards: RoboostAssociationCard[] = services.records.map(
    (record) => {
      const tag = getSelectTag(
        services.targetObjectNameSingular,
        'stage',
        record.stage,
      );

      return {
        id: record.id,
        name: isNonEmptyString(record.name) ? record.name : t`Untitled service`,
        href: getRecordPath(
          services.targetObjectNameSingular ?? 'service',
          record.id,
        ),
        tag: isDefined(tag) ? { tone: tag.tone, label: tag.label } : undefined,
        lines: withValue([
          {
            label: t`Pipeline`,
            value: formatField(
              services.targetObjectNameSingular,
              'pipeline',
              record.pipeline,
            ),
          },
          { label: t`Created`, value: formatRoboostDate(record.createdAt) },
        ]),
      };
    },
  );

  const attachmentCards: RoboostAssociationCard[] = attachments.records.map(
    (record) => ({
      id: record.id,
      name: isNonEmptyString(record.name) ? record.name : t`Untitled file`,
      href: classicPagePath,
      lines: [{ label: t`Added`, value: formatRoboostDate(record.createdAt) }],
    }),
  );

  const getSettingsPath = (objectNameSingular: string | undefined) =>
    `/settings/objects/${findObject(objectNameSingular)?.namePlural ?? ''}`;

  return (
    <StyledPanel>
      {contacts.isAvailable && (
        <RoboostAssociationGroup
          title={t`Contacts`}
          count={contacts.totalCount}
          cards={contactCards}
          addLabel={t`Add contact`}
          onAdd={() =>
            openCreate(CoreObjectNameSingular.Person, contacts.joinColumnName)
          }
          settingsPath={getSettingsPath('person')}
          defaultOpen
          emptyLabel={t`No contacts yet.`}
        />
      )}
      {deals.isAvailable && (
        <RoboostAssociationGroup
          title={t`Deals`}
          count={deals.totalCount}
          cards={dealCards}
          addLabel={t`Add deal`}
          onAdd={() =>
            openCreate(CoreObjectNameSingular.Opportunity, deals.joinColumnName)
          }
          settingsPath={getSettingsPath('opportunity')}
          defaultOpen
          emptyLabel={t`No deals yet.`}
        />
      )}
      {services.isAvailable && (
        <RoboostAssociationGroup
          title={t`Services`}
          count={services.totalCount}
          cards={serviceCards}
          addLabel={t`Add service`}
          onAdd={() =>
            openCreate(
              services.targetObjectNameSingular,
              services.joinColumnName,
            )
          }
          settingsPath={getSettingsPath(services.targetObjectNameSingular)}
          defaultOpen={services.totalCount > 0}
          emptyLabel={t`No services yet.`}
        />
      )}
      {attachments.isAvailable && (
        <RoboostAssociationGroup
          title={t`Attachments`}
          count={attachments.totalCount}
          cards={attachmentCards}
          addLabel={t`Add file`}
          onAdd={() =>
            navigateApp(
              AppPath.RecordShowPage,
              {
                objectNameSingular: CoreObjectNameSingular.Company,
                objectRecordId: companyId,
              },
              { view: 'classic' },
            )
          }
          settingsPath={getSettingsPath('attachment')}
          defaultOpen={attachments.totalCount > 0}
          emptyLabel={t`No attachments yet.`}
        />
      )}
    </StyledPanel>
  );
};
