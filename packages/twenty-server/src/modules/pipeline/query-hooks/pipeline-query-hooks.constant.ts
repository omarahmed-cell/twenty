import { PipelineCreateOnePreQueryHook } from 'src/modules/pipeline/query-hooks/pipeline-create-one.pre-query.hook';
import { PipelineCreateManyPreQueryHook } from 'src/modules/pipeline/query-hooks/pipeline-create-many.pre-query.hook';
import { PipelineUpdateOnePreQueryHook } from 'src/modules/pipeline/query-hooks/pipeline-update-one.pre-query.hook';
import { PipelineUpdateManyPreQueryHook } from 'src/modules/pipeline/query-hooks/pipeline-update-many.pre-query.hook';
import { PipelineStageCreateOnePreQueryHook } from 'src/modules/pipeline/query-hooks/pipeline-stage-create-one.pre-query.hook';
import { PipelineStageCreateManyPreQueryHook } from 'src/modules/pipeline/query-hooks/pipeline-stage-create-many.pre-query.hook';
import { PipelineStageUpdateOnePreQueryHook } from 'src/modules/pipeline/query-hooks/pipeline-stage-update-one.pre-query.hook';
import { PipelineStageUpdateManyPreQueryHook } from 'src/modules/pipeline/query-hooks/pipeline-stage-update-many.pre-query.hook';
import { PipelineDeleteOnePreQueryHook } from 'src/modules/pipeline/query-hooks/pipeline-delete-one.pre-query.hook';
import { PipelineDestroyOnePreQueryHook } from 'src/modules/pipeline/query-hooks/pipeline-destroy-one.pre-query.hook';
import { PipelineDeleteManyPreQueryHook } from 'src/modules/pipeline/query-hooks/pipeline-delete-many.pre-query.hook';
import { PipelineDestroyManyPreQueryHook } from 'src/modules/pipeline/query-hooks/pipeline-destroy-many.pre-query.hook';
import { PipelineRestoreOnePreQueryHook } from 'src/modules/pipeline/query-hooks/pipeline-restore-one.pre-query.hook';
import { PipelineRestoreManyPreQueryHook } from 'src/modules/pipeline/query-hooks/pipeline-restore-many.pre-query.hook';
import { PipelineStageDeleteOnePreQueryHook } from 'src/modules/pipeline/query-hooks/pipeline-stage-delete-one.pre-query.hook';
import { PipelineStageDestroyOnePreQueryHook } from 'src/modules/pipeline/query-hooks/pipeline-stage-destroy-one.pre-query.hook';
import { PipelineStageDeleteManyPreQueryHook } from 'src/modules/pipeline/query-hooks/pipeline-stage-delete-many.pre-query.hook';
import { PipelineStageDestroyManyPreQueryHook } from 'src/modules/pipeline/query-hooks/pipeline-stage-destroy-many.pre-query.hook';
import { PipelineStageRestoreOnePreQueryHook } from 'src/modules/pipeline/query-hooks/pipeline-stage-restore-one.pre-query.hook';
import { PipelineStageRestoreManyPreQueryHook } from 'src/modules/pipeline/query-hooks/pipeline-stage-restore-many.pre-query.hook';
import { OpportunityCreateOnePreQueryHook } from 'src/modules/pipeline/query-hooks/opportunity-create-one.pre-query.hook';
import { OpportunityCreateManyPreQueryHook } from 'src/modules/pipeline/query-hooks/opportunity-create-many.pre-query.hook';
import { OpportunityUpdateOnePreQueryHook } from 'src/modules/pipeline/query-hooks/opportunity-update-one.pre-query.hook';
import { OpportunityUpdateManyPreQueryHook } from 'src/modules/pipeline/query-hooks/opportunity-update-many.pre-query.hook';
import { OpportunityDeleteOnePreQueryHook } from 'src/modules/pipeline/query-hooks/opportunity-delete-one.pre-query.hook';
import { OpportunityDestroyOnePreQueryHook } from 'src/modules/pipeline/query-hooks/opportunity-destroy-one.pre-query.hook';
import { OpportunityDeleteManyPreQueryHook } from 'src/modules/pipeline/query-hooks/opportunity-delete-many.pre-query.hook';
import { OpportunityDestroyManyPreQueryHook } from 'src/modules/pipeline/query-hooks/opportunity-destroy-many.pre-query.hook';

export const PIPELINE_QUERY_HOOKS = [
  PipelineCreateOnePreQueryHook,
  PipelineCreateManyPreQueryHook,
  PipelineUpdateOnePreQueryHook,
  PipelineUpdateManyPreQueryHook,
  PipelineStageCreateOnePreQueryHook,
  PipelineStageCreateManyPreQueryHook,
  PipelineStageUpdateOnePreQueryHook,
  PipelineStageUpdateManyPreQueryHook,
  PipelineDeleteOnePreQueryHook,
  PipelineDestroyOnePreQueryHook,
  PipelineDeleteManyPreQueryHook,
  PipelineDestroyManyPreQueryHook,
  PipelineRestoreOnePreQueryHook,
  PipelineRestoreManyPreQueryHook,
  PipelineStageDeleteOnePreQueryHook,
  PipelineStageDestroyOnePreQueryHook,
  PipelineStageDeleteManyPreQueryHook,
  PipelineStageDestroyManyPreQueryHook,
  PipelineStageRestoreOnePreQueryHook,
  PipelineStageRestoreManyPreQueryHook,
  OpportunityCreateOnePreQueryHook,
  OpportunityCreateManyPreQueryHook,
  OpportunityUpdateOnePreQueryHook,
  OpportunityUpdateManyPreQueryHook,
  OpportunityDeleteOnePreQueryHook,
  OpportunityDestroyOnePreQueryHook,
  OpportunityDeleteManyPreQueryHook,
  OpportunityDestroyManyPreQueryHook,
];
