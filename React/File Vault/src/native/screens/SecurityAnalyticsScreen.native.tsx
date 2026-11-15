import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';

export default function SecurityAnalyticsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Vault</Text>
          <Text style={styles.headerSubtitle}>Security</Text>
        </View>
        <View style={styles.aesBadge}>
          <Text style={styles.aesText}>256-BIT AES</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Top Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View style={styles.shieldIconBox}>
              <Text style={styles.shieldIconText}>🛡</Text>
            </View>
            <View style={styles.heroTitles}>
              <Text style={styles.enclaveSubtitle}>ACTIVE PROTECTION • HSM Enclave</Text>
              <Text style={styles.heroTitle}>Vault Status: Fully Secured</Text>
            </View>
          </View>

          <View style={styles.telemetryBar}>
            <Text style={styles.telemetryText}>✓ Zero vulnerabilities detected • Grade A+</Text>
          </View>
        </View>

        {/* Storage Allocation Breakdown */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Storage Allocation</Text>
            <Text style={styles.cardSub}>34.8 GB / 100 GB</Text>
          </View>

          {/* Segmented bar */}
          <View style={styles.segmentedBar}>
            <View style={[styles.segment, { width: '42%', backgroundColor: '#395f95' }]} />
            <View style={[styles.segment, { width: '28%', backgroundColor: '#0b2545' }]} />
            <View style={[styles.segment, { width: '18%', backgroundColor: '#274f84' }]} />
            <View style={[styles.segment, { width: '12%', backgroundColor: '#778db2' }]} />
          </View>

          <View style={styles.barFooter}>
            <Text style={styles.metaText}>35% Consumed</Text>
            <Text style={styles.metaGreen}>65.2 GB Available</Text>
          </View>

          {/* Categories Grid */}
          <View style={styles.gridRow}>
            <View style={styles.catBox}>
              <Text style={styles.catTitle}>• Images</Text>
              <Text style={styles.catGB}>14.6 GB</Text>
              <Text style={styles.catCount}>1,420 files</Text>
            </View>

            <View style={styles.catBox}>
              <Text style={styles.catTitle}>• Documents</Text>
              <Text style={styles.catGB}>9.7 GB</Text>
              <Text style={styles.catCount}>340 files</Text>
            </View>
          </View>

          <View style={styles.gridRow}>
            <View style={styles.catBox}>
              <Text style={styles.catTitle}>• Videos</Text>
              <Text style={styles.catGB}>6.3 GB</Text>
              <Text style={styles.catCount}>48 clips</Text>
            </View>

            <View style={styles.catBox}>
              <Text style={styles.catTitle}>• Archives</Text>
              <Text style={styles.catGB}>4.2 GB</Text>
              <Text style={styles.catCount}>112 parcels</Text>
            </View>
          </View>

          {/* Pruning Banner */}
          <View style={styles.pruneBanner}>
            <View style={{ flex: 1 }}>
              <Text style={styles.pruneTitle}>Vault Pruning Suggested</Text>
              <Text style={styles.pruneSub}>1.8 GB duplicate &amp; temp chunks can be cleaned</Text>
            </View>
            <TouchableOpacity style={styles.cleanBtn}>
              <Text style={styles.cleanBtnText}>Clean Vault</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Cryptographic Envelope */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Cryptographic Envelope</Text>
            <Text style={styles.protectedPill}>Protected</Text>
          </View>

          <View style={styles.keyBox}>
            <Text style={styles.keyLabel}>END-TO-END ENCRYPTION KEY</Text>
            <Text style={styles.keyName}>Master Key #V-8942</Text>
            <Text style={styles.keyEnclave}>Stored in Hardware Enclave</Text>
          </View>
        </View>
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
  heroCard: { backgroundColor: '#ffffff', borderRadius: 16, padding: 16, elevation: 1 },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  shieldIconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#002b1b', alignItems: 'center', justifyContent: 'center' },
  shieldIconText: { fontSize: 22 },
  heroTitles: { flex: 1 },
  enclaveSubtitle: { fontSize: 10, fontWeight: '700', color: '#059669' },
  heroTitle: { fontSize: 15, fontWeight: '700', color: '#001026', marginTop: 2 },
  telemetryBar: { backgroundColor: '#ecf4ff', padding: 10, borderRadius: 10, marginTop: 12 },
  telemetryText: { fontSize: 11, color: '#001026', fontWeight: '600' },
  card: { backgroundColor: '#ffffff', borderRadius: 16, padding: 16, elevation: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#001026' },
  cardSub: { fontSize: 11, color: '#74777f', fontWeight: '600' },
  protectedPill: { fontSize: 10, fontWeight: '700', color: '#059669', backgroundColor: 'rgba(5,150,105,0.1)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  segmentedBar: { height: 10, backgroundColor: '#e2efff', borderRadius: 5, flexDirection: 'row', overflow: 'hidden', marginVertical: 6 },
  segment: { height: '100%' },
  barFooter: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  metaText: { fontSize: 11, color: '#74777f' },
  metaGreen: { fontSize: 11, color: '#059669', fontWeight: '600' },
  gridRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  catBox: { flex: 1, backgroundColor: '#ecf4ff', padding: 10, borderRadius: 10 },
  catTitle: { fontSize: 11, fontWeight: '700', color: '#001026' },
  catGB: { fontSize: 13, fontWeight: '700', color: '#001026', marginTop: 4 },
  catCount: { fontSize: 10, color: '#74777f' },
  pruneBanner: { backgroundColor: '#e2efff', padding: 12, borderRadius: 12, flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  pruneTitle: { fontSize: 12, fontWeight: '700', color: '#001026' },
  pruneSub: { fontSize: 10, color: '#74777f', marginTop: 2 },
  cleanBtn: { backgroundColor: '#001026', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  cleanBtnText: { color: '#ffffff', fontSize: 11, fontWeight: '700' },
  keyBox: { backgroundColor: '#ecf4ff', padding: 12, borderRadius: 12 },
  keyLabel: { fontSize: 9, color: '#74777f', fontWeight: '700' },
  keyName: { fontSize: 14, fontWeight: '700', color: '#001026', marginTop: 2 },
  keyEnclave: { fontSize: 10, color: '#74777f', marginTop: 2 },
});

