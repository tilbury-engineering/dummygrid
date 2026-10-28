import audit from './data/track-imagery-audit.json' with {type: 'json'};

// Only use locations included in the source-and-image audit. A new or renamed
// venue must be checked before it inherits an aerial image from an older entry.
export function trackAerialImage(track) {
  const entry = audit.entries[track.id];
  if (!entry) return null;
  if ((track.osmSource || null) !== entry.originalSource) return null;
  if (track.name !== entry.name && !entry.originalSource) return null;
  const params = new URLSearchParams({bbox:entry.bbox.join(','), bboxSR:'3857', imageSR:'3857', size:'640,360', format:'jpg', f:'image'});
  return {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export?' + params,
    alt: 'Aerial view of ' + track.name + ' venue',
    credit: 'Esri, Vantor, Earthstar Geographics, GIS User Community',
    source: entry.source,
    aerial: true
  };
}

export function trackImageCandidates(track) {
  const photos = (Array.isArray(track.images) ? track.images : []).filter(image =>
    image && image.verified === true && typeof image.url === 'string' && /^https:\/\//i.test(image.url)
  );
  const aerial = trackAerialImage(track);
  return [...photos, ...(aerial ? [aerial] : [])];
}
