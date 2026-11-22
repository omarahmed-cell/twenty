type RoboostWordmarkProps = {
  height?: number;
};

export const RoboostWordmark = ({ height = 22 }: RoboostWordmarkProps) => (
  <img
    src="/images/roboost/roboost-logo-color.png"
    alt="Roboost"
    style={{ display: 'block', height, width: 'auto' }}
  />
);
