import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import Svg, { Polygon, Circle } from 'react-native-svg';

export default function DocumentScannerScreen({ navigation }: any) {
  const [mode, setMode] = useState<'auto' | 'manual'>('auto');
  const [torch, setTorch] = useState(false);
  const [filter, setFilter] = useState('color');

  const handleCapture = () => {
    navigation?.navigate('DocumentCropReview');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#030712" />

      {/* Top Header HUD */}
      <View style={styles.topHud}>
        <TouchableOpacity style={styles.iconCircle} onPress={() => navigation?.goBack()}>
          <Text style={styles.hudIconText}>✕</Text>
        </TouchableOpacity>

        <View style={styles.modePill}>
          <TouchableOpacity
            style={[styles.modeBtn, mode === 'auto' && styles.modeBtnActive]}
            onPress={() => setMode('auto')}
          >
            <Text style={[styles.modeText, mode === 'auto' && styles.modeTextActive]}>
              • Auto
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeBtn, mode === 'manual' && styles.modeBtnActive]}
            onPress={() => setMode('manual')}
          >
            <Text style={[styles.modeText, mode === 'manual' && styles.modeTextActive]}>
              Manual
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.iconCircle, torch && styles.iconCircleActive]}
          onPress={() => setTorch(!torch)}
        >
          <Text style={styles.hudIconText}>⚡</Text>
        </TouchableOpacity>
      </View>

      {/* Telemetry Row */}
      <View style={styles.telemetryRow}>
        <View style={styles.telemetryBadge}>
          <Text style={styles.telemetryText}>🛡 Secure Enclave OCR</Text>
        </View>
        <View style={styles.telemetryBadge}>
          <Text style={styles.telemetryText}>🧭 Hold Flat 0.4°</Text>
        </View>
      </View>

      {/* Camera Viewport & Edge Detection Quad */}
      <View style={styles.viewfinder}>
        {/* Placeholder camera feed layer */}
        <View style={styles.cameraPlaceholder}>
          <Text style={styles.cameraNotice}>[Hardware Camera Sensor Feed Active]</Text>
          <Text style={styles.cameraSubNotice}>API 35 Enclave Direct Stream</Text>
        </View>

        {/* SVG Perspective Quad Polygon */}
        <Svg style={StyleSheet.absoluteFill}>
          <Polygon
            points="35,60 330,45 345,430 25,415"
            fill="rgba(16, 185, 129, 0.12)"
            stroke="#10b981"
            strokeWidth="2.5"
            strokeDasharray="6,4"
          />
          <Circle cx="35" cy="60" r="8" fill="#10b981" stroke="#ffffff" strokeWidth="2" />
          <Circle cx="330" cy="45" r="8" fill="#38bdf8" stroke="#ffffff" strokeWidth="2" />
          <Circle cx="345" cy="430" r="8" fill="#10b981" stroke="#ffffff" strokeWidth="2" />
          <Circle cx="25" cy="415" r="8" fill="#10b981" stroke="#ffffff" strokeWidth="2" />
        </Svg>

        {/* Status Overlay */}
        <View style={styles.detectionBanner}>
          <Text style={styles.detectionTitle}>DOCUMENT DETECTED 98.4%</Text>
          <Text style={styles.detectionSub}>A4 Contract • Page 1/3</Text>
        </View>

        <View style={styles.guidancePill}>
          <Text style={styles.guidanceText}>
            ✦ Position corners or hold steady to auto-capture
          </Text>
        </View>
      </View>

      {/* Bottom Controls HUD */}
      <View style={styles.bottomHud}>
        {/* Filter selection */}
        <View style={styles.filterRow}>
          {['Color', 'B&W Clear', 'Grayscale', 'Unwarp'].map(f => (
            <TouchableOpacity
              key={f}
              onPress={() => setFilter(f.toLowerCase())}
              style={[
                styles.filterBtn,
                filter === f.toLowerCase() && styles.filterBtnActive,
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  filter === f.toLowerCase() && styles.filterTextActive,
                ]}
              >
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Shutter Row */}
        <View style={styles.shutterRow}>
          <View style={styles.pageBox}>
            <Text style={styles.pageCount}>1 / 1</Text>
            <Text style={styles.pageLabel}>PAGES</Text>
          </View>

          <TouchableOpacity style={styles.shutterOuter} onPress={handleCapture}>
            <View style={styles.shutterInner} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.doneBtn}
            onPress={() => navigation?.navigate('DocumentCropReview')}
          >
            <Text style={styles.doneText}>✓</Text>
            <Text style={styles.doneLabel}>DONE</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#030712', justifyContent: 'space-between' },
  topHud: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, alignItems: 'center' },
  iconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1e293b', alignItems: 'center', justifyContent: 'center' },
  iconCircleActive: { backgroundColor: '#f59e0b' },
  hudIconText: { color: '#ffffff', fontSize: 16 },
  modePill: { flexDirection: 'row', backgroundColor: '#1e293b', borderRadius: 999, padding: 3 },
  modeBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  modeBtnActive: { backgroundColor: '#10b981' },
  modeText: { color: '#94a3b8', fontSize: 12, fontWeight: '600' },
  modeTextActive: { color: '#030712' },
  telemetryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16 },
  telemetryBadge: { backgroundColor: '#1e293b', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  telemetryText: { color: '#38bdf8', fontSize: 11, fontFamily: 'monospace' },
  viewfinder: { flex: 1, margin: 16, borderRadius: 24, overflow: 'hidden', justifyContent: 'center', alignItems: 'center', backgroundColor: '#0b111e' },
  cameraPlaceholder: { alignItems: 'center', opacity: 0.6 },
  cameraNotice: { color: '#10b981', fontSize: 12, fontFamily: 'monospace' },
  cameraSubNotice: { color: '#94a3b8', fontSize: 10, marginTop: 4 },
  detectionBanner: { position: 'absolute', top: 16, alignItems: 'center', backgroundColor: 'rgba(3,7,18,0.85)', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999 },
  detectionTitle: { color: '#10b981', fontSize: 11, fontWeight: '700', fontFamily: 'monospace' },
  detectionSub: { color: '#ffffff', fontSize: 10, marginTop: 2 },
  guidancePill: { position: 'absolute', bottom: 16, backgroundColor: 'rgba(3,7,18,0.85)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999 },
  guidanceText: { color: '#ffffff', fontSize: 11, fontWeight: '500' },
  bottomHud: { padding: 16, gap: 16 },
  filterRow: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  filterBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: '#1e293b' },
  filterBtnActive: { backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#10b981' },
  filterText: { color: '#94a3b8', fontSize: 12 },
  filterTextActive: { color: '#10b981', fontWeight: '700' },
  shutterRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  pageBox: { width: 52, height: 52, borderRadius: 14, backgroundColor: '#1e293b', alignItems: 'center', justifyContent: 'center' },
  pageCount: { color: '#ffffff', fontSize: 13, fontWeight: '700' },
  pageLabel: { color: '#94a3b8', fontSize: 9, fontWeight: '600' },
  shutterOuter: { width: 72, height: 72, borderRadius: 36, borderWidth: 4, borderColor: '#ffffff', padding: 4, alignItems: 'center', justifyContent: 'center' },
  shutterInner: { width: '100%', height: '100%', borderRadius: 32, backgroundColor: '#ffffff' },
  doneBtn: { width: 52, height: 52, borderRadius: 14, backgroundColor: '#10b981', alignItems: 'center', justifyContent: 'center' },
  doneText: { color: '#030712', fontSize: 16, fontWeight: '700' },
  doneLabel: { color: '#030712', fontSize: 9, fontWeight: '800' },
});

