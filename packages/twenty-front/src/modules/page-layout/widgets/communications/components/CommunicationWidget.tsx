import { NotesCard } from '@/activities/notes/components/NotesCard';
import { type PageLayoutWidget } from '@/page-layout/types/PageLayoutWidget';
import { WidgetContentShell } from '@/page-layout/widgets/components/WidgetContentShell';
import { CoreObjectNameSingular } from 'twenty-shared/types';

type CommunicationWidgetProps = {
  widget: PageLayoutWidget;
};

export const CommunicationWidget = ({
  widget: _widget,
}: CommunicationWidgetProps) => (
  <WidgetContentShell>
    <NotesCard
      activityObjectNameSingular={CoreObjectNameSingular.Communication}
    />
  </WidgetContentShell>
);
