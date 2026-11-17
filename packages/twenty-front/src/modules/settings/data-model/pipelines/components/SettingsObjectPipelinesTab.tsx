import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { useMemo, useState } from 'react';
import { CoreObjectNameSingular } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';
import { SearchInput } from 'twenty-ui/components/input';
import { Section } from 'twenty-ui/components/layout';
import { IconPlus } from 'twenty-ui/icon';
import { Button } from 'twenty-ui/primitives/input';
import { themeCssVariables } from 'twenty-ui/theme';

import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { usePipelineConfigs } from '@/pipeline/hooks/usePipelineConfigs';
import { type PipelineConfig } from '@/pipeline/types/PipelineConfig';
import { SettingsPipelineTableRow } from '@/settings/data-model/pipelines/components/SettingsPipelineTableRow';
import { SETTINGS_PIPELINES_TABLE_GRID_TEMPLATE_COLUMNS } from '@/settings/data-model/pipelines/constants/SettingsPipelineTableGridTemplateColumns';
import { useNavigateToSettingsPipeline } from '@/settings/data-model/pipelines/hooks/useNavigateToSettingsPipeline';
import { useSettingsPipelineActions } from '@/settings/data-model/pipelines/hooks/useSettingsPipelineActions';
import { computeReorderedPositions } from '@/settings/data-model/pipelines/utils/computeReorderedPositions';
import { filterPipelinesBySearch } from '@/settings/data-model/pipelines/utils/filterPipelinesBySearch';
import { ConfirmationDialog } from '@/ui/layout/dialog/components/ConfirmationDialog';
import { useDialog } from '@/ui/layout/dialog/hooks/useDialog';
import { DraggableItem } from '@/ui/layout/draggable-list/components/DraggableItem';
import { DraggableList } from '@/ui/layout/draggable-list/components/DraggableList';
import { Table } from '@/ui/layout/table/components/Table';
import { TableHeader } from '@/ui/layout/table/components/TableHeader';
import { TableRow } from '@/ui/layout/table/components/TableRow';

const StyledToolbar = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
  padding-bottom: ${themeCssVariables.spacing[2]};
`;

const StyledSearchContainer = styled.div`
  flex: 1;
`;

const StyledEmptyState = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  padding: ${themeCssVariables.spacing[4]} 0;
`;

const DELETE_PIPELINE_DIALOG_ID = 'settings-delete-pipeline-dialog';

type SettingsObjectPipelinesTabProps = {
  objectMetadataItem: EnrichedObjectMetadataItem;
};

export const SettingsObjectPipelinesTab = ({
  objectMetadataItem,
}: SettingsObjectPipelinesTabProps) => {
  const { t } = useLingui();
  const { openDialog } = useDialog();
  const navigateToSettingsPipeline = useNavigateToSettingsPipeline();
  const { pipelines, loading } = usePipelineConfigs({
    objectNameSingular: objectMetadataItem.nameSingular,
  });
  const { clonePipeline, destroyPipeline, reorderPipelines } =
    useSettingsPipelineActions();

  const [searchTerm, setSearchTerm] = useState('');
  const [pipelineToDelete, setPipelineToDelete] =
    useState<PipelineConfig | null>(null);

  const filteredPipelines = useMemo(
    () => filterPipelinesBySearch(pipelines, searchTerm),
    [pipelines, searchTerm],
  );

  const isSearching = searchTerm.trim() !== '';

  const handleDragEnd = (result: {
    source: { index: number };
    destination: { index: number } | null;
  }) => {
    if (isSearching || !isDefined(result.destination)) {
      return;
    }

    reorderPipelines(
      computeReorderedPositions({
        items: pipelines,
        fromIndex: result.source.index,
        toIndex: result.destination.index,
      }),
    );
  };

  const handleDeleteRequest = (pipeline: PipelineConfig) => {
    setPipelineToDelete(pipeline);
    openDialog(DELETE_PIPELINE_DIALOG_ID);
  };

  const handleConfirmDelete = async () => {
    if (!isDefined(pipelineToDelete)) {
      return;
    }

    await destroyPipeline(pipelineToDelete.id);
    setPipelineToDelete(null);
  };

  const pipelineToDeleteName = pipelineToDelete?.name ?? '';
  const objectLabelPlural = objectMetadataItem.labelPlural.toLowerCase();

  return (
    <Section.Root>
      <Section.Header
        title={t`Pipelines`}
        description={
          objectMetadataItem.nameSingular === CoreObjectNameSingular.Opportunity
            ? t`Set up the pipelines and stages your deals move through.`
            : t`Set up the pipelines and stages your ${objectLabelPlural} move through.`
        }
      />
      <StyledToolbar>
        <StyledSearchContainer>
          <SearchInput
            placeholder={t`Search for a pipeline...`}
            value={searchTerm}
            onValueChange={setSearchTerm}
          />
        </StyledSearchContainer>
        <Button
          variant="solid"
          color="accent"
          size="sm"
          startIcon={<IconPlus />}
          onClick={() =>
            navigateToSettingsPipeline({
              objectNamePlural: objectMetadataItem.namePlural,
            })
          }
        >
          {t`Create pipeline`}
        </Button>
      </StyledToolbar>
      <Table>
        <TableRow
          gridTemplateColumns={SETTINGS_PIPELINES_TABLE_GRID_TEMPLATE_COLUMNS}
        >
          <TableHeader />
          <TableHeader>{t`Name`}</TableHeader>
          <TableHeader>{t`Pipeline description`}</TableHeader>
          <TableHeader align="right">{t`Stage calculated properties`}</TableHeader>
          <TableHeader align="right">{t`Pipeline rules`}</TableHeader>
          <TableHeader align="right">{t`Conditional logic rules`}</TableHeader>
          <TableHeader align="right">{t`Stages`}</TableHeader>
          <TableHeader>{t`Pipeline ID`}</TableHeader>
          <TableHeader />
        </TableRow>
        {!loading && filteredPipelines.length === 0 ? (
          <StyledEmptyState>
            {isSearching
              ? t`No pipeline matches your search`
              : t`No pipelines yet`}
          </StyledEmptyState>
        ) : (
          <DraggableList
            onDragEnd={handleDragEnd}
            draggableItems={
              <>
                {filteredPipelines.map((pipeline, index) => (
                  <DraggableItem
                    key={pipeline.id}
                    draggableId={pipeline.id}
                    index={index}
                    isDragDisabled={isSearching}
                    itemComponent={
                      <SettingsPipelineTableRow
                        pipeline={pipeline}
                        objectNamePlural={objectMetadataItem.namePlural}
                        onClone={() => clonePipeline(pipeline.id)}
                        onDelete={() => handleDeleteRequest(pipeline)}
                      />
                    }
                  />
                ))}
              </>
            }
          />
        )}
      </Table>
      <ConfirmationDialog
        dialogId={DELETE_PIPELINE_DIALOG_ID}
        title={t`Delete pipeline`}
        subtitle={t`Delete "${pipelineToDeleteName}" and its stages? This cannot be undone.`}
        onConfirmClick={handleConfirmDelete}
        confirmButtonText={t`Delete`}
        confirmButtonColor="danger"
      />
    </Section.Root>
  );
};
