import { NotesCard } from '@/activities/notes/components/NotesCard';
import { type PageLayoutWidget } from '@/page-layout/types/PageLayoutWidget';
import { WidgetContentShell } from '@/page-layout/widgets/components/WidgetContentShell';
import { CoreObjectNameSingular } from 'twenty-shared/types';

type CallWidgetProps = {
  widget: PageLayoutWidget;
};

export const CallWidget = ({ widget: _widget }: CallWidgetProps) => (
  <WidgetContentShell>
    <NotesCard activityObjectNameSingular={CoreObjectNameSingular.Call} />
  </WidgetContentShell>
);
