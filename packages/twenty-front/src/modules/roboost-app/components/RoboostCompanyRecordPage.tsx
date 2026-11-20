import { useObjectMetadataItem } from '@/object-metadata/hooks/useObjectMetadataItem';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { useFindOneRecord } from '@/object-record/hooks/useFindOneRecord';
import {
  type RoboostActivitySubTab,
  RoboostActivityColumn,
  type RoboostRecordMainTab,
} from '@/roboost-app/components/RoboostActivityColumn';
import { RoboostAssociationsPanel } from '@/roboost-app/components/RoboostAssociationsPanel';
import { RoboostPropertySection } from '@/roboost-app/components/RoboostPropertySection';
import { RoboostRecordQuickActions } from '@/roboost-app/components/RoboostRecordQuickActions';
import { RoboostTopBarTitleEffect } from '@/roboost-app/components/RoboostTopBarTitleEffect';
import { useRoboostActivityFeed } from '@/roboost-app/hooks/useRoboostActivityFeed';
import { useRoboostPropertySections } from '@/roboost-app/hooks/useRoboostPropertySections';
import { roboostRecordLeftPanelCollapsedState } from '@/roboost-app/states/roboostRecordLeftPanelCollapsedState';
import { roboostRecordRightPanelCollapsedState } from '@/roboost-app/states/roboostRecordRightPanelCollapsedState';
import { getRoboostAvatarTone } from '@/roboost-app/utils/getRoboostAvatarTone';
import { getRoboostDomainLabel } from '@/roboost-app/utils/getRoboostDomainLabel';
import {
  getRoboostPersonName,
  type RoboostFullName,
} from '@/roboost-app/utils/getRoboostPersonName';
import { getRoboostRecordPageGqlFields } from '@/roboost-app/utils/getRoboostRecordPageGqlFields';
import { Avatar } from '@/roboost-ui/components/Avatar';
import { Button } from '@/roboost-ui/components/Button';
import { Icon } from '@/roboost-ui/components/Icon';
import { Menu } from '@/roboost-ui/components/Menu';
import { RecordLayout } from '@/roboost-ui/components/RecordLayout';
import { ROBOOST_UI_THEME } from '@/roboost-ui/constants/RoboostUiTheme';
import { useAtomState } from '@/ui/utilities/state/jotai/hooks/useAtomState';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { isNonEmptyString } from '@sniptt/guards';
import { Fragment, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppPath, CoreObjectNameSingular } from 'twenty-shared/types';
import { getAppPath, isDefined } from 'twenty-shared/utils';

const StyledScroll = styled.div`
  display: flex;
  flex: 1 1 auto;
  min-height: 0;
  min-width: 0;
  overflow-y: auto;
`;

const StyledLeft = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
`;

const StyledLeftTop = styled.div`
  align-items: center;
  display: flex;
  gap: 8px;
`;

const StyledBackLink = styled(Link)`
  align-items: center;
  color: ${ROBOOST_UI_THEME.textSecondary};
  display: inline-flex;
  font-size: 13px;
  font-weight: 500;
  gap: 4px;
  line-height: 16px;
  text-decoration: none;

  &:hover {
    color: ${ROBOOST_UI_THEME.accentText};
  }
`;

const StyledSpacer = styled.span`
  flex: 1;
`;

const StyledIdentity = styled.div`
  align-items: flex-start;
  display: flex;
  gap: 12px;
  min-width: 0;
`;

const StyledIdentityText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
`;

const StyledName = styled.div`
  color: ${ROBOOST_UI_THEME.text};
  font-family: ${ROBOOST_UI_THEME.fontDisplay};
  font-size: 16px;
  font-weight: 600;
  line-height: 20px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StyledDomain = styled.a`
  color: ${ROBOOST_UI_THEME.accentText};
  font-size: 13px;
  line-height: 16px;
  overflow: hidden;
  text-decoration: none;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StyledOwner = styled.div`
  color: ${ROBOOST_UI_THEME.text};
  font-size: 12px;
  line-height: 16px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StyledOwnerLabel = styled.span`
  color: ${ROBOOST_UI_THEME.textMuted};
`;

const StyledDivider = styled.div`
  background: ${ROBOOST_UI_THEME.borderSubtle};
  height: 1px;
`;

const StyledMessage = styled.div`
  color: ${ROBOOST_UI_THEME.textMuted};
  font-size: 13px;
  padding: 40px;
  text-align: center;
`;

type MemberRecord = {
  id: string;
  name?: RoboostFullName;
  __typename: string;
};

type RoboostCompanyRecordPageProps = { companyId: string };

export const RoboostCompanyRecordPage = ({
  companyId,
}: RoboostCompanyRecordPageProps) => {
  const { t } = useLingui();
  const { objectMetadataItem } = useObjectMetadataItem({
    objectNameSingular: CoreObjectNameSingular.Company,
  });

  const [mainTab, setMainTab] = useState<RoboostRecordMainTab>('activities');
  const [subTab, setSubTab] = useState<RoboostActivitySubTab>('all');
  const [roboostRecordLeftPanelCollapsed, setRoboostRecordLeftPanelCollapsed] =
    useAtomState(roboostRecordLeftPanelCollapsedState);
  const [
    roboostRecordRightPanelCollapsed,
    setRoboostRecordRightPanelCollapsed,
  ] = useAtomState(roboostRecordRightPanelCollapsedState);

  const { record, loading } = useFindOneRecord({
    objectNameSingular: CoreObjectNameSingular.Company,
    objectRecordId: companyId,
    recordGqlFields: getRoboostRecordPageGqlFields(objectMetadataItem),
  });

  const sections = useRoboostPropertySections(objectMetadataItem);
  const { items: feedItems, loading: feedLoading } = useRoboostActivityFeed({
    targetRecordId: companyId,
    targetObjectNameSingular: CoreObjectNameSingular.Company,
  });

  const { records: members } = useFindManyRecords<MemberRecord>({
    objectNameSingular: CoreObjectNameSingular.WorkspaceMember,
    recordGqlFields: { id: true, name: true },
    limit: 200,
  });

  const listPath = getAppPath(AppPath.RecordIndexPage, {
    objectNamePlural: objectMetadataItem.namePlural,
  });
  const classicPagePath = `${getAppPath(AppPath.RecordShowPage, {
    objectNameSingular: CoreObjectNameSingular.Company,
    objectRecordId: companyId,
  })}?view=classic`;
  const objectSettingsPath = `/settings/objects/${objectMetadataItem.namePlural}`;

  if (!isDefined(record)) {
    return (
      <StyledMessage>
        {loading ? t`Loading company…` : t`This company could not be found.`}
      </StyledMessage>
    );
  }

  const companyName = isNonEmptyString(record.name)
    ? record.name
    : t`Untitled company`;
  const domainUrl = record.domainName?.primaryLinkUrl as string | undefined;
  const domainLabel = getRoboostDomainLabel(domainUrl);
  const ownerName = getRoboostPersonName(record.accountOwner?.name);
  const targetRecord = {
    id: companyId,
    targetObjectNameSingular: CoreObjectNameSingular.Company,
  };

  const moreEntries = [
    {
      id: 'classic',
      label: t`Open classic record page`,
      icon: 'external-link' as const,
      href: classicPagePath,
    },
    {
      id: 'settings',
      label: t`Company fields settings`,
      icon: 'settings' as const,
      href: objectSettingsPath,
    },
  ];

  const left = (
    <StyledLeft>
      <StyledLeftTop>
        <StyledBackLink to={listPath}>
          <Icon name="chevron-left" size={14} />
          {objectMetadataItem.labelPlural}
        </StyledBackLink>
        <StyledSpacer />
        <Menu
          align="right"
          entries={moreEntries}
          trigger={({ toggle, isOpen }) => (
            <Button
              variant="ghost"
              size="sm"
              aria-expanded={isOpen}
              onClick={toggle}
            >
              {t`Actions`}
            </Button>
          )}
        />
      </StyledLeftTop>
      <StyledIdentity>
        <Avatar
          name={companyName}
          size="lg"
          tone={getRoboostAvatarTone(companyName)}
        />
        <StyledIdentityText>
          <StyledName title={companyName}>{companyName}</StyledName>
          {isNonEmptyString(domainLabel) && isNonEmptyString(domainUrl) && (
            <StyledDomain
              href={
                domainUrl.startsWith('http')
                  ? domainUrl
                  : `https://${domainUrl}`
              }
              target="_blank"
              rel="noreferrer"
            >
              {domainLabel}
            </StyledDomain>
          )}
          <StyledOwner>
            <StyledOwnerLabel>{t`Owner`} · </StyledOwnerLabel>
            {isNonEmptyString(ownerName) ? ownerName : t`No owner`}
          </StyledOwner>
        </StyledIdentityText>
      </StyledIdentity>
      <RoboostRecordQuickActions
        targetRecord={targetRecord}
        onOpenMeetings={() => {
          setMainTab('activities');
          setSubTab('meetings');
        }}
        moreEntries={moreEntries}
      />
      {sections.map((section, index) => (
        <Fragment key={section.id}>
          <StyledDivider />
          <RoboostPropertySection
            title={section.title}
            fields={section.fields}
            record={record}
            defaultOpen={index < 2}
            editPath={classicPagePath}
            settingsPath={objectSettingsPath}
          />
        </Fragment>
      ))}
    </StyledLeft>
  );

  return (
    <>
      <RoboostTopBarTitleEffect title={companyName} />
      <StyledScroll>
        <RecordLayout
          leftTitle={t`Record`}
          rightTitle={t`Associations`}
          leftCollapsed={roboostRecordLeftPanelCollapsed}
          rightCollapsed={roboostRecordRightPanelCollapsed}
          onLeftToggle={setRoboostRecordLeftPanelCollapsed}
          onRightToggle={setRoboostRecordRightPanelCollapsed}
          left={left}
          middle={
            <RoboostActivityColumn
              items={feedItems}
              loading={feedLoading}
              mainTab={mainTab}
              onMainTabChange={setMainTab}
              subTab={subTab}
              onSubTabChange={(tab) => {
                setMainTab('activities');
                setSubTab(tab);
              }}
              customizePath={classicPagePath}
              members={members.map((member) => ({
                id: member.id,
                name: getRoboostPersonName(member.name),
              }))}
            />
          }
          right={
            <RoboostAssociationsPanel
              companyObjectMetadataItem={objectMetadataItem}
              companyId={companyId}
              classicPagePath={classicPagePath}
            />
          }
        />
      </StyledScroll>
    </>
  );
};
