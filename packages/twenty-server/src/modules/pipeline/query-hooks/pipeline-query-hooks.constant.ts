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
import { OpportunityCreateOnePostQueryHook } from 'src/modules/pipeline/query-hooks/opportunity-create-one.post-query.hook';
import { PipelineUpdateOneStageFieldsPostQueryHook } from 'src/modules/pipeline/query-hooks/pipeline-update-one-stage-fields.post-query.hook';
import { PipelineUpdateManyStageFieldsPostQueryHook } from 'src/modules/pipeline/query-hooks/pipeline-update-many-stage-fields.post-query.hook';
import { PipelineDeleteOneStageFieldsPostQueryHook } from 'src/modules/pipeline/query-hooks/pipeline-delete-one-stage-fields.post-query.hook';
import { PipelineDeleteManyStageFieldsPostQueryHook } from 'src/modules/pipeline/query-hooks/pipeline-delete-many-stage-fields.post-query.hook';
import { PipelineDestroyOneStageFieldsPostQueryHook } from 'src/modules/pipeline/query-hooks/pipeline-destroy-one-stage-fields.post-query.hook';
import { PipelineDestroyManyStageFieldsPostQueryHook } from 'src/modules/pipeline/query-hooks/pipeline-destroy-many-stage-fields.post-query.hook';
import { PipelineRestoreOneStageFieldsPostQueryHook } from 'src/modules/pipeline/query-hooks/pipeline-restore-one-stage-fields.post-query.hook';
import { PipelineRestoreManyStageFieldsPostQueryHook } from 'src/modules/pipeline/query-hooks/pipeline-restore-many-stage-fields.post-query.hook';
import { PipelineStageCreateOneStageFieldsPostQueryHook } from 'src/modules/pipeline/query-hooks/pipeline-stage-create-one-stage-fields.post-query.hook';
import { PipelineStageCreateManyStageFieldsPostQueryHook } from 'src/modules/pipeline/query-hooks/pipeline-stage-create-many-stage-fields.post-query.hook';
import { PipelineStageUpdateOneStageFieldsPostQueryHook } from 'src/modules/pipeline/query-hooks/pipeline-stage-update-one-stage-fields.post-query.hook';
import { PipelineStageUpdateManyStageFieldsPostQueryHook } from 'src/modules/pipeline/query-hooks/pipeline-stage-update-many-stage-fields.post-query.hook';
import { PipelineStageDeleteOneStageFieldsPostQueryHook } from 'src/modules/pipeline/query-hooks/pipeline-stage-delete-one-stage-fields.post-query.hook';
import { PipelineStageDeleteManyStageFieldsPostQueryHook } from 'src/modules/pipeline/query-hooks/pipeline-stage-delete-many-stage-fields.post-query.hook';
import { PipelineStageDestroyOneStageFieldsPostQueryHook } from 'src/modules/pipeline/query-hooks/pipeline-stage-destroy-one-stage-fields.post-query.hook';
import { PipelineStageDestroyManyStageFieldsPostQueryHook } from 'src/modules/pipeline/query-hooks/pipeline-stage-destroy-many-stage-fields.post-query.hook';
import { PipelineStageRestoreOneStageFieldsPostQueryHook } from 'src/modules/pipeline/query-hooks/pipeline-stage-restore-one-stage-fields.post-query.hook';
import { PipelineStageRestoreManyStageFieldsPostQueryHook } from 'src/modules/pipeline/query-hooks/pipeline-stage-restore-many-stage-fields.post-query.hook';
import { OpportunityCreateManyPostQueryHook } from 'src/modules/pipeline/query-hooks/opportunity-create-many.post-query.hook';
import { ServiceCreateOnePreQueryHook } from 'src/modules/pipeline/query-hooks/service-create-one.pre-query.hook';
import { ServiceCreateManyPreQueryHook } from 'src/modules/pipeline/query-hooks/service-create-many.pre-query.hook';
import { ServiceUpdateOnePreQueryHook } from 'src/modules/pipeline/query-hooks/service-update-one.pre-query.hook';
import { ServiceUpdateManyPreQueryHook } from 'src/modules/pipeline/query-hooks/service-update-many.pre-query.hook';
import { ServiceDeleteOnePreQueryHook } from 'src/modules/pipeline/query-hooks/service-delete-one.pre-query.hook';
import { ServiceDeleteManyPreQueryHook } from 'src/modules/pipeline/query-hooks/service-delete-many.pre-query.hook';
import { ServiceDestroyOnePreQueryHook } from 'src/modules/pipeline/query-hooks/service-destroy-one.pre-query.hook';
import { ServiceDestroyManyPreQueryHook } from 'src/modules/pipeline/query-hooks/service-destroy-many.pre-query.hook';
import { ServiceCreateOnePostQueryHook } from 'src/modules/pipeline/query-hooks/service-create-one.post-query.hook';
import { ServiceCreateManyPostQueryHook } from 'src/modules/pipeline/query-hooks/service-create-many.post-query.hook';

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
  OpportunityCreateOnePostQueryHook,
  OpportunityCreateManyPostQueryHook,
  ServiceCreateOnePreQueryHook,
  ServiceCreateManyPreQueryHook,
  ServiceUpdateOnePreQueryHook,
  ServiceUpdateManyPreQueryHook,
  ServiceDeleteOnePreQueryHook,
  ServiceDeleteManyPreQueryHook,
  ServiceDestroyOnePreQueryHook,
  ServiceDestroyManyPreQueryHook,
  ServiceCreateOnePostQueryHook,
  ServiceCreateManyPostQueryHook,
  PipelineUpdateOneStageFieldsPostQueryHook,
  PipelineUpdateManyStageFieldsPostQueryHook,
  PipelineDeleteOneStageFieldsPostQueryHook,
  PipelineDeleteManyStageFieldsPostQueryHook,
  PipelineDestroyOneStageFieldsPostQueryHook,
  PipelineDestroyManyStageFieldsPostQueryHook,
  PipelineRestoreOneStageFieldsPostQueryHook,
  PipelineRestoreManyStageFieldsPostQueryHook,
  PipelineStageCreateOneStageFieldsPostQueryHook,
  PipelineStageCreateManyStageFieldsPostQueryHook,
  PipelineStageUpdateOneStageFieldsPostQueryHook,
  PipelineStageUpdateManyStageFieldsPostQueryHook,
  PipelineStageDeleteOneStageFieldsPostQueryHook,
  PipelineStageDeleteManyStageFieldsPostQueryHook,
  PipelineStageDestroyOneStageFieldsPostQueryHook,
  PipelineStageDestroyManyStageFieldsPostQueryHook,
  PipelineStageRestoreOneStageFieldsPostQueryHook,
  PipelineStageRestoreManyStageFieldsPostQueryHook,
];
