import { EmailContactFindOrCreateService } from 'src/modules/unified-email/services/email-contact-find-or-create.service';

type FakePerson = { id: string; companyId: string | null; email: string };
type FakeCompany = { id: string; primaryLinkUrl: string; name: string };

const CREATED_BY = {
  source: 'MANUAL',
  name: 'Test',
  workspaceMemberId: null,
  context: {},
} as never;

const buildService = () => {
  const people: FakePerson[] = [];
  const companies: FakeCompany[] = [
    {
      id: 'company-acme',
      primaryLinkUrl: 'https://www.acme.com',
      name: 'Acme',
    },
  ];
  let sequence = 0;

  const coreDataSource = {
    query: jest.fn(async (sql: string, parameters: unknown[]) => {
      // Lets a parallel call interleave between the read and the write
      for (let tick = 0; tick < 5; tick++) {
        await Promise.resolve();
      }

      if (sql.includes('"person"')) {
        const addresses = parameters[0] as string[];

        return people.filter((person) => addresses.includes(person.email));
      }

      const pattern = (parameters[0] as string).replace(/%/g, '');

      return companies
        .filter((company) => company.primaryLinkUrl.includes(pattern))
        .map((company) => ({
          id: company.id,
          primaryLinkUrl: company.primaryLinkUrl,
          secondaryLinks: [],
        }));
    }),
  };

  const repositories: Record<string, unknown> = {
    person: {
      insert: jest.fn(async (person: Record<string, never>) => {
        const id = `person-${++sequence}`;

        people.push({
          id,
          companyId: person.companyId,
          email: (person.emails as { primaryEmail: string }).primaryEmail,
        });

        return { identifiers: [{ id }] };
      }),
      update: jest.fn(
        async ({ id }: { id: string }, values: { companyId: string }) => {
          const person = people.find((candidate) => candidate.id === id);

          if (person) {
            person.companyId = values.companyId;
          }
        },
      ),
    },
    company: {
      insert: jest.fn(
        async (company: {
          name: string;
          domainName: { primaryLinkUrl: string };
        }) => {
          const id = `company-${++sequence}`;

          companies.push({
            id,
            name: company.name,
            primaryLinkUrl: company.domainName.primaryLinkUrl,
          });

          return { identifiers: [{ id }] };
        },
      ),
    },
  };

  const workspaceOrmManager = {
    executeInWorkspaceContext: (callback: () => Promise<unknown>) => callback(),
    getRepository: (name: string) => repositories[name],
  };

  let lockChain = Promise.resolve();
  const cacheLockService = {
    withLock: <T>(callback: () => Promise<T>) => {
      const run = lockChain.then(callback);

      lockChain = run.then(
        () => undefined,
        () => undefined,
      );

      return run;
    },
  };

  const twentyConfigService = {
    get: (key: string) =>
      key === 'UNIFIED_EMAIL_INTERNAL_DOMAINS'
        ? ['roboost.app']
        : ['gmail.com', 'outlook.com'],
  };

  const service = new EmailContactFindOrCreateService(
    coreDataSource as never,
    workspaceOrmManager as never,
    cacheLockService as never,
    twentyConfigService as never,
  );

  return { service, people, companies };
};

describe('EmailContactFindOrCreateService', () => {
  it('creates the contact and its company for a new external domain', async () => {
    const { service, companies } = buildService();

    const result = await service.findOrCreate({
      workspaceId: '20202020-1c25-4d02-bf25-6aeccf7ea419',
      participants: [{ address: 'Jane.Doe@NewCo.io', displayName: 'Jane Doe' }],
      createdBy: CREATED_BY,
    });

    expect(result.contacts).toHaveLength(1);
    expect(result.contacts[0]).toMatchObject({
      address: 'jane.doe@newco.io',
      isPersonCreated: true,
      isCompanyCreated: true,
    });
    expect(
      companies.find((company) => company.primaryLinkUrl === 'https://newco.io')
        ?.name,
    ).toBe('Newco');
  });

  it('links a new contact at an existing domain to that company', async () => {
    const { service } = buildService();

    const result = await service.findOrCreate({
      workspaceId: '20202020-1c25-4d02-bf25-6aeccf7ea419',
      participants: [{ address: 'sam@eu.acme.com' }],
      createdBy: CREATED_BY,
    });

    expect(result.companyIds).toEqual(['company-acme']);
    expect(result.contacts[0].isCompanyCreated).toBe(false);
  });

  it('creates personal-provider contacts without a company and skips internal addresses', async () => {
    const { service, companies } = buildService();

    const result = await service.findOrCreate({
      workspaceId: '20202020-1c25-4d02-bf25-6aeccf7ea419',
      participants: [
        { address: 'someone@gmail.com' },
        { address: 'rep@roboost.app' },
      ],
      createdBy: CREATED_BY,
    });

    expect(result.contacts).toEqual([
      expect.objectContaining({
        address: 'someone@gmail.com',
        companyId: null,
      }),
    ]);
    expect(result.skippedInternalAddresses).toEqual(['rep@roboost.app']);
    expect(companies).toHaveLength(1);
  });

  it('reuses an existing contact instead of creating another', async () => {
    const { service, people } = buildService();

    people.push({
      id: 'person-existing',
      companyId: 'company-acme',
      email: 'ann@acme.com',
    });

    const result = await service.findOrCreate({
      workspaceId: '20202020-1c25-4d02-bf25-6aeccf7ea419',
      participants: [{ address: 'ANN@acme.com' }],
      createdBy: CREATED_BY,
    });

    expect(result.personIds).toEqual(['person-existing']);
    expect(people).toHaveLength(1);
  });

  it('never creates duplicates when called twice in parallel', async () => {
    const { service, people, companies } = buildService();

    const call = () =>
      service.findOrCreate({
        workspaceId: '20202020-1c25-4d02-bf25-6aeccf7ea419',
        participants: [{ address: 'lee@parallel.dev' }],
        createdBy: CREATED_BY,
      });

    const [first, second] = await Promise.all([call(), call()]);

    expect(first.personIds).toEqual(second.personIds);
    expect(people).toHaveLength(1);
    expect(companies).toHaveLength(2);
  });
});
