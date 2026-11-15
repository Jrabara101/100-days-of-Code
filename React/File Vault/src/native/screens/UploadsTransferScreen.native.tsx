import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Switch,
} from 'react-native';

const TRANSFERS = [
  {
    id: '1',
    name: 'Keynote_Presentation_Q4_Final.mov',
    size: '210 MB',
    format: 'ProRes 422 QuickTime',
    progress: 0.68,
    speed: '4.8 MB/s',
    eta: '45s left',
  },
  {
    id: '2',
    name: 'Client_Contract_Signed_Final.pdf',
    size: '8.4 MB',
    format: 'Cryptographic Envelope',
    progress: 0.92,
    speed: '2.1 MB/s',
    eta: 'Hashing & verifying integrity...',
  },
];

export default function UploadsTransferScreen() {
  const [autoCompress, setAutoCompress] = useState(false);
  const [shaVerify, setShaVerify] = useState(true);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Vault</Text>
          <Text style={styles.headerSubtitle}>Uploads</Text>
        </View>
        <View style={styles.aesBadge}>
          <Text style={styles.aesText}>256-BIT AES</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Velocity & Queue Card */}
        <View style={styles.card}>
          <View style={styles.queueHeader}>
            <View>
              <Text style={styles.queueTitle}>• Active Queue: 3 files</Text>
              <Text style={styles.queueSub}>142.5 MB processing of 360.9 MB total</Text>
            </View>
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.pauseBtn}>
                <Text style={styles.pauseBtnText}>Pause</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Progress bar */}
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: '58%' }]} />
          </View>

          <View style={styles.pipeFooter}>
            <Text style={styles.speedText}>⚡ 8.4 MB/s • TLS 1.3 Secure Pipe</Text>
            <View style={styles.p2pBadge}>
              <Text style={styles.p2pText}>P2P STREAM</Text>
            </View>
          </View>
        </View>

        {/* Dropzone Card */}
        <View style={styles.dropzoneCard}>
          <Text style={styles.dropzoneIcon}>☁️</Text>
          <Text style={styles.dropzoneTitle}>Tap or drag files to upload</Text>
          <Text style={styles.dropzoneSub}>Supports RAW, 4K Video, Docs up to 25 GB each</Text>

          <TouchableOpacity style={styles.browseBtn}>
            <Text style={styles.browseBtnText}>📁 Browse Device / Camera</Text>
          </TouchableOpacity>
        </View>

        {/* Preferences */}
        <View style={styles.card}>
          <View style={styles.prefRow}>
            <View>
              <Text style={styles.prefTitle}>Auto-compress images</Text>
              <Text style={styles.prefSub}>Preserve lossless metadata when off</Text>
            </View>
            <Switch
              value={autoCompress}
              onValueChange={setAutoCompress}
              trackColor={{ false: '#c4c6cf', true: '#395f95' }}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.prefRow}>
            <View>
              <View style={styles.shaRow}>
                <Text style={styles.prefTitle}>SHA-256 Checksum</Text>
                <Text style={styles.verifiedTag}>Verified</Text>
              </View>
              <Text style={styles.prefSub}>Real-time bit-rot verification</Text>
            </View>
            <Switch
              value={shaVerify}
              onValueChange={setShaVerify}
              trackColor={{ false: '#c4c6cf', true: '#395f95' }}
            />
          </View>
        </View>

        {/* In Progress List */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>In Progress (2)</Text>
          <Text style={styles.streamingTag}>STREAMING</Text>
        </View>

        {TRANSFERS.map(t => (
          <View key={t.id} style={styles.transferCard}>
            <View style={styles.transferTop}>
              <View style={styles.transferInfo}>
                <Text style={styles.transferName} numberOfLines={1}>
                  {t.name}
                </Text>
                <Text style={styles.transferSub}>
                  {t.size} • {t.format}
                </Text>
              </View>
            </View>

            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${t.progress * 100}%` }]} />
            </View>

            <View style={styles.transferFooter}>
              <Text style={styles.etaText}>{t.eta}</Text>
              <Text style={styles.speedLabel}>↑ {t.speed}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f9ff' },
  header: { height: 56, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.06)' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#001026' },
  headerSubtitle: { fontSize: 13, color: '#74777f' },
  aesBadge: { backgroundColor: 'rgba(5,150,105,0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  aesText: { fontSize: 10, fontWeight: '700', color: '#059669' },
  scrollContent: { padding: 16, paddingBottom: 60, gap: 14 },
  card: { backgroundColor: '#ffffff', borderRadius: 16, padding: 16, elevation: 1 },
  queueHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  queueTitle: { fontSize: 13, fontWeight: '700', color: '#001026' },
  queueSub: { fontSize: 10, color: '#74777f', marginTop: 2 },
  actionRow: { flexDirection: 'row', gap: 6 },
  pauseBtn: { backgroundColor: '#ecf4ff', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  pauseBtnText: { fontSize: 11, fontWeight: '600', color: '#395f95' },
  cancelBtn: { backgroundColor: '#ffdad6', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  cancelBtnText: { fontSize: 11, fontWeight: '600', color: '#ba1a1a' },
  progressTrack: { height: 6, backgroundColor: '#e2efff', borderRadius: 3, marginVertical: 10, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#395f95', borderRadius: 3 },
  pipeFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  speedText: { fontSize: 11, color: '#001026', fontFamily: 'monospace' },
  p2pBadge: { backgroundColor: '#ecf4ff', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  p2pText: { fontSize: 9, fontWeight: '800', color: '#395f95' },
  dropzoneCard: { backgroundColor: '#ffffff', borderRadius: 16, padding: 20, alignItems: 'center', borderStyle: 'dashed', borderWidth: 2, borderColor: '#c4c6cf' },
  dropzoneIcon: { fontSize: 32, marginBottom: 6 },
  dropzoneTitle: { fontSize: 14, fontWeight: '700', color: '#001026' },
  dropzoneSub: { fontSize: 11, color: '#74777f', marginTop: 2, textAlign: 'center' },
  browseBtn: { backgroundColor: '#001026', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, marginTop: 12 },
  browseBtnText: { color: '#ffffff', fontSize: 12, fontWeight: '700' },
  prefRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 4 },
  prefTitle: { fontSize: 12, fontWeight: '700', color: '#001026' },
  prefSub: { fontSize: 10, color: '#74777f' },
  shaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  verifiedTag: { fontSize: 9, fontWeight: '700', color: '#059669', backgroundColor: 'rgba(5,150,105,0.1)', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 },
  divider: { height: 1, backgroundColor: '#ecf4ff', marginVertical: 8 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#001026' },
  streamingTag: { fontSize: 9, fontWeight: '800', color: '#395f95' },
  transferCard: { backgroundColor: '#ffffff', borderRadius: 14, padding: 14, elevation: 1 },
  transferTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  transferInfo: { flex: 1 },
  transferName: { fontSize: 13, fontWeight: '700', color: '#001026' },
  transferSub: { fontSize: 10, color: '#74777f', marginTop: 2 },
  transferFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  etaText: { fontSize: 10, color: '#74777f' },
  speedLabel: { fontSize: 10, fontWeight: '700', color: '#395f95' },
});

