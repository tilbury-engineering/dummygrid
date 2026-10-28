// Request a view centred on the recorded venue, in Web Mercator metres.
// The ground footprint stays consistent at different latitudes.
export function trackAerialImage(track) {
  // The imported Buckmore pin points at the neighbouring scout campsite.
  // Circuit centre: https://www.openstreetmap.org/way/207056667
  if (track.id === 'buckmore-park') track = {...track, lat:51.3438, long:0.5017};
  if (track.lat == null || track.long == null || track.lat === '' || track.long === '') return null;
  const lat = Number(track.lat), lon = Number(track.long);
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 85 || Math.abs(lon) > 180) return null;
  const radians = lat * Math.PI / 180;
  const x = 6378137 * lon * Math.PI / 180;
  const y = 6378137 * Math.log(Math.tan(Math.PI / 4 + radians / 2));
  const length = Number(track.trackLengthM) || 0;
  const width = (track.venueType === 'Indoor' ? 500 : Math.max(900, Math.min(1800, length))) / Math.cos(radians);
  const height = width * 9 / 16;
  const bbox = [x - width / 2, y - height / 2, x + width / 2, y + height / 2].map(n => n.toFixed(2)).join(',');
  const params = new URLSearchParams({bbox, bboxSR:'3857', imageSR:'3857', size:'640,360', format:'jpg', f:'image'});
  return {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export?' + params,
    alt: 'Aerial view of the recorded location of ' + track.name,
    credit: 'Esri, Vantor, Earthstar Geographics, GIS User Community',
    aerial: true
  };
}

export function trackImageCandidates(track) {
  const photos = (Array.isArray(track.images) ? track.images : []).map(image =>
    typeof image === 'string' ? {url:image} : image
  ).filter(image => image && typeof image.url === 'string' && /^https:\/\//i.test(image.url));
  const aerial = trackAerialImage(track);
  return [...photos, ...(aerial ? [aerial] : [])];
}
