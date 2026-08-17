import { Vehicle, PIXELS_PER_METER } from './Vehicle.js';
import { calculateIDMAcceleration, DRIVER_PROFILES } from './IDM.js';
import { SCENARIOS } from './Scenarios.js';
import { SpaceTimeRecorder } from './SpaceTimeRecorder.js';

export class TrafficEngine {
  constructor(canvasWidth = 1000, canvasHeight = 700) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;

    this.vehicles = [];
    this.nextVehicleId = 1;
    this.scenarioKey = 'SUGIYAMA_RING';
    this.scenarioConfig = null;

    this.trafficLight = null;
    this.tracks = {};
    this.bottleneck = null;

    this.inflowRate = 0; // veh/min
    this.inflowTimer = 0;
    this.globalDriverProfile = 'COMMUTER';
    this.globalIDMOverrides = {};

    this.isPaused = false;
    this.speedMultiplier = 1.0;
    this.selectedVehicleId = null;

    // Trajectory & Telemetry recorder
    this.recorder = new SpaceTimeRecorder();

    // Shockwave & Flow Telemetry
    this.telemetry = {
      vehicleCount: 0,
      avgSpeedKmh: 0,
      flowRateVehHr: 0,
      shockwaveIndex: 0, // 0..100 congestion / variance index
      stoppedCount: 0,
      brakingCount: 0,
      fps: 60,
      simTime: 0
    };

    this.initScenario(this.scenarioKey);
  }

  initScenario(scenarioKey) {
    this.scenarioKey = scenarioKey;
    const scenarioDef = SCENARIOS[scenarioKey] || SCENARIOS.SUGIYAMA_RING;
    this.scenarioConfig = scenarioDef.setup(this.canvasWidth, this.canvasHeight);

    this.tracks = this.scenarioConfig.tracks;
    this.trafficLight = this.scenarioConfig.trafficLight;
    this.bottleneck = this.scenarioConfig.bottleneck || null;
    this.inflowRate = this.scenarioConfig.inflowRate || 0;
    this.inflowTimer = 0;
    this.vehicles = [];
    this.nextVehicleId = 1;
    this.selectedVehicleId = null;
    this.recorder.clear();

    // Initialize preset vehicles
    this.populateInitialVehicles();
  }

  populateInitialVehicles() {
    const cfg = this.scenarioConfig;
    if (!cfg) return;

    const count = cfg.initialVehicles || 0;
    const profileKeys = Object.keys(DRIVER_PROFILES);

    if (cfg.scenarioType === 'ring') {
      const track = this.tracks.ring;
      const spacing = track.lengthMeters / Math.max(1, count);

      for (let i = 0; i < count; i++) {
        const s = i * spacing;
        // In Sugiyama ring, start with slight speed fluctuation for realistic demonstration
        const v = 8.33 + (Math.random() - 0.5) * 0.4; // ~30 km/h
        const profile = profileKeys[i % profileKeys.length];

        const veh = new Vehicle({
          id: this.nextVehicleId++,
          s,
          v,
          laneId: 'ring',
          profileKey: profile,
          customParams: this.globalIDMOverrides,
          vehicleType: i === 0 ? 'sports' : (i % 5 === 0 ? 'truck' : 'car')
        });

        this.vehicles.push(veh);
      }
    } else if (cfg.scenarioType === 'intersection') {
      const lanes = Object.keys(this.tracks);
      const perLane = Math.floor(count / lanes.length);

      lanes.forEach(laneId => {
        for (let i = 0; i < perLane; i++) {
          const s = i * cfg.initialSpacing;
          const profile = profileKeys[Math.floor(Math.random() * profileKeys.length)];

          const veh = new Vehicle({
            id: this.nextVehicleId++,
            s,
            v: 11.0 + Math.random() * 2.0,
            laneId,
            profileKey: profile,
            customParams: this.globalIDMOverrides,
            vehicleType: Math.random() > 0.8 ? 'truck' : 'car'
          });

          this.vehicles.push(veh);
        }
      });
    } else if (cfg.scenarioType === 'bottleneck') {
      const lanes = ['LANE_0', 'LANE_1'];
      const perLane = Math.floor(count / 2);

      lanes.forEach(laneId => {
        for (let i = 0; i < perLane; i++) {
          const s = i * cfg.initialSpacing;
          const veh = new Vehicle({
            id: this.nextVehicleId++,
            s,
            v: 14.0 + Math.random() * 2.0,
            laneId,
            profileKey: profileKeys[Math.floor(Math.random() * profileKeys.length)],
            customParams: this.globalIDMOverrides
          });
          this.vehicles.push(veh);
        }
      });
    } else if (cfg.scenarioType === 'roundabout') {
      const ringTrack = this.tracks.RING;
      const ringCount = 10;
      const spacing = ringTrack.lengthMeters / ringCount;

      for (let i = 0; i < ringCount; i++) {
        const veh = new Vehicle({
          id: this.nextVehicleId++,
          s: i * spacing,
          v: 9.0,
          laneId: 'RING',
          profileKey: 'COMMUTER',
          customParams: this.globalIDMOverrides
        });
        this.vehicles.push(veh);
      }
    }
  }

  spawnVehicle(laneId = null, profileKey = null, vehicleType = 'car') {
    const targetLane = laneId || (this.scenarioConfig?.spawnLanes?.[0] || 'ring');
    const track = this.tracks[targetLane];
    if (!track) return null;

    // Safety check: is there a car blocking the spawn point (s < 15m)?
    const laneVehicles = this.vehicles.filter(v => v.laneId === targetLane);
    const isBlocked = laneVehicles.some(v => v.s < 12.0);
    if (isBlocked) return null;

    const profile = profileKey || this.globalDriverProfile;
    const veh = new Vehicle({
      id: this.nextVehicleId++,
      s: 0,
      v: 10.0,
      laneId: targetLane,
      profileKey: profile,
      customParams: this.globalIDMOverrides,
      vehicleType
    });

    this.vehicles.push(veh);
    return veh;
  }

  /**
   * Core simulation step
   * @param {number} rawDt - Time delta in seconds (typically ~0.016s for 60fps)
   */
  step(rawDt) {
    if (this.isPaused) return;

    const dt = Math.min(0.05, rawDt) * this.speedMultiplier;

    // 1. UPDATE INTERSECTION SIGNAL FSM
    if (this.trafficLight) {
      const nsQueue = this.vehicles.filter(v => v.laneId.startsWith('NS') && v.v < 1.0).length;
      const ewQueue = this.vehicles.filter(v => v.laneId.startsWith('EW') && v.v < 1.0).length;
      this.trafficLight.update(dt, { nsQueue, ewQueue });
    }

    // 2. INFLOW SPAWNER
    if (this.inflowRate > 0 && this.scenarioConfig?.spawnLanes) {
      this.inflowTimer += dt;
      const spawnInterval = 60 / this.inflowRate; // seconds per car
      if (this.inflowTimer >= spawnInterval) {
        this.inflowTimer = 0;
        const randomLane = this.scenarioConfig.spawnLanes[Math.floor(Math.random() * this.scenarioConfig.spawnLanes.length)];
        this.spawnVehicle(randomLane);
      }
    }

    // 3. GROUP VEHICLES BY LANE & SORT BY LONGITUDINAL POSITION s (DESCENDING)
    const laneMap = new Map();
    for (let i = 0; i < this.vehicles.length; i++) {
      const v = this.vehicles[i];
      if (!laneMap.has(v.laneId)) {
        laneMap.set(v.laneId, []);
      }
      laneMap.get(v.laneId).push(v);
    }

    // 4. PROCESS EACH LANE WITH IDM DYNAMICS
    laneMap.forEach((laneVehs, laneId) => {
      const track = this.tracks[laneId];
      if (!track) return;

      // Sort vehicles along track in descending order of position s
      laneVehs.sort((a, b) => b.s - a.s);

      for (let i = 0; i < laneVehs.length; i++) {
        const veh = laneVehs[i];
        let leader = null;
        let leadDistance = Infinity;

        // Physical vehicle ahead in same lane
        if (i > 0) {
          const directLeader = laneVehs[i - 1];
          const gap = directLeader.s - veh.s - directLeader.length;
          if (gap > 0) {
            leader = directLeader;
            leadDistance = gap;
          }
        } else if (track.isLoop && laneVehs.length > 1) {
          // In a closed loop (e.g. Ring), first vehicle wraps around to follow the last vehicle
          const lastVeh = laneVehs[laneVehs.length - 1];
          const wrapGap = (track.lengthMeters - veh.s) + lastVeh.s - lastVeh.length;
          if (wrapGap > 0) {
            leader = lastVeh;
            leadDistance = wrapGap;
          }
        }

        // Virtual Obstacle Checks:
        // A) Traffic Light Stop Line
        if (this.trafficLight) {
          const signalObstacle = this.trafficLight.getVirtualObstacle(veh, laneId);
          if (signalObstacle && signalObstacle.s > veh.s) {
            const stopGap = signalObstacle.s - veh.s - veh.length;
            if (stopGap > 0 && stopGap < leadDistance) {
              leader = signalObstacle;
              leadDistance = stopGap;
            }
          }
        }

        // B) Highway Lane Drop Bottleneck Barrier
        if (this.bottleneck && this.bottleneck.laneId === laneId) {
          const dropS = this.bottleneck.dropPointMeters;
          if (veh.s < dropS) {
            const distToDrop = dropS - veh.s - veh.length;
            if (distToDrop > 0 && distToDrop < leadDistance) {
              leader = { s: dropS, v: 0, length: 0 };
              leadDistance = distToDrop;
            }

            // Attempt lane merge into adjacent LANE_0 before reaching drop point
            if (veh.s > this.bottleneck.taperStartMeters && veh.laneChangeProgress >= 1.0) {
              veh.startLaneChange('LANE_0', -1);
            }
          }
        }

        // Compute IDM acceleration
        veh.computeAcceleration(leader, leadDistance);
      }
    });

    // 5. INTEGRATE PHYSICS & HANDLE BOUNDARIES
    const despawnList = [];

    for (let i = 0; i < this.vehicles.length; i++) {
      const veh = this.vehicles[i];
      const track = this.tracks[veh.laneId];

      veh.integrate(dt);

      if (track) {
        if (track.isLoop) {
          // Closed circuit wrap-around
          if (veh.s >= track.lengthMeters) {
            veh.s = veh.s % track.lengthMeters;
          }
        } else {
          // Open track despawn
          if (veh.s > track.lengthMeters + 10) {
            despawnList.push(veh.id);
          }
        }
      }
    }

    // Remove despawned vehicles
    if (despawnList.length > 0) {
      this.vehicles = this.vehicles.filter(v => !despawnList.includes(v.id));
    }

    // 6. RECORD HISTORICAL TELEMETRY & SPACE-TIME DATA
    const mainTrack = this.tracks.ring || this.tracks.LANE_0 || Object.values(this.tracks)[0];
    this.recorder.record(dt, this.vehicles, mainTrack ? mainTrack.lengthMeters : 500);

    this.updateTelemetryMetrics(dt);
  }

  updateTelemetryMetrics(dt) {
    const totalVeh = this.vehicles.length;
    let totalSpeed = 0;
    let stoppedCount = 0;
    let brakingCount = 0;

    for (let i = 0; i < totalVeh; i++) {
      const v = this.vehicles[i];
      totalSpeed += v.v;
      if (v.v < 0.8) stoppedCount++;
      if (v.isBraking) brakingCount++;
    }

    const avgSpeedMps = totalVeh > 0 ? (totalSpeed / totalVeh) : 0;
    const avgSpeedKmh = avgSpeedMps * 3.6;

    // Shockwave Index: Variance of velocities + stopped ratio
    let speedVariance = 0;
    for (let i = 0; i < totalVeh; i++) {
      const diff = (this.vehicles[i].v * 3.6) - avgSpeedKmh;
      speedVariance += diff * diff;
    }
    const stdDev = totalVeh > 0 ? Math.sqrt(speedVariance / totalVeh) : 0;
    const shockwaveIndex = Math.min(100, Math.round((stdDev * 3) + (stoppedCount / Math.max(1, totalVeh)) * 50));

    this.telemetry = {
      vehicleCount: totalVeh,
      avgSpeedKmh: Math.round(avgSpeedKmh),
      flowRateVehHr: Math.round(totalVeh * avgSpeedKmh * 0.8),
      shockwaveIndex,
      stoppedCount,
      brakingCount,
      simTime: Math.round(this.recorder.simTime * 10) / 10
    };
  }

  // Convert 1D arc coordinates to 2D Cartesian world coordinates
  getVehicleWorldTransform(veh) {
    const track = this.tracks[veh.laneId];
    if (!track) {
      return { x: 0, y: 0, angle: 0 };
    }
    return track.getTransform(veh.s, veh.lateralOffset);
  }

  triggerTapBrakeLeader() {
    if (this.vehicles.length === 0) return;
    // Find leader or random car
    const target = this.selectedVehicleId 
      ? this.vehicles.find(v => v.id === this.selectedVehicleId)
      : this.vehicles[0];
    
    if (target) {
      target.triggerTapBrake(3.0);
    }
  }

  toggleStallSelected() {
    if (this.vehicles.length === 0) return;
    const target = this.selectedVehicleId 
      ? this.vehicles.find(v => v.id === this.selectedVehicleId)
      : this.vehicles[0];

    if (target) {
      target.toggleStall();
    }
  }

  setGlobalIDMOverrides(overrides) {
    this.globalIDMOverrides = { ...this.globalIDMOverrides, ...overrides };
    // Apply to existing vehicles
    this.vehicles.forEach(v => {
      v.params = { ...v.params, ...overrides };
    });
  }

  reset() {
    this.initScenario(this.scenarioKey);
  }
}
