import { Mark } from '@/roboost-ui/components/Mark';
import { SiraMark } from '@/roboost-ui/components/SiraMark';
import { Wordmark } from '@/roboost-ui/components/Wordmark';
import { ROBOOST_LOGO_PATHS } from '@/roboost-ui/constants/RoboostLogoPaths';

// Every brand is rendered; roboost-ui.css shows the one matching the nearest [data-theme]
export const FrameLogo = ({ collapsed = false }: { collapsed?: boolean }) => (
  <span className="rb-brand">
    <span className="rb-brand-item rb-brand-full">
      {collapsed ? <Mark /> : <Wordmark />}
    </span>
    <span className="rb-brand-item rb-brand-white">
      {collapsed ? <Mark variant="white" /> : <Wordmark variant="white" />}
    </span>
    <span className="rb-brand-item rb-brand-sira">
      {collapsed ? (
        <SiraMark />
      ) : (
        <img src={ROBOOST_LOGO_PATHS.siraWhite} alt="Sira" />
      )}
    </span>
  </span>
);
