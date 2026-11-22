import { Mark } from '@/roboost-ui/components/Mark';
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
      <img
        className={collapsed ? 'rb-brand-mark' : undefined}
        src={
          collapsed
            ? ROBOOST_LOGO_PATHS.siraMarkWhite
            : ROBOOST_LOGO_PATHS.siraWordmarkWhite
        }
        alt="Sira"
      />
    </span>
  </span>
);
