import { StraightTrack, ArcTrack, CompositeTrack } from './RoadGeometry.js';
import { TrafficLightFSM } from './TrafficLightFSM.js';
import { PIXELS_PER_METER } from './Vehicle.js';

export const SCENARIOS = {
  SUGIYAMA_RING: {
    id: 'SUGIYAMA_RING',
    name: 'Sugiyama Ring (Phantom Traffic Jam)',
    description: 'Classic circle experiment (Sugiyama et al.) demonstrating emergent phantom shockwaves from driver instability.',
    setup: (canvasWidth = 1000, canvasHeight = 700) => {
      const cx = canvasWidth / 2;
      const cy = canvasHeight / 2;
      const radiusMeters = 45; // ~283m circumference

      const ringTrack = new ArcTrack('ring', 'Circle Ring', cx, cy, radiusMeters, 0, Math.PI * 2, true);

      return {
        tracks: {
          ring: ringTrack
        },
        trafficLight: null,
        initialVehicles: 22,
        initialSpacing: ringTrack.lengthMeters / 22,
        inflowRate: 0, // Closed circuit
        spawnLane: 'ring',
        roadWidth: 36,
        camera: { x: cx, y: cy, zoom: 1.0 },
        scenarioType: 'ring'
      };
    }
  },

  FOUR_WAY_INTERSECTION: {
    id: 'FOUR_WAY_INTERSECTION',
    name: '4-Way Signalized Urban Intersection',
    description: 'Dual-phase & 4-phase traffic light FSM with virtual obstacle stop-line injection and dilemma zone logic.',
    setup: (canvasWidth = 1000, canvasHeight = 700) => {
      const cx = canvasWidth / 2;
      const cy = canvasHeight / 2;
      const roadWidthPx = 54;
      const laneOffsetMeters = (roadWidthPx / 4) / PIXELS_PER_METER;

      // 4 directional straight tracks
      const nsSouthbound = new StraightTrack('NS_SOUTHBOUND', 'Southbound', cx + roadWidthPx / 4, 0, cx + roadWidthPx / 4, canvasHeight, true);
      const nsNorthbound = new StraightTrack('NS_NORTHBOUND', 'Northbound', cx - roadWidthPx / 4, canvasHeight, cx - roadWidthPx / 4, 0, true);
      const ewEastbound = new StraightTrack('EW_EASTBOUND', 'Eastbound', 0, cy + roadWidthPx / 4, canvasWidth, cy + roadWidthPx / 4, true);
      const ewWestbound = new StraightTrack('EW_WESTBOUND', 'Westbound', canvasWidth, cy - roadWidthPx / 4, 0, cy - roadWidthPx / 4, true);

      const trafficLight = new TrafficLightFSM({
        greenDuration: 8.0,
        yellowDuration: 2.2,
        allRedDuration: 1.0,
        adaptiveMode: false
      });

      // Set stop lines 2 meters before intersection cross-box
      const nsStopDistMeters = (cy - roadWidthPx / 2 - 12) / PIXELS_PER_METER;
      const ewStopDistMeters = (cx - roadWidthPx / 2 - 12) / PIXELS_PER_METER;

      trafficLight.setStopLine('NS_SOUTHBOUND', nsStopDistMeters);
      trafficLight.setStopLine('NS_NORTHBOUND', nsStopDistMeters);
      trafficLight.setStopLine('EW_EASTBOUND', ewStopDistMeters);
      trafficLight.setStopLine('EW_WESTBOUND', ewStopDistMeters);

      return {
        tracks: {
          NS_SOUTHBOUND: nsSouthbound,
          NS_NORTHBOUND: nsNorthbound,
          EW_EASTBOUND: ewEastbound,
          EW_WESTBOUND: ewWestbound
        },
        trafficLight,
        initialVehicles: 16,
        initialSpacing: 25,
        inflowRate: 35, // vehicles per minute
        spawnLanes: ['NS_SOUTHBOUND', 'NS_NORTHBOUND', 'EW_EASTBOUND', 'EW_WESTBOUND'],
        roadWidth: roadWidthPx,
        camera: { x: cx, y: cy, zoom: 1.0 },
        scenarioType: 'intersection'
      };
    }
  },

  HIGHWAY_BOTTLENECK: {
    id: 'HIGHWAY_BOTTLENECK',
    name: 'Highway Lane Drop & Merge Bottleneck',
    description: 'Multi-lane freeway bottleneck creating upstream capacity collapse, queue shockwaves, and free discharge.',
    setup: (canvasWidth = 1000, canvasHeight = 700) => {
      const cy = canvasHeight / 2;
      const laneSpacingPx = 28;
      const roadWidthPx = 70;

      // 2 parallel highway lanes: Lane 0 (main, continuous), Lane 1 (merging/closing at 65% of track)
      const lane0 = new StraightTrack('LANE_0', 'Highway Fast Lane', 0, cy - laneSpacingPx / 2, canvasWidth, cy - laneSpacingPx / 2, true);
      const lane1 = new StraightTrack('LANE_1', 'Highway Merge Lane', 0, cy + laneSpacingPx / 2, canvasWidth, cy + laneSpacingPx / 2, true);

      return {
        tracks: {
          LANE_0: lane0,
          LANE_1: lane1
        },
        bottleneck: {
          laneId: 'LANE_1',
          dropPointMeters: (canvasWidth * 0.65) / PIXELS_PER_METER,
          taperStartMeters: (canvasWidth * 0.50) / PIXELS_PER_METER
        },
        trafficLight: null,
        initialVehicles: 20,
        initialSpacing: 22,
        inflowRate: 50, // High demand
        spawnLanes: ['LANE_0', 'LANE_1'],
        roadWidth: roadWidthPx,
        camera: { x: canvasWidth / 2, y: cy, zoom: 1.0 },
        scenarioType: 'bottleneck'
      };
    }
  },

  ROUNDABOUT: {
    id: 'ROUNDABOUT',
    name: 'Modern Turbo Roundabout',
    description: 'Continuous circular flow with yield-on-entry priority rules and multi-approach weaving.',
    setup: (canvasWidth = 1000, canvasHeight = 700) => {
      const cx = canvasWidth / 2;
      const cy = canvasHeight / 2;
      const ringRadiusMeters = 36;
      const roadWidthPx = 38;

      const ringTrack = new ArcTrack('RING', 'Roundabout Ring', cx, cy, ringRadiusMeters, 0, Math.PI * 2, true);

      // Approach tracks
      const northIn = new StraightTrack('APP_NORTH', 'North Entry', cx - 18, 0, cx - 18, cy - ringRadiusMeters * PIXELS_PER_METER, false);
      const southIn = new StraightTrack('APP_SOUTH', 'South Entry', cx + 18, canvasHeight, cx + 18, cy + ringRadiusMeters * PIXELS_PER_METER, false);
      const westIn = new StraightTrack('APP_WEST', 'West Entry', 0, cy + 18, cx - ringRadiusMeters * PIXELS_PER_METER, cy + 18, false);
      const eastIn = new StraightTrack('APP_EAST', 'East Entry', canvasWidth, cy - 18, cx + ringRadiusMeters * PIXELS_PER_METER, cy - 18, false);

      return {
        tracks: {
          RING: ringTrack,
          APP_NORTH: northIn,
          APP_SOUTH: southIn,
          APP_WEST: westIn,
          APP_EAST: eastIn
        },
        trafficLight: null,
        initialVehicles: 18,
        initialSpacing: 20,
        inflowRate: 30,
        spawnLanes: ['RING', 'APP_NORTH', 'APP_SOUTH', 'APP_WEST', 'APP_EAST'],
        roadWidth: roadWidthPx,
        camera: { x: cx, y: cy, zoom: 1.0 },
        scenarioType: 'roundabout'
      };
    }
  }
};
