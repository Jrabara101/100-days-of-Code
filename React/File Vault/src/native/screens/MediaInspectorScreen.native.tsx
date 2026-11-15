import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Switch,
  TextInput,
} from 'react-native';

export default function MediaInspectorScreen() {
  const [activeTab, setActiveTab] = useState<'meta' | 'perms'>('perms');
  const [publicShare, setPublicShare] = useState(true);
  const [privilege, setPrivilege] = useState<'view' | 'download'>('view');
  const [passwordProtection, setPasswordProtection] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Vault</Text>
          <Text style={styles.headerSubtitle}>Inspector</Text>
        </View>

        <View style={styles.aesBadge}>
          <Text style={styles.aesText}>256-BIT AES</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Document Showcase Card */}
        <View style={styles.showcaseCard}>
          {/* Visual Blueprint Simulated Preview */}
          <View style={styles.previewBox}>
            <View style={styles.watermarkTag}>
              <Text style={styles.watermarkText}>✓ Immutable Copy</Text>
            </View>
            <View style={styles.cipherTag}>
              <Text style={styles.cipherText}>• AES-256-GCM</Text>
            </View>

            <View style={styles.previewActiveBar}>
              <Text style={styles.previewBarSub}>PREVIEW ACTIVE</Text>
              <Text style={styles.previewBarTitle}>Sheet 04 / 18 • Section A-A</Text>
            </View>
          </View>

          {/* File Meta Row */}
          <View style={styles.fileIdentity}>
            <View style={styles.fileIdentityLeft}>
              <Text style={styles.fileName}>Architecture_Blueprint_Rev4.pdf</Text>
              <View style={styles.tagsRow}>
                <Text style={styles.tagPill}>PDF Document</Text>
                <Text style={styles.metaDot}>•</Text>
                <Text style={styles.metaText}>24.6 MB</Text>
                <Text style={styles.metaDot}>•</Text>
                <Text style={styles.sealedText}>Sealed &amp; Signed</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.downloadIconBtn}>
              <Text style={styles.downloadIconText}>⬇</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tab Selector */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'meta' && styles.tabBtnActive]}
            onPress={() => setActiveTab('meta')}
          >
            <Text style={[styles.tabText, activeTab === 'meta' && styles.tabTextActive]}>
              Metadata &amp; Integrity
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'perms' && styles.tabBtnActive]}
            onPress={() => setActiveTab('perms')}
          >
            <Text style={[styles.tabText, activeTab === 'perms' && styles.tabTextActive]}>
              Share Permissions
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'meta' ? (
          /* Metadata & Integrity Tab */
          <View style={styles.metaBox}>
            <Text style={styles.metaSectionTitle}>CRYPTOGRAPHIC PROOF</Text>
            <Text style={styles.metaLabel}>SHA-256 CHECKSUM</Text>
            <Text style={styles.hashText}>
              9f83cf21e3f8902d3854162633a523a129d3b2830a9845d4522909e61fe0098a
            </Text>

            <Text style={styles.metaLabel}>INITIALIZATION NONCE</Text>
            <Text style={styles.hashText}>4A:8C:F9:01:22:EE:99:31:00:DF:14:B2</Text>

            <View style={styles.gridDetails}>
              <View style={styles.detailTile}>
                <Text style={styles.detailTitle}>Cipher</Text>
                <Text style={styles.detailValue}>AES-256-GCM</Text>
              </View>
              <View style={styles.detailTile}>
                <Text style={styles.detailTitle}>Key Derivation</Text>
                <Text style={styles.detailValue}>PBKDF2</Text>
              </View>
              <View style={styles.detailTile}>
                <Text style={styles.detailTitle}>EXIF GPS</Text>
                <Text style={styles.detailValue}>Scrubbed</Text>
              </View>
              <View style={styles.detailTile}>
                <Text style={styles.detailTitle}>Signer ID</Text>
                <Text style={styles.detailValue}>Key #V-8942</Text>
              </View>
            </View>
          </View>
        ) : (
          /* Share Permissions Tab */
          <View style={styles.permsCard}>
            {/* Toggle */}
            <View style={styles.switchRow}>
              <View>
                <Text style={styles.permTitle}>Public Share Link</Text>
                <Text style={styles.permSubtitle}>Instant zero-knowledge external access</Text>
              </View>
              <Switch
                value={publicShare}
                onValueChange={setPublicShare}
                trackColor={{ false: '#c4c6cf', true: '#395f95' }}
              />
            </View>

            {publicShare && (
              <View style={styles.linkRow}>
                <Text style={styles.linkUrl} numberOfLines={1}>
                  https://vault.stream/s/e89f2-blueprint-a4
                </Text>
                <TouchableOpacity style={styles.copyBtn}>
                  <Text style={styles.copyBtnText}>Copy</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Privilege Level */}
            <Text style={styles.guardHeader}>ACCESS PRIVILEGE LEVEL</Text>
            <View style={styles.privilegeRow}>
              <TouchableOpacity
                style={[styles.privilegeBtn, privilege === 'view' && styles.privilegeBtnActive]}
                onPress={() => setPrivilege('view')}
              >
                <Text style={styles.privilegeTitle}>👁 View Only</Text>
                <Text style={styles.privilegeSub}>(Watermark)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.privilegeBtn, privilege === 'download' && styles.privilegeBtnActive]}
                onPress={() => setPrivilege('download')}
              >
                <Text style={styles.privilegeTitle}>⬇ Allow Download</Text>
                <Text style={styles.privilegeSub}>(Full Decrypt)</Text>
              </TouchableOpacity>
            </View>

            {/* Guardrails */}
            <View style={styles.guardRailRow}>
              <Text style={styles.guardHeader}>SECURITY GUARDRAILS</Text>
              <Text style={styles.shieldPill}>ZERO LEAK SHIELD</Text>
            </View>

            <View style={styles.switchRow}>
              <Text style={styles.permTitle}>Password Protection</Text>
              <Switch
                value={passwordProtection}
                onValueChange={setPasswordProtection}
                trackColor={{ false: '#c4c6cf', true: '#395f95' }}
              />
            </View>
          </View>
        )}
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
  scrollContent: { padding: 16, paddingBottom: 60 },
  showcaseCard: { backgroundColor: '#ffffff', borderRadius: 16, overflow: 'hidden', elevation: 2, marginBottom: 14 },
  previewBox: { height: 180, backgroundColor: '#0b2545', justifyContent: 'space-between', padding: 12 },
  watermarkTag: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  watermarkText: { fontSize: 10, fontWeight: '700', color: '#001026' },
  cipherTag: { position: 'absolute', top: 12, right: 12, backgroundColor: '#002b1b', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  cipherText: { fontSize: 10, fontWeight: '700', color: '#85f8c4' },
  previewActiveBar: { backgroundColor: 'rgba(0,16,38,0.75)', padding: 8, borderRadius: 8 },
  previewBarSub: { fontSize: 9, color: '#a7c8ff', fontWeight: '700' },
  previewBarTitle: { fontSize: 12, color: '#ffffff', fontWeight: '600' },
  fileIdentity: { flexDirection: 'row', justifyContent: 'space-between', padding: 14, alignItems: 'center' },
  fileIdentityLeft: { flex: 1 },
  fileName: { fontSize: 14, fontWeight: '700', color: '#001026', marginBottom: 4 },
  tagsRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  tagPill: { fontSize: 10, color: '#44474e', backgroundColor: '#e2efff', paddingHorizontal: 6, borderRadius: 4 },
  metaDot: { color: '#c4c6cf' },
  metaText: { fontSize: 11, color: '#44474e' },
  sealedText: { fontSize: 11, color: '#059669', fontWeight: '600' },
  downloadIconBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#ecf4ff', alignItems: 'center', justifyContent: 'center' },
  downloadIconText: { fontSize: 16, color: '#395f95' },
  tabContainer: { flexDirection: 'row', backgroundColor: '#ecf4ff', borderRadius: 12, padding: 4, marginBottom: 14 },
  tabBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  tabBtnActive: { backgroundColor: '#ffffff', elevation: 1 },
  tabText: { fontSize: 12, color: '#74777f', fontWeight: '500' },
  tabTextActive: { color: '#001026', fontWeight: '700' },
  metaBox: { backgroundColor: '#ffffff', borderRadius: 16, padding: 14, elevation: 1 },
  metaSectionTitle: { fontSize: 11, fontWeight: '700', color: '#001026', marginBottom: 8 },
  metaLabel: { fontSize: 9, color: '#74777f', fontWeight: '600', marginTop: 8 },
  hashText: { fontSize: 10, fontFamily: 'monospace', backgroundColor: '#ecf4ff', padding: 6, borderRadius: 6, color: '#001026', marginTop: 2 },
  gridDetails: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  detailTile: { width: '48%', backgroundColor: '#ecf4ff', padding: 8, borderRadius: 8 },
  detailTitle: { fontSize: 9, color: '#74777f' },
  detailValue: { fontSize: 11, fontWeight: '700', color: '#001026', marginTop: 2 },
  permsCard: { backgroundColor: '#ffffff', borderRadius: 16, padding: 14, elevation: 1 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 8 },
  permTitle: { fontSize: 13, fontWeight: '700', color: '#001026' },
  permSubtitle: { fontSize: 11, color: '#74777f', marginTop: 1 },
  linkRow: { flexDirection: 'row', backgroundColor: '#ecf4ff', padding: 8, borderRadius: 10, alignItems: 'center', marginVertical: 8 },
  linkUrl: { flex: 1, fontSize: 11, color: '#001026', fontFamily: 'monospace' },
  copyBtn: { backgroundColor: '#395f95', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  copyBtnText: { color: '#ffffff', fontSize: 11, fontWeight: '600' },
  guardHeader: { fontSize: 10, fontWeight: '700', color: '#001026', marginTop: 12, marginBottom: 6 },
  privilegeRow: { flexDirection: 'row', gap: 8 },
  privilegeBtn: { flex: 1, backgroundColor: '#ecf4ff', padding: 10, borderRadius: 10, alignItems: 'center' },
  privilegeBtnActive: { borderWidth: 1, borderColor: '#395f95', backgroundColor: '#e2efff' },
  privilegeTitle: { fontSize: 12, fontWeight: '700', color: '#001026' },
  privilegeSub: { fontSize: 10, color: '#74777f' },
  guardRailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 },
  shieldPill: { fontSize: 9, fontWeight: '700', color: '#059669', backgroundColor: 'rgba(5,150,105,0.1)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
});

