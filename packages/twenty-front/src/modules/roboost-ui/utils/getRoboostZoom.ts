// The interface-scale zoom on html (index.css); 1 when the browser cannot report it
export const getRoboostZoom = () => {
  const zoom = Number.parseFloat(
    getComputedStyle(document.documentElement).zoom,
  );

  return Number.isFinite(zoom) && zoom > 0 ? zoom : 1;
};
