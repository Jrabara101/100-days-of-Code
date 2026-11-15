import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  TextInput,
} from 'react-native';
import Svg, { Polygon, Line } from 'react-native-svg';

export default function DocumentCropReviewScreen({ navigation }: any) {
  const [activeTab, setActiveTab] = useState<'crop' | 'ocr'>('crop');
  const [rotation, setRotation] = useState(0);
  const [deskew, setDeskew] = useState(true);
  const [format, setFormat] = useState('A4');
  const [profile, setProfile] = useState<'bw' | 'color' | 'gray'>('bw');

  const [ocrText] = useState(`SERVICE AGREEMENT & TECHNICAL SPECIFICATIONS
Document Reference: TS-2026-ENCLAVE-04
Classification: CONFIDENTIAL // STRICT PRIVILEGE
Page: 1 of 3
Legibility: 99.2% • Ready for OCR

1. PARTIES & RECITALS
This Mutual Master Services Agreement ("Agreement") is executed between TrustMedia Enterprise Systems Inc. ("Provider") and the Designated Client Organization ("Recipient"). Both parties covenant to uphold zero-knowledge cryptographic safeguards regarding all persisted data streams, storage vaults, and telemetry keys.`);

  const handleFinish = () => {
    navigation?.navigate('MainTabs', { screen: 'Files' });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.retakeBtn}>
          <Text style={styles.retakeText}>← Retake</Text>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.pageTitle}>• PAGE 1 OF 1 • REVIEW</Text>
          <Text style={styles.docTitle}>Contract_Scan_01.pdf</Text>
        </View>

        <TouchableOpacity onPress={handleFinish} style={styles.doneBtn}>
          <Text style={styles.doneBtnText}>✓ Done</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          onPress={() => setActiveTab('crop')}
          style={[styles.tabBtn, activeTab === 'crop' && styles.tabBtnActive]}
        >
          <Text style={[styles.tabText, activeTab === 'crop' && styles.tabTextActive]}>
            Adjust Crop &amp; Filter
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('ocr')}
          style={[styles.tabBtn, activeTab === 'ocr' && styles.tabBtnActive]}
        >
          <Text style={[styles.tabText, activeTab === 'ocr' && styles.tabTextActive]}>
            Live OCR Text (342)
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {activeTab === 'crop' ? (
          <>
            {/* Status bar */}
            <View style={styles.statusRow}>
              <View style={styles.legibilityBadge}>
                <Text style={styles.legibilityText}>• Legibility: 99.2% • Ready for OCR</Text>
              </View>
              <Text style={styles.resText}>1600 × 2140 px</Text>
            </View>

            {/* Document Crop Canvas */}
            <View style={styles.cropCanvas}>
              {/* Document Image Simulation */}
              <View style={[styles.mockDoc, { transform: [{ rotate: `${rotation}deg` }] }]}>
                <Text style={styles.docWatermark}>CONFIDENTIAL CONTRACT</Text>
              </View>

              {/* Grid Lines */}
              <Svg style={StyleSheet.absoluteFill}>
                <Line x1="33%" y1="0" x2="33%" y2="100%" stroke="rgba(5, 150, 105, 0.3)" strokeDasharray="4,4" />
                <Line x1="66%" y1="0" x2="66%" y2="100%" stroke="rgba(5, 150, 105, 0.3)" strokeDasharray="4,4" />
                <Line x1="0" y1="33%" x2="100%" y2="33%" stroke="rgba(5, 150, 105, 0.3)" strokeDasharray="4,4" />
                <Line x1="0" y1="66%" x2="100%" y2="66%" stroke="rgba(5, 150, 105, 0.3)" strokeDasharray="4,4" />
                <Polygon
                  points="25,25 295,25 295,355 25,355"
                  fill="rgba(5, 150, 105, 0.08)"
                  stroke="#059669"
                  strokeWidth="2"
                  strokeDasharray="6,4"
                />
              </Svg>

              {/* Magnifier Loupe */}
              <View style={styles.loupe}>
                <Text style={styles.loupeText}>CORNER 1x</Text>
              </View>

              <View style={styles.lockBadge}>
                <Text style={styles.lockBadgeText}>✓ Perspective Corners Auto-Locked</Text>
              </View>
            </View>

            {/* Quick Adjustment Controls */}
            <View style={styles.controlsGrid}>
              <TouchableOpacity
                style={styles.controlTile}
                onPress={() => setRotation((r) => (r + 90) % 360)}
              >
                <Text style={styles.controlIcon}>🔄</Text>
                <Text style={styles.controlLabel}>Rotate 90°</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.controlTile, deskew && styles.controlTileActive]}
                onPress={() => setDeskew(!deskew)}
              >
                <Text style={styles.controlIcon}>📐</Text>
                <Text style={styles.controlLabel}>Deskew {deskew ? 'On' : 'Off'}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.controlTile}
                onPress={() => setFormat(f => f === 'A4' ? 'Letter' : 'A4')}
              >
                <Text style={styles.controlIcon}>📄</Text>
                <Text style={styles.controlLabel}>Format: {format}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.controlTile}>
                <Text style={styles.controlIcon}>↩</Text>
                <Text style={styles.controlLabel}>Reset Pin</Text>
              </TouchableOpacity>
            </View>

            {/* Enhancement Profile */}
            <View style={styles.profileCard}>
              <Text style={styles.profileHeader}>ENHANCEMENT PROFILE</Text>
              <View style={styles.profileRow}>
                <TouchableOpacity
                  style={[styles.profileBtn, profile === 'bw' && styles.profileBtnActive]}
                  onPress={() => setProfile('bw')}
                >
                  <Text style={styles.profileBtnText}>Clean B&amp;W</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.profileBtn, profile === 'color' && styles.profileBtnActive]}
                  onPress={() => setProfile('color')}
                >
                  <Text style={styles.profileBtnText}>True Color</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.profileBtn, profile === 'gray' && styles.profileBtnActive]}
                  onPress={() => setProfile('gray')}
                >
                  <Text style={styles.profileBtnText}>Grayscale</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        ) : (
          <View style={styles.ocrBox}>
            <TextInput
              multiline
              value={ocrText}
              editable={false}
              style={styles.ocrInput}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f9ff' },
  header: {
    height: 56,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  retakeBtn: { paddingVertical: 6 },
  retakeText: { fontSize: 13, color: '#395f95', fontWeight: '600' },
  headerCenter: { alignItems: 'center' },
  pageTitle: { fontSize: 11, fontWeight: '700', color: '#001026' },
  docTitle: { fontSize: 10, color: '#74777f' },
  doneBtn: { backgroundColor: '#059669', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999 },
  doneBtnText: { color: '#ffffff', fontSize: 12, fontWeight: '700' },
  tabContainer: { flexDirection: 'row', margin: 16, backgroundColor: '#ecf4ff', borderRadius: 12, padding: 4 },
  tabBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  tabBtnActive: { backgroundColor: '#ffffff', elevation: 1 },
  tabText: { fontSize: 12, color: '#74777f', fontWeight: '500' },
  tabTextActive: { color: '#001026', fontWeight: '700' },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 40 },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  legibilityBadge: { backgroundColor: 'rgba(5,150,105,0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  legibilityText: { color: '#059669', fontSize: 11, fontWeight: '600' },
  resText: { fontSize: 11, color: '#74777f' },
  cropCanvas: {
    height: 380,
    backgroundColor: '#ecf4ff',
    borderRadius: 20,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  mockDoc: { width: '85%', height: '88%', backgroundColor: '#ffffff', borderRadius: 8, elevation: 4, padding: 20 },
  docWatermark: { fontSize: 10, color: 'rgba(0,0,0,0.15)', textAlign: 'center', marginTop: 40 },
  loupe: { position: 'absolute', top: 12, right: 12, width: 64, height: 64, borderRadius: 32, borderWidth: 2, borderColor: '#059669', backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center' },
  loupeText: { fontSize: 8, fontWeight: '800', color: '#059669' },
  lockBadge: { position: 'absolute', bottom: 12, backgroundColor: 'rgba(255,255,255,0.95)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, elevation: 2 },
  lockBadgeText: { fontSize: 11, fontWeight: '600', color: '#001026' },
  controlsGrid: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  controlTile: { flex: 1, backgroundColor: '#ffffff', padding: 10, borderRadius: 12, alignItems: 'center', elevation: 1 },
  controlTileActive: { backgroundColor: '#e2efff', borderWidth: 1, borderColor: '#395f95' },
  controlIcon: { fontSize: 16, marginBottom: 4 },
  controlLabel: { fontSize: 10, fontWeight: '600', color: '#001026' },
  profileCard: { backgroundColor: '#ffffff', borderRadius: 14, padding: 14, elevation: 1 },
  profileHeader: { fontSize: 11, fontWeight: '700', color: '#001026', marginBottom: 10 },
  profileRow: { flexDirection: 'row', gap: 8 },
  profileBtn: { flex: 1, padding: 10, borderRadius: 8, backgroundColor: '#ecf4ff', alignItems: 'center' },
  profileBtnActive: { backgroundColor: 'rgba(5,150,105,0.15)', borderWidth: 1, borderColor: '#059669' },
  profileBtnText: { fontSize: 11, fontWeight: '700', color: '#001026' },
  ocrBox: { backgroundColor: '#ffffff', borderRadius: 16, padding: 16, elevation: 1 },
  ocrInput: { fontSize: 12, color: '#001026', lineHeight: 20, fontFamily: 'monospace' },
});

