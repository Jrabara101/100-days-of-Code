import { describe, it, expect } from 'vitest';
import {
  calculateDistanceMeters,
  metersToMiles,
  isPointInPolygon,
  calculateDynamicETA,
  interpolateGPS
} from '../services/spatialService.js';

describe('spatialService tests', () => {
  it('calculates distance between coordinates accurately', () => {
    // San Francisco City Hall to Ferry Building (~2.3km)
    const lat1 = 37.7793, lon1 = -122.4192;
    const lat2 = 37.7955, lon2 = -122.3937;
    const dist = calculateDistanceMeters(lat1, lon1, lat2, lon2);
    expect(dist).toBeGreaterThan(2000);
    expect(dist).toBeLessThan(3000);
    expect(metersToMiles(dist)).toBeGreaterThan(1.2);
  });

  it('correctly tests point in polygon containment', () => {
    const polygon = [
      [37.78, -122.43],
      [37.78, -122.40],
      [37.75, -122.40],
      [37.75, -122.43]
    ];

    const insidePoint = { lat: 37.765, lng: -122.415 };
    const outsidePoint = { lat: 37.810, lng: -122.350 };

    expect(isPointInPolygon(insidePoint, polygon)).toBe(true);
    expect(isPointInPolygon(outsidePoint, polygon)).toBe(false);
  });

  it('adjusts ETA based on kitchen load velocity (quiet vs busy)', () => {
    const mockRestaurantQuiet = {
      base_prep_minutes: 15,
      current_load_status: 'quiet',
      location: { lat: 37.7749, lng: -122.4194 }
    };

    const mockRestaurantBusy = {
      base_prep_minutes: 15,
      current_load_status: 'busy',
      location: { lat: 37.7749, lng: -122.4194 }
    };

    const quietETA = calculateDynamicETA(mockRestaurantQuiet);
    const busyETA = calculateDynamicETA(mockRestaurantBusy);

    expect(quietETA.prepMinutes).toBeLessThan(busyETA.prepMinutes);
    expect(quietETA.prepMinutes).toBe(13); // 15 - 2
    expect(busyETA.prepMinutes).toBe(27);  // 15 + 12
  });

  it('interpolates GPS positions smoothly with valid heading', () => {
    const p1 = { lat: 37.77, lng: -122.41 };
    const p2 = { lat: 37.78, lng: -122.40 };

    const midpoint = interpolateGPS(p1, p2, 0.5);
    expect(midpoint.lat).toBeCloseTo(37.775, 4);
    expect(midpoint.lng).toBeCloseTo(-122.405, 4);
    expect(midpoint.heading).toBeGreaterThan(0);
    expect(midpoint.heading).toBeLessThan(90);
  });
});
