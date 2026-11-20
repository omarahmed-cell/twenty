import { useOpenCreateActivityDrawer } from '@/activities/hooks/useOpenCreateActivityDrawer';
import { useCreateOneRecord } from '@/object-record/hooks/useCreateOneRecord';
import { Button } from '@/roboost-ui/components/Button';
import { Menu } from '@/roboost-ui/components/Menu';
import { useLingui } from '@lingui/react/macro';
import { useNavigateApp } from '~/hooks/useNavigateApp';
import { AppPath, CoreObjectNameSingular } from 'twenty-shared/types';

export const RoboostNewRecordMenu = () => {
  const { t } = useLingui();
  const navigateApp = useNavigateApp();

  const { createOneRecord: createCompany } = useCreateOneRecord({
    objectNameSingular: CoreObjectNameSingular.Company,
  });
  const { createOneRecord: createPerson } = useCreateOneRecord({
    objectNameSingular: CoreObjectNameSingular.Person,
  });
  const { createOneRecord: createOpportunity } = useCreateOneRecord({
    objectNameSingular: CoreObjectNameSingular.Opportunity,
  });
  const openCreateTaskDrawer = useOpenCreateActivityDrawer({
    activityObjectNameSingular: CoreObjectNameSingular.Task,
  });
  const openCreateNoteDrawer = useOpenCreateActivityDrawer({
    activityObjectNameSingular: CoreObjectNameSingular.Note,
  });

  const createAndOpen = async (
    create: () => Promise<{ id: string }>,
    objectNameSingular: string,
  ) => {
    const record = await create();

    navigateApp(AppPath.RecordShowPage, {
      objectNameSingular,
      objectRecordId: record.id,
    });
  };

  return (
    <Menu
      align="right"
      trigger={({ toggle, isOpen }) => (
        <Button
          variant="primary"
          size="sm"
          icon="plus"
          aria-expanded={isOpen}
          aria-haspopup="menu"
          onClick={toggle}
        >
          {t`New`}
        </Button>
      )}
      entries={[
        {
          id: 'company',
          label: t`Company`,
          icon: 'building',
          onSelect: () =>
            createAndOpen(
              () => createCompany({}),
              CoreObjectNameSingular.Company,
            ),
        },
        {
          id: 'person',
          label: t`Contact`,
          icon: 'contacts',
          onSelect: () =>
            createAndOpen(
              () => createPerson({}),
              CoreObjectNameSingular.Person,
            ),
        },
        {
          id: 'opportunity',
          label: t`Deal`,
          icon: 'deals',
          onSelect: () =>
            createAndOpen(
              () => createOpportunity({}),
              CoreObjectNameSingular.Opportunity,
            ),
        },
        { id: 'separator', isSeparator: true },
        {
          id: 'task',
          label: t`Task`,
          icon: 'tasks',
          onSelect: () => openCreateTaskDrawer({ targetableObjects: [] }),
        },
        {
          id: 'note',
          label: t`Note`,
          icon: 'note',
          onSelect: () => openCreateNoteDrawer({ targetableObjects: [] }),
        },
      ]}
    />
  );
};
