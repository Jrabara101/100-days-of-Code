import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import {
  ArrowLeft,
  CheckCircle2,
  Phone,
  MessageSquare,
  Sparkles,
  Bike,
  ThumbsUp,
  AlertTriangle
} from 'lucide-react';
import {
  COURIER_PROFILE,
  TELEMETRY_STAGES,
  ROUTE_COORDINATES,
  INTERMEDIATE_BATCH_STOP,
  CUSTOMER_DROPOFF_LOCATION
} from '../data/telemetry';
import { calculateDistanceMeters, interpolateGPS } from '../services/spatialService';
import { CourierChatModal } from './CourierChatModal';
import { InstantMakeGoodModal } from './InstantMakeGoodModal';
import { NearbyBundleStrip } from './NearbyBundleStrip';
import { formatCents } from '../services/priceCalculator';
import confetti from 'canvas-confetti';

export function LiveOrderTrackingCockpit({
  order,
  restaurant,
  onBackToDiscovery,
  addressInfo = CUSTOMER_DROPOFF_LOCATION,
  theme = 'daylight'
}) {
  const [currentStageIndex, setCurrentStageIndex] = useState(3); // Stage 4: "Marcus Picked Up & En Route"
  const [isWithinGeofence, setIsWithinGeofence] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isMakeGoodOpen, setIsMakeGoodOpen] = useState(false);
  const [extraTipAdded, setExtraTipAdded] = useState(false);
  const [bundledItems, setBundledItems] = useState([]);
  const [deliveryConfirmed, setDeliveryConfirmed] = useState(false);

  // Map refs
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const courierMarkerRef = useRef(null);
  const animationFrameRef = useRef(null);
  const tileLayerRef = useRef(null);

  const activeAddress = addressInfo || CUSTOMER_DROPOFF_LOCATION;
  const isBatchedRoute = order?.routing_tier === 'eco_saver' || order?.has_intermediate_stop;

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
    }

    const startCoord = [ROUTE_COORDINATES[0].lat, ROUTE_COORDINATES[0].lng];
    const customerCoord = [activeAddress.lat || 37.7645, activeAddress.lng || -122.4178];

    const map = L.map(mapContainerRef.current, {
      center: [37.7695, -122.4140],
      zoom: 14,
      zoomControl: false
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // OpenStreetMap / CartoDB tiles adapting to theme
    const tileUrl = theme === 'midnight'
      ? 'https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

    const tileLayer = L.tileLayer(tileUrl, {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(map);

    tileLayerRef.current = tileLayer;

    // 1. Restaurant Pin
    const restIcon = L.divIcon({
      className: 'custom-rest-pin',
      html: `
        <div style="background-color: #E11D48; color: white; border-radius: 9999px; width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(225, 29, 72, 0.4); border: 3px solid white;">
          <span style="font-size: 18px;">🔥</span>
        </div>
      `,
      iconSize: [38, 38],
      iconAnchor: [19, 19]
    });
    L.marker(startCoord, { icon: restIcon })
      .bindTooltip(`<strong>${restaurant?.name || 'Restaurant'}</strong><br/>Kitchen Dispatch`, { permanent: false, direction: 'top' })
      .addTo(map);

    // 2. Customer Drop-Off Pin with porch photo thumbnail & radar pulse
    const customerIcon = L.divIcon({
      className: 'custom-customer-pin',
      html: `
        <div id="customer-pin-marker" style="position: relative; display: flex; flex-direction: column; align-items: center;">
          <div style="position: absolute; top: -46px; width: 42px; height: 42px; border-radius: 10px; overflow: hidden; border: 2px solid #10B981; box-shadow: 0 4px 12px rgba(0,0,0,0.35); background: white;">
            <img src="${activeAddress.porch_reference_photo || CUSTOMER_DROPOFF_LOCATION.porch_reference_photo}" style="width: 100%; height: 100%; object-fit: cover;" alt="Porch" />
          </div>
          <div style="background-color: #10B981; color: white; border-radius: 9999px; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(16, 185, 129, 0.5); border: 3px solid white;">
            <span style="font-size: 20px;">🏠</span>
          </div>
          <div style="position: absolute; inset: -8px; border-radius: 9999px; border: 2px dashed #10B981; pointer-events: none;" class="animate-radar"></div>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });
    L.marker(customerCoord, { icon: customerIcon })
      .bindTooltip(`<strong>Your Doorstep</strong><br/>${activeAddress.address}`, { permanent: true, direction: 'top' })
      .addTo(map);

    // 150m Geofence boundary circle around customer
    L.circle(customerCoord, {
      radius: 150,
      color: '#10B981',
      fillColor: '#10B981',
      fillOpacity: 0.08,
      weight: 1.5,
      dashArray: '4, 4'
    }).addTo(map);

    // 3. Intermediate Batch Waypoint (if eco-saver/batched)
    if (isBatchedRoute) {
      const batchIcon = L.divIcon({
        className: 'custom-batch-pin',
        html: `
          <div style="background-color: #3B82F6; color: white; border-radius: 9999px; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(59, 130, 246, 0.4); border: 2px solid white;">
            <span style="font-size: 13px;">📦</span>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });
      L.marker([INTERMEDIATE_BATCH_STOP.lat, INTERMEDIATE_BATCH_STOP.lng], { icon: batchIcon })
        .bindTooltip(`<strong>Batched Neighbor Drop-off</strong><br/>Heated Thermal Bag Active`, { permanent: false, direction: 'top' })
        .addTo(map);
    }

    // 4. Route Polyline
    const latLngs = ROUTE_COORDINATES.map((c) => [c.lat, c.lng]);
    L.polyline(latLngs, {
      color: '#2563EB',
      weight: 5,
      opacity: 0.75,
      lineCap: 'round',
      lineJoin: 'round'
    }).addTo(map);

    // 5. Animated Courier Marker with Directional Heading Cone
    const courierIcon = L.divIcon({
      className: 'custom-courier-marker',
      html: `
        <div style="position: relative; width: 52px; height: 52px; display: flex; align-items: center; justify-content: center;">
          <div id="courier-heading-cone" style="position: absolute; top: -14px; width: 0; height: 0; border-left: 14px solid transparent; border-right: 14px solid transparent; border-bottom: 22px solid rgba(59, 130, 246, 0.45); pointer-events: none; transition: transform 0.08s linear;"></div>
          <div id="courier-vehicle-icon" style="background-color: #2563EB; color: white; border-radius: 9999px; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 16px rgba(37, 99, 235, 0.6); border: 3px solid white; transition: transform 0.08s linear;">
            <span style="font-size: 22px;">🛵</span>
          </div>
        </div>
      `,
      iconSize: [52, 52],
      iconAnchor: [26, 26]
    });

    const courierMarker = L.marker([ROUTE_COORDINATES[3].lat, ROUTE_COORDINATES[3].lng], {
      icon: courierIcon,
      zIndexOffset: 1000
    }).addTo(map);

    courierMarkerRef.current = courierMarker;
    mapInstanceRef.current = map;

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      map.remove();
    };
  }, [isBatchedRoute, theme, activeAddress.address, activeAddress.porch_reference_photo]);

  // Smooth 60 FPS courier interpolation animation along route (imperative, zero React state re-render thrashing)
  useEffect(() => {
    if (!mapInstanceRef.current || !courierMarkerRef.current) return;

    let startTime = null;
    const duration = 24000; // 24 seconds full route loop for realistic smooth animation

    const animateCourier = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = (elapsed % duration) / duration;

      // Find waypoint segment
      const totalPoints = ROUTE_COORDINATES.length;
      const exactIndex = progress * (totalPoints - 1);
      const index1 = Math.floor(exactIndex);
      const index2 = Math.min(totalPoints - 1, index1 + 1);
      const segmentProgress = exactIndex - index1;

      const p1 = ROUTE_COORDINATES[index1];
      const p2 = ROUTE_COORDINATES[index2];

      const currentPoint = interpolateGPS(p1, p2, segmentProgress);

      if (courierMarkerRef.current) {
        courierMarkerRef.current.setLatLng([currentPoint.lat, currentPoint.lng]);
      }

      // Rotate vehicle and heading cone in sync with heading degrees
      const vehicleEl = document.getElementById('courier-vehicle-icon');
      const coneEl = document.getElementById('courier-heading-cone');
      if (vehicleEl) {
        vehicleEl.style.transform = `rotate(${currentPoint.heading}deg)`;
      }
      if (coneEl) {
        coneEl.style.transform = `rotate(${currentPoint.heading}deg)`;
      }

      // Check distance to customer doorstep
      const customerLat = activeAddress.lat || CUSTOMER_DROPOFF_LOCATION.lat;
      const customerLng = activeAddress.lng || CUSTOMER_DROPOFF_LOCATION.lng;
      const distToDoorstep = calculateDistanceMeters(
        currentPoint.lat,
        currentPoint.lng,
        customerLat,
        customerLng
      );

      // Geofence trigger: 150 meters (only trigger React state update on transition)
      const inGeofence = distToDoorstep <= 150;
      setIsWithinGeofence((prev) => (prev !== inGeofence ? inGeofence : prev));

      animationFrameRef.current = requestAnimationFrame(animateCourier);
    };

    animationFrameRef.current = requestAnimationFrame(animateCourier);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [activeAddress.lat, activeAddress.lng]);

  // When stage changes, smoothly pan/zoom map
  const handleStageSelect = (stageIdx) => {
    setCurrentStageIndex(stageIdx);
    if (!mapInstanceRef.current) return;

    if (stageIdx === 4 || stageIdx === 5) {
      // Near or delivered: Zoom into street level (zoom: 17-18)
      mapInstanceRef.current.setView(
        [CUSTOMER_DROPOFF_LOCATION.lat, CUSTOMER_DROPOFF_LOCATION.lng],
        17,
        { animate: true }
      );
    } else if (stageIdx === 0 || stageIdx === 1) {
      // Kitchen pass
      mapInstanceRef.current.setView(
        [ROUTE_COORDINATES[0].lat, ROUTE_COORDINATES[0].lng],
        16,
        { animate: true }
      );
    } else {
      // Corridors
      mapInstanceRef.current.setView([37.7695, -122.4140], 14, { animate: true });
    }
  };

  const handleAddExtraTip = () => {
    setExtraTipAdded(true);
    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.7 }
    });
  };

  const handleAddBundleItem = (item) => {
    setBundledItems((prev) => [...prev, item]);
  };

  const isDelivered = currentStageIndex === 5;

  return (
    <div className="relative min-h-[calc(100vh-65px)] flex flex-col lg:flex-row overflow-hidden pb-12">
      {/* Interactive Map Canvas (Full width on mobile, left 58% on desktop) */}
      <div className="relative w-full lg:w-[58%] h-[400px] lg:h-auto min-h-[420px] bg-stone-200 dark:bg-stone-900">
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* Back Button Floating on Map */}
        <div className="absolute top-4 left-4 z-[400]">
          <button
            type="button"
            onClick={onBackToDiscovery}
            className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-[var(--bg-elevated)]/90 backdrop-blur-md border border-[var(--border-hairline)] shadow-lg hover:border-rose-500 text-xs font-bold text-[var(--text-primary)] transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Order Overview</span>
          </button>
        </div>

        {/* Live GPS Telemetry Overlay Pill */}
        <div className="absolute top-4 right-4 z-[400] flex flex-col items-end gap-2">
          <div className="px-3 py-1.5 rounded-full bg-blue-600 text-white text-xs font-semibold shadow-lg backdrop-blur-md flex items-center gap-2 font-mono">
            <span className="w-2 h-2 rounded-full bg-white animate-ping" />
            <span>GPS Ping: 60 FPS WebGL</span>
          </div>

          {/* Curbside Geofence Arrival Badge */}
          {isWithinGeofence && (
            <div className="px-3.5 py-1.5 rounded-full bg-emerald-600 text-white font-bold text-xs shadow-xl backdrop-blur-md flex items-center gap-2 animate-bounce">
              <Bike className="w-4 h-4" />
              <span>🛵 Marcus is pulling up outside now!</span>
            </div>
          )}
        </div>

        {/* Transparent Multi-Stop Batch Route Waypoint Banner */}
        {isBatchedRoute && currentStageIndex >= 3 && !isDelivered && (
          <div className="absolute bottom-4 left-4 right-4 lg:left-6 lg:right-6 z-[400]">
            <div className="p-3.5 rounded-2xl bg-stone-900/90 text-white backdrop-blur-xl border border-blue-500/40 shadow-2xl flex items-center gap-3">
              <span className="text-xl">📦</span>
              <div className="flex-1 text-xs">
                <div className="font-bold text-blue-400">
                  Completing 1 quick drop-off 4 blocks away
                </div>
                <div className="text-stone-300 text-[11px] mt-0.5">
                  Your food is sealed in an insulated 148°F thermal bag • ETA 6:42 PM unchanged
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Floating Telemetry Command Panel (Right 42% on desktop) */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 bg-[var(--bg-canvas)] border-l border-[var(--border-hairline)]">
        {/* Top ETA Horizon Card */}
        <div className="p-5 rounded-3xl bg-[var(--bg-elevated)] border border-[var(--border-hairline)] shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
              Estimated Arrival Horizon
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-mono text-xs font-bold border border-emerald-500/30">
              {isDelivered ? '✓ Delivered' : 'On Time'}
            </span>
          </div>

          <div className="flex items-baseline justify-between">
            <div>
              <div className="text-3xl sm:text-4xl font-display font-black text-[var(--text-primary)] font-mono-numbers">
                {isDelivered ? '6:42 PM' : '6:42 PM'}
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                {isDelivered
                  ? 'Order delivered safely to front porch bench'
                  : 'Arriving in ~11 minutes from Osteria Mozza'}
              </p>
            </div>
            <div className="text-right">
              <div className="text-xs text-[var(--text-muted)] font-mono">Order #FD-9482</div>
              <div className="text-xs font-bold text-rose-600 mt-0.5 font-mono">
                {formatCents(order?.total_charged_cents || 5420)}
              </div>
            </div>
          </div>
        </div>

        {/* 6-Stage Operational Stepper */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-sm text-[var(--text-primary)]">
              Kitchen-to-Doorstep Telemetry Pipeline
            </h3>
            <span className="text-[11px] text-[var(--text-muted)]">Step {currentStageIndex + 1} of 6</span>
          </div>

          {/* Stepper Stage Selector */}
          <div className="space-y-2">
            {TELEMETRY_STAGES.map((stage, idx) => {
              const isPast = idx < currentStageIndex;
              const isCurrent = idx === currentStageIndex;

              return (
                <button
                  key={stage.key}
                  type="button"
                  onClick={() => handleStageSelect(idx)}
                  className={`w-full flex items-center justify-between p-3 rounded-2xl border text-left transition-all ${
                    isCurrent
                      ? 'border-rose-500 bg-rose-500/10 shadow-sm'
                      : isPast
                      ? 'border-[var(--border-hairline)] bg-[var(--bg-surface)] opacity-80'
                      : 'border-[var(--border-hairline)] bg-[var(--bg-elevated)] opacity-40'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                        isCurrent
                          ? 'bg-rose-600 text-white ring-4 ring-rose-500/20'
                          : isPast
                          ? 'bg-emerald-500 text-white'
                          : 'bg-stone-300 dark:bg-stone-700 text-stone-600 dark:text-stone-300'
                      }`}
                    >
                      {isPast ? '✓' : idx + 1}
                    </div>
                    <div>
                      <div className="font-bold text-xs text-[var(--text-primary)]">
                        {stage.label}
                      </div>
                      <div className="text-[11px] text-[var(--text-muted)]">
                        {stage.description}
                      </div>
                    </div>
                  </div>
                  <span className="font-mono text-xs font-semibold text-[var(--text-muted)] shrink-0 ml-2">
                    {stage.timestamp}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Courier Identity & Thermal Assurance Card */}
        <div className="p-4 sm:p-5 rounded-3xl bg-[var(--bg-elevated)] border border-[var(--border-hairline)] shadow-lg space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <img
                src={COURIER_PROFILE.avatar_url}
                alt={COURIER_PROFILE.name}
                className="w-12 h-12 rounded-2xl object-cover border-2 border-rose-500/30"
              />
              <div>
                <div className="font-display font-bold text-sm sm:text-base text-[var(--text-primary)] flex items-center gap-2">
                  <span>{COURIER_PROFILE.name}</span>
                  <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                    ★ {COURIER_PROFILE.rating}
                  </span>
                </div>
                <div className="text-xs text-[var(--text-muted)] mt-0.5">
                  {COURIER_PROFILE.vehicle_badge} • {COURIER_PROFILE.delivery_count} trips
                </div>
              </div>
            </div>

            {/* Courier Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsChatOpen(true)}
                className="p-2.5 rounded-xl bg-rose-600 text-white hover:bg-rose-700 transition-colors shadow-md cursor-pointer"
                title="Message Courier"
              >
                <MessageSquare className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => alert(`Calling masked courier number: ${COURIER_PROFILE.phone_masked}`)}
                className="p-2.5 rounded-xl bg-[var(--bg-surface)] hover:bg-stone-200 dark:hover:bg-stone-800 border border-[var(--border-hairline)] text-[var(--text-primary)] transition-colors cursor-pointer"
                title="Call Courier"
              >
                <Phone className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Thermal Bag Assurance */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs">
            <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-medium">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              <span>Insulated Thermal Heated Bag: <strong>148°F</strong></span>
            </div>
            <button
              type="button"
              onClick={handleAddExtraTip}
              disabled={extraTipAdded}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                extraTipAdded
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-700 dark:text-emerald-300'
              }`}
            >
              {extraTipAdded ? '✓ Tip Added' : '+ $2 Tip'}
            </button>
          </div>
        </div>

        {/* Drop-Off Concierge & Verification Proof */}
        <div className="p-4 sm:p-5 rounded-3xl bg-[var(--bg-elevated)] border border-[var(--border-hairline)] shadow-lg space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-[var(--text-muted)] uppercase tracking-wider">
              Drop-Off Instructions & Pin
            </span>
            <span className="text-emerald-600 dark:text-emerald-400 font-mono">
              Gate: {activeAddress.gate_code}
            </span>
          </div>

          <p className="text-xs text-[var(--text-primary)] bg-[var(--bg-surface)] p-3 rounded-xl border border-[var(--border-hairline)] leading-relaxed">
            {activeAddress.instructions}
          </p>

          {/* Once delivered: Drop-Off Verification Photo Proof Card */}
          {isDelivered && (
            <div className="space-y-3 pt-2 border-t border-[var(--border-hairline)] animate-fadeIn">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Drop-Off Photo Proof Attached
                </span>
                <span className="text-stone-400 font-mono">6:42 PM</span>
              </div>

              <div className="relative rounded-2xl overflow-hidden border border-emerald-500/30 h-44 bg-stone-900">
                <img
                  src={CUSTOMER_DROPOFF_LOCATION.courier_verification_photo}
                  alt="Drop-off proof"
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-lg bg-black/70 text-white text-[10px] font-mono backdrop-blur-md">
                  📍 Verified at Blue Porch Bench • Apt 4B
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setDeliveryConfirmed(true);
                    confetti({ particleCount: 50 });
                  }}
                  className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <span>{deliveryConfirmed ? 'Confirmed!' : 'Everything Perfect'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsMakeGoodOpen(true)}
                  className="py-2.5 px-3 rounded-xl bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-rose-600 dark:text-rose-400 font-semibold text-xs flex items-center justify-center gap-1.5 border border-[var(--border-hairline)] cursor-pointer"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Report Missing / Wrong Item</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 10-Minute Nearby Zero-Fee Bundle Strip (Visible while en route) */}
        {!isDelivered && (
          <NearbyBundleStrip
            onAddBundleItem={handleAddBundleItem}
            bundledItems={bundledItems}
          />
        )}
      </div>

      {/* Courier In-App Chat Modal */}
      <CourierChatModal
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        courier={COURIER_PROFILE}
      />

      {/* 30-Second Automated Instant Make-Good Modal */}
      <InstantMakeGoodModal
        isOpen={isMakeGoodOpen}
        onClose={() => setIsMakeGoodOpen(false)}
        order={order}
        onResolveMakeGood={() => {
          // resolved
        }}
      />
    </div>
  );
}
