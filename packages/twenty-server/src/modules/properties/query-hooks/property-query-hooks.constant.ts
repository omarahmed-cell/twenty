import { PropertyCreateOnePreQueryHook } from 'src/modules/properties/query-hooks/property-create-one.pre-query.hook';
import { PropertyCreateManyPreQueryHook } from 'src/modules/properties/query-hooks/property-create-many.pre-query.hook';
import { PropertyUpdateOnePreQueryHook } from 'src/modules/properties/query-hooks/property-update-one.pre-query.hook';
import { PropertyUpdateManyPreQueryHook } from 'src/modules/properties/query-hooks/property-update-many.pre-query.hook';
import { PropertyDeleteOnePreQueryHook } from 'src/modules/properties/query-hooks/property-delete-one.pre-query.hook';
import { PropertyDeleteManyPreQueryHook } from 'src/modules/properties/query-hooks/property-delete-many.pre-query.hook';
import { PropertyDestroyOnePreQueryHook } from 'src/modules/properties/query-hooks/property-destroy-one.pre-query.hook';
import { PropertyDestroyManyPreQueryHook } from 'src/modules/properties/query-hooks/property-destroy-many.pre-query.hook';
import { PropertyRestoreOnePreQueryHook } from 'src/modules/properties/query-hooks/property-restore-one.pre-query.hook';
import { PropertyRestoreManyPreQueryHook } from 'src/modules/properties/query-hooks/property-restore-many.pre-query.hook';
import { PropertyCreateOnePostQueryHook } from 'src/modules/properties/query-hooks/property-create-one.post-query.hook';
import { PropertyCreateManyPostQueryHook } from 'src/modules/properties/query-hooks/property-create-many.post-query.hook';
import { PropertyUpdateOnePostQueryHook } from 'src/modules/properties/query-hooks/property-update-one.post-query.hook';
import { PropertyUpdateManyPostQueryHook } from 'src/modules/properties/query-hooks/property-update-many.post-query.hook';
import { PropertyDeleteOnePostQueryHook } from 'src/modules/properties/query-hooks/property-delete-one.post-query.hook';
import { PropertyDeleteManyPostQueryHook } from 'src/modules/properties/query-hooks/property-delete-many.post-query.hook';
import { PropertyDestroyOnePostQueryHook } from 'src/modules/properties/query-hooks/property-destroy-one.post-query.hook';
import { PropertyDestroyManyPostQueryHook } from 'src/modules/properties/query-hooks/property-destroy-many.post-query.hook';
import { PropertyRestoreOnePostQueryHook } from 'src/modules/properties/query-hooks/property-restore-one.post-query.hook';
import { PropertyRestoreManyPostQueryHook } from 'src/modules/properties/query-hooks/property-restore-many.post-query.hook';

export const PROPERTY_QUERY_HOOKS = [
  PropertyCreateOnePreQueryHook,
  PropertyCreateManyPreQueryHook,
  PropertyUpdateOnePreQueryHook,
  PropertyUpdateManyPreQueryHook,
  PropertyDeleteOnePreQueryHook,
  PropertyDeleteManyPreQueryHook,
  PropertyDestroyOnePreQueryHook,
  PropertyDestroyManyPreQueryHook,
  PropertyRestoreOnePreQueryHook,
  PropertyRestoreManyPreQueryHook,
  PropertyCreateOnePostQueryHook,
  PropertyCreateManyPostQueryHook,
  PropertyUpdateOnePostQueryHook,
  PropertyUpdateManyPostQueryHook,
  PropertyDeleteOnePostQueryHook,
  PropertyDeleteManyPostQueryHook,
  PropertyDestroyOnePostQueryHook,
  PropertyDestroyManyPostQueryHook,
  PropertyRestoreOnePostQueryHook,
  PropertyRestoreManyPostQueryHook,
];
