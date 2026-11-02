// ============================================================================
// POSTGIS SPATIAL SERVICE & DYNAMIC ETA SIMULATOR
// Distance calculations, polygon containment, and road polyline interpolation
// ============================================================================

const EARTH_RADIUS_METERS = 6371000;
const METERS_TO_MILES = 0.000621371;

/**
 * Calculates great-circle distance between two GPS coordinates using Haversine
 * Equivalent to PostGIS ST_DistanceSphere(ST_MakePoint(lng1, lat1), ST_MakePoint(lng2, lat2))
 */
export function calculateDistanceMeters(lat1, lon1, lat2, lon2) {
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
    Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(EARTH_RADIUS_METERS * c);
}

export function metersToMiles(meters) {
  return +(meters * METERS_TO_MILES).toFixed(1);
}

/**
 * Point-in-polygon containment test using Ray-Casting algorithm
 * Equivalent to PostGIS ST_Contains(polygon_geom, ST_SetSRID(ST_MakePoint(lng, lat), 4326))
 */
export function isPointInPolygon(point, polygon) {
  const [lat, lng] = [point.lat, point.lng];
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];

    const intersect =
      yi > lng !== yj > lng &&
      lat < ((xj - xi) * (lng - yi)) / (yj - yi) + xi;

    if (intersect) inside = !inside;
  }

  return inside;
}

/**
 * Dynamic ETA Engine
 * Combines base kitchen prep, active POS kitchen load velocity, and road transit
 */
export function calculateDynamicETA(restaurant, dropoffCoords = { lat: 37.7645, lng: -122.4178 }) {
  const distanceMeters = calculateDistanceMeters(
    restaurant.location.lat,
    restaurant.location.lng,
    dropoffCoords.lat,
    dropoffCoords.lng
  );

  const distanceMiles = metersToMiles(distanceMeters);

  // Kitchen load adjustment
  let loadBufferMinutes = 0;
  switch (restaurant.current_load_status) {
    case 'quiet':
      loadBufferMinutes = -2;
      break;
    case 'busy':
      loadBufferMinutes = 12;
      break;
    case 'paused':
      loadBufferMinutes = 999;
      break;
    default:
      loadBufferMinutes = 0;
  }

  // Scooter velocity in urban traffic: approx 2.5 minutes per mile
  const transitMinutes = Math.max(4, Math.round(distanceMiles * 2.5));
  const basePrep = restaurant.base_prep_minutes || 15;
  const totalMinMinutes = Math.max(10, basePrep + loadBufferMinutes + transitMinutes - 2);
  const totalMaxMinutes = totalMinMinutes + 8;

  return {
    distanceMeters,
    distanceMiles,
    prepMinutes: basePrep + loadBufferMinutes,
    transitMinutes,
    etaWindow: `${totalMinMinutes}–${totalMaxMinutes} min`,
    arrivalClock: getEstimatedArrivalClock(totalMaxMinutes)
  };
}

function getEstimatedArrivalClock(minutesFromNow) {
  const date = new Date(Date.now() + minutesFromNow * 60 * 1000);
  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${hours}:${minutes} ${ampm}`;
}

/**
 * Linear interpolation between two coordinates with heading angle computation
 */
export function interpolateGPS(p1, p2, progress) {
  const lat = p1.lat + (p2.lat - p1.lat) * progress;
  const lng = p1.lng + (p2.lng - p1.lng) * progress;

  // Compute heading degrees (0 = North, 90 = East)
  const dLng = (p2.lng - p1.lng) * (Math.PI / 180);
  const y = Math.sin(dLng) * Math.cos(p2.lat * (Math.PI / 180));
  const x =
    Math.cos(p1.lat * (Math.PI / 180)) * Math.sin(p2.lat * (Math.PI / 180)) -
    Math.sin(p1.lat * (Math.PI / 180)) * Math.cos(p2.lat * (Math.PI / 180)) * Math.cos(dLng);
  let heading = (Math.atan2(y, x) * 180) / Math.PI;
  heading = (heading + 360) % 360;

  return { lat, lng, heading: Math.round(heading) };
}
