import { styled } from '@linaria/react';
import { Link } from 'react-router-dom';
import { countEnabledPipelineRules } from 'twenty-shared/utils';
import { OverflowingTextWithTooltip } from 'twenty-ui/primitives/typography';
import { themeCssVariables } from 'twenty-ui/theme';

import { type PipelineConfig } from '@/pipeline/types/PipelineConfig';
import { SettingsPipelineDragHandle } from '@/settings/data-model/pipelines/components/SettingsPipelineDragHandle';
import { SettingsPipelineRowMenu } from '@/settings/data-model/pipelines/components/SettingsPipelineRowMenu';
import { SETTINGS_PIPELINES_TABLE_GRID_TEMPLATE_COLUMNS } from '@/settings/data-model/pipelines/constants/SettingsPipelineTableGridTemplateColumns';
import { useSettingsPipelineDealCount } from '@/settings/data-model/pipelines/hooks/useSettingsPipelineDealCount';
import { countCalcPropsEnabledStages } from '@/settings/data-model/pipelines/utils/countCalcPropsEnabledStages';
import { getDealsInUseBlockedMessage } from '@/settings/data-model/pipelines/utils/getDealsInUseBlockedMessage';
import { getSettingsPipelinePath } from '@/settings/data-model/pipelines/utils/getSettingsPipelinePath';
import { TableCell } from '@/ui/layout/table/components/TableCell';
import { TableRow } from '@/ui/layout/table/components/TableRow';

const StyledNameLink = styled(Link)`
  color: ${themeCssVariables.font.color.primary};
  font-weight: ${themeCssVariables.font.weight.medium};
  min-width: 0;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

const StyledSecondaryText = styled.span`
  color: ${themeCssVariables.font.color.tertiary};
  min-width: 0;
`;

type SettingsPipelineTableRowProps = {
  pipeline: PipelineConfig;
  objectNamePlural: string;
  onClone: () => void;
  onDelete: () => void;
};

export const SettingsPipelineTableRow = ({
  pipeline,
  objectNamePlural,
  onClone,
  onDelete,
}: SettingsPipelineTableRowProps) => {
  const dealCount = useSettingsPipelineDealCount({
    fieldName: 'pipeline',
    value: pipeline.key,
  });

  return (
    <TableRow
      gridTemplateColumns={SETTINGS_PIPELINES_TABLE_GRID_TEMPLATE_COLUMNS}
    >
      <TableCell padding="0">
        <SettingsPipelineDragHandle />
      </TableCell>
      <TableCell minWidth="0">
        <StyledNameLink
          to={getSettingsPipelinePath({
            objectNamePlural,
            pipelineId: pipeline.id,
          })}
        >
          <OverflowingTextWithTooltip text={pipeline.name} />
        </StyledNameLink>
      </TableCell>
      <TableCell minWidth="0">
        <StyledSecondaryText>
          <OverflowingTextWithTooltip text={pipeline.description ?? ''} />
        </StyledSecondaryText>
      </TableCell>
      <TableCell align="right">
        {countCalcPropsEnabledStages(pipeline.stages)}
      </TableCell>
      <TableCell align="right">
        {countEnabledPipelineRules(pipeline.rules)}
      </TableCell>
      <TableCell align="right">{pipeline.stages.length}</TableCell>
      <TableCell minWidth="0">
        <StyledSecondaryText>
          <OverflowingTextWithTooltip text={pipeline.key} />
        </StyledSecondaryText>
      </TableCell>
      <TableCell align="right" padding="0">
        <SettingsPipelineRowMenu
          pipelineId={pipeline.id}
          deleteBlockedMessage={getDealsInUseBlockedMessage({
            dealCount,
            kind: 'pipeline',
          })}
          onClone={onClone}
          onDelete={onDelete}
        />
      </TableCell>
    </TableRow>
  );
};
