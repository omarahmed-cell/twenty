import { useObjectMetadataItems } from '@/object-metadata/hooks/useObjectMetadataItems';
import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import {
  ROBOOST_DUPLICATE_OVERVIEW,
  ROBOOST_SAVE_DUPLICATE_RULES,
  ROBOOST_SCAN_DUPLICATES,
} from '@/roboost-app/merge/graphql/roboostDuplicateQueries';
import { type RoboostDuplicateOverview } from '@/roboost-app/merge/types/RoboostDuplicate';
import { formatRoboostDateTime } from '@/roboost-app/utils/formatRoboostDateTime';
import { Button } from '@/roboost-ui/components/Button';
import { Tag } from '@/roboost-ui/components/Tag';
import { Toggle } from '@/roboost-ui/components/Toggle';
import { SettingsPageContainer } from '@/settings/components/SettingsPageContainer';
import { SettingsPageLayout } from '@/settings/components/layout/SettingsPageLayout';
import { useMutation, useQuery } from '@apollo/client/react';
import { Trans, useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ROBOOST_MERGE_OBJECT_NAMES } from 'twenty-shared/constants';
import { AppPath, SettingsPath } from 'twenty-shared/types';
import { getAppPath, getSettingsPath, isDefined } from 'twenty-shared/utils';
import { useToast } from 'twenty-ui/components/feedback';

const RoboostDuplicateObjectCard = ({
  objectMetadataItem,
}: {
  objectMetadataItem: EnrichedObjectMetadataItem;
}) => {
  const { t } = useLingui();
  const { enqueueToast } = useToast();
  const objectName = objectMetadataItem.nameSingular;
  const { data, refetch } = useQuery<{
    roboostDuplicateOverview: RoboostDuplicateOverview;
  }>(ROBOOST_DUPLICATE_OVERVIEW, {
    variables: { objectName },
    fetchPolicy: 'network-only',
  });
  const [saveRules] = useMutation(ROBOOST_SAVE_DUPLICATE_RULES);
  const [scanDuplicates] = useMutation<{ roboostScanDuplicates: number }>(
    ROBOOST_SCAN_DUPLICATES,
  );
  const [isScanning, setIsScanning] = useState(false);
  const overview = data?.roboostDuplicateOverview;
  const rules = overview?.settings.rules ?? [];
  const lastScanAt = overview?.settings.lastScanAt ?? null;
  const openCount = overview?.openCount ?? 0;

  const toggleRule = async (key: string, isEnabled: boolean) => {
    try {
      await saveRules({
        variables: {
          objectName,
          rules: {
            ...Object.fromEntries(
              rules.map((rule) => [rule.key, rule.isEnabled]),
            ),
            [key]: isEnabled,
          },
        },
      });
      await refetch();
    } catch (error) {
      enqueueToast({
        status: 'error',
        children: error instanceof Error ? error.message : String(error),
      });
    }
  };

  const scanNow = async () => {
    setIsScanning(true);
    try {
      const result = await scanDuplicates({ variables: { objectName } });
      const pairCount = result.data?.roboostScanDuplicates ?? 0;

      enqueueToast({
        status: 'success',
        children: t`Scan finished: ${pairCount} possible duplicate pairs`,
      });
      await refetch();
    } catch (error) {
      enqueueToast({
        status: 'error',
        children: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="rb-dt-card rb-dq-settings-card">
      <div className="rb-dq-settings-head">
        <div>
          <h3 className="rb-dt-title">{objectMetadataItem.labelPlural}</h3>
          <p className="rb-dt-sub">
            {isDefined(lastScanAt)
              ? t`Last scan ${formatRoboostDateTime(lastScanAt)} · ${openCount} open pairs`
              : t`Not scanned yet`}
          </p>
        </div>
        <span className="rb-sp" />
        <Button
          variant="secondary"
          icon="refresh"
          disabled={isScanning || overview?.isAvailable !== true}
          onClick={scanNow}
        >
          {isScanning ? t`Scanning…` : t`Scan now`}
        </Button>
        <Link
          className="rb-btn rb-btn-secondary rb-btn-md"
          to={`${getAppPath(AppPath.RecordIndexPage, {
            objectNamePlural: objectMetadataItem.namePlural,
          })}?duplicates=open`}
        >
          {t`Manage duplicates`}
        </Link>
      </div>
      <div className="rb-dq-rules">
        {rules.map((rule) => {
          const confidenceLabel = isDefined(rule.confidence)
            ? {
                EXACT: t`Exact`,
                HIGH: t`High`,
                POSSIBLE: t`Possible`,
              }[rule.confidence]
            : t`Option`;

          return (
            <label key={rule.key} className="rb-dq-rule">
              <Toggle
                checked={rule.isEnabled}
                aria-label={rule.label}
                onChange={(isEnabled) => toggleRule(rule.key, isEnabled)}
              />
              <span className="rb-dq-rule-label">{rule.label}</span>
              <Tag>{confidenceLabel}</Tag>
            </label>
          );
        })}
      </div>
    </div>
  );
};

export const SettingsRoboostDuplicates = () => {
  const { t } = useLingui();
  const { objectMetadataItems } = useObjectMetadataItems();
  const mergeObjects = ROBOOST_MERGE_OBJECT_NAMES.map((name) =>
    objectMetadataItems.find((item) => item.nameSingular === name),
  ).filter(isDefined);

  return (
    <SettingsPageLayout
      title={t`Duplicates`}
      links={[
        {
          children: <Trans>Workspace</Trans>,
          href: getSettingsPath(SettingsPath.General),
        },
        { children: <Trans>Data management</Trans> },
        { children: <Trans>Duplicates</Trans> },
      ]}
    >
      <SettingsPageContainer>
        <div className="rb-ui rb-dt-page">
          <div className="rb-dt-card rb-dt-intro">
            <div>
              <h3 className="rb-dt-title">{t`Duplicate rules`}</h3>
              <p className="rb-dt-sub">{t`The scan runs every night after 00:37 UTC and finds pairs with these rules. Turn a rule off to stop it creating pairs; pairs marked Not duplicates stay hidden. Users with Merge on an object see its pairs under Data quality on the list.`}</p>
            </div>
          </div>
          {mergeObjects.map((objectMetadataItem) => (
            <RoboostDuplicateObjectCard
              key={objectMetadataItem.id}
              objectMetadataItem={objectMetadataItem}
            />
          ))}
        </div>
      </SettingsPageContainer>
    </SettingsPageLayout>
  );
};
