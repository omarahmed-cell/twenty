import { RecordPagePanelHeader } from '@/page-layout/components/RecordPagePanelHeader';
import { RecordPagePanelRail } from '@/page-layout/components/RecordPagePanelRail';
import { RECORD_PAGE_PANEL_CLASS_NAMES } from '@/page-layout/constants/RecordPagePanelClassNames';
import { recordPageLeftPanelState } from '@/page-layout/states/recordPageLeftPanelState';
import { recordPageRightPanelState } from '@/page-layout/states/recordPageRightPanelState';
import { type RecordPagePanelSide } from '@/page-layout/types/RecordPagePanelSide';
import { useSetAtomState } from '@/ui/utilities/state/jotai/hooks/useSetAtomState';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { type ReactNode } from 'react';

const StyledRailSlot = styled.div`
  display: none;
  height: 100%;
`;

const StyledPanelBody = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  grid-template-rows: auto minmax(0, 1fr);
  height: 100%;

  .page-layout-scroll-wrapper {
    container-name: tab-viewport;
    container-type: size;
  }
`;

type RecordPagePanelChromeProps = {
  side: RecordPagePanelSide;
  children: ReactNode;
};

export const RecordPagePanelChrome = ({
  side,
  children,
}: RecordPagePanelChromeProps) => {
  const { t } = useLingui();
  const setPanelState = useSetAtomState(
    side === 'left' ? recordPageLeftPanelState : recordPageRightPanelState,
  );

  const title = side === 'left' ? t`Record` : t`Associations`;

  return (
    <>
      <StyledRailSlot className={RECORD_PAGE_PANEL_CLASS_NAMES.rail}>
        <RecordPagePanelRail
          side={side}
          title={title}
          onExpand={() => setPanelState('expanded')}
        />
      </StyledRailSlot>
      <StyledPanelBody className={RECORD_PAGE_PANEL_CLASS_NAMES.panelBody}>
        <RecordPagePanelHeader
          side={side}
          title={title}
          onCollapse={() => setPanelState('collapsed')}
        />
        {children}
      </StyledPanelBody>
    </>
  );
};
