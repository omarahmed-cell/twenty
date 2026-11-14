export type CompanyParentChildCompany = {
  id: string;
  name?: string | null;
  parentCompany?: {
    id: string;
    name?: string | null;
  } | null;
};
