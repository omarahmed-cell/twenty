import { Module } from '@nestjs/common';

import { CompanyCreateManyPreQueryHook } from 'src/modules/company-hierarchy/query-hooks/company-create-many.pre-query.hook';
import { CompanyCreateOnePreQueryHook } from 'src/modules/company-hierarchy/query-hooks/company-create-one.pre-query.hook';
import { CompanyUpdateManyPreQueryHook } from 'src/modules/company-hierarchy/query-hooks/company-update-many.pre-query.hook';
import { CompanyUpdateOnePreQueryHook } from 'src/modules/company-hierarchy/query-hooks/company-update-one.pre-query.hook';
import { CompanyHierarchyValidationService } from 'src/modules/company-hierarchy/services/company-hierarchy-validation.service';

@Module({
  providers: [
    CompanyHierarchyValidationService,
    CompanyCreateOnePreQueryHook,
    CompanyCreateManyPreQueryHook,
    CompanyUpdateOnePreQueryHook,
    CompanyUpdateManyPreQueryHook,
  ],
})
export class CompanyHierarchyModule {}
