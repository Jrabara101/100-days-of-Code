import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  FlatList,
  SafeAreaView,
  StatusBar,
} from 'react-native';

const THEME = {
  primary: '#001026',
  primaryContainer: '#0b2545',
  secondary: '#395f95',
  surface: '#f7f9ff',
  card: '#ffffff',
  outline: '#74777f',
  emerald: '#059669',
  emeraldLight: 'rgba(5, 150, 105, 0.1)',
};

const SAMPLE_FILES = [
  { id: '1', name: 'Brand_Guidelines_v2.4.pdf', size: '18.4 MB', time: '2h ago', status: 'SHA-256' },
  { id: '2', name: 'Q3_Financial_Forecast.xlsx', size: '4.2 MB', time: 'Yesterday', status: 'Passcode' },
  { id: '3', name: 'Product_Hero_4K_Shot.raw', size: '84.1 MB', time: '3 days ago', status: 'RAW' },
  { id: '4', name: 'Security_Protocol_2026.docx', size: '1.1 MB', time: 'May 12', status: 'AES-GCM' },
  { id: '5', name: 'Quarterly_Audit_Report.csv', size: '2.3 MB', time: 'May 10', status: 'CSV' },
];

export default function CloudVaultScreen({ navigation }: any) {
  const [activeCategory, setActiveCategory] = useState('All Files');
  const categories = ['All Files', 'Recent', 'Images', 'Documents', 'Videos', 'Encrypted Vault'];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f7f9ff" />

      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Vault</Text>
          <Text style={styles.headerSubtitle}>Files</Text>
        </View>

        <View style={styles.aesBadge}>
          <View style={styles.aesPulse} />
          <Text style={styles.aesText}>256-BIT AES</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Storage Quota Glance Banner */}
        <View style={styles.quotaCard}>
          <View style={styles.quotaHeader}>
            <View>
              <View style={styles.enclaveBadge}>
                <Text style={styles.enclaveBadgeText}>✓ Zero-Knowledge Encrypted</Text>
              </View>
              <Text style={styles.quotaTitle}>34.8 GB of 100 GB used</Text>
            </View>
            <TouchableOpacity style={styles.upgradeBtn}>
              <Text style={styles.upgradeText}>Upgrade →</Text>
            </TouchableOpacity>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: '35%' }]} />
          </View>
          <View style={styles.quotaFooter}>
            <Text style={styles.metaText}>35% allocated</Text>
            <Text style={styles.metaText}>65.2 GB available</Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <TextInput
            placeholder="Search encrypted files, tags..."
            placeholderTextColor="#74777f"
            style={styles.searchInput}
          />
        </View>

        {/* Categories Carousel */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesRow}>
          {categories.map(cat => (
            <TouchableOpacity
              key={cat}
              onPress={() => setActiveCategory(cat)}
              style={[
                styles.categoryPill,
                activeCategory === cat && styles.categoryPillActive,
              ]}
            >
              <Text
                style={[
                  styles.categoryText,
                  activeCategory === cat && styles.categoryTextActive,
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Pinned & Recent Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Pinned &amp; Recent</Text>
          <Text style={styles.metaText}>2 items</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pinnedRow}>
          <TouchableOpacity
            style={styles.pinnedCard}
            onPress={() => navigation?.navigate('Inspector')}
          >
            <View style={styles.pinnedTop}>
              <Text style={styles.pinnedTag}>Synced</Text>
            </View>
            <Text style={styles.pinnedTitle} numberOfLines={1}>
              Cinematic_Trailer_Edit.mov
            </Text>
            <Text style={styles.metaText}>340.5 MB • ProRes 422</Text>
            <Text style={styles.timeText}>Modified 25m ago</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.pinnedCard}
            onPress={() => navigation?.navigate('Inspector')}
          >
            <View style={styles.pinnedTop}>
              <Text style={styles.pinnedTag}>Key</Text>
            </View>
            <Text style={styles.pinnedTitle} numberOfLines={1}>
              Client_Access_Key.pem
            </Text>
            <Text style={styles.metaText}>14 KB • Cryptographic</Text>
            <Text style={styles.timeText}>Modified 1h ago</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* All Media & Files List */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>All Media &amp; Files</Text>
          <Text style={styles.metaText}>Sort: Date Modified</Text>
        </View>

        {SAMPLE_FILES.map(item => (
          <TouchableOpacity
            key={item.id}
            style={styles.fileRow}
            onPress={() => navigation?.navigate('Inspector')}
          >
            <View style={styles.fileIconBox}>
              <Text style={styles.fileIconText}>📄</Text>
            </View>
            <View style={styles.fileInfo}>
              <Text style={styles.fileName} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={styles.metaText}>
                {item.size} • {item.time} • {item.status}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Floating Action Button (FAB) */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation?.navigate('DocumentScanner')}
      >
        <Text style={styles.fabText}>+ New Upload</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.surface },
  header: {
    height: 56,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: THEME.primary },
  headerSubtitle: { fontSize: 13, color: THEME.outline },
  aesBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.emeraldLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    gap: 6,
  },
  aesPulse: { width: 6, height: 6, borderRadius: 3, backgroundColor: THEME.emerald },
  aesText: { fontSize: 10, fontWeight: '700', color: THEME.emerald },
  scrollContent: { padding: 16, paddingBottom: 90 },
  quotaCard: {
    backgroundColor: THEME.card,
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  quotaHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  enclaveBadge: {
    backgroundColor: '#e2efff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  enclaveBadgeText: { fontSize: 10, color: THEME.secondary, fontWeight: '600' },
  quotaTitle: { fontSize: 16, fontWeight: '700', color: THEME.primary },
  upgradeBtn: { backgroundColor: '#e2efff', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  upgradeText: { fontSize: 12, fontWeight: '600', color: THEME.secondary },
  progressTrack: { height: 8, backgroundColor: '#e2efff', borderRadius: 4, marginTop: 12, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: THEME.secondary, borderRadius: 4 },
  quotaFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  metaText: { fontSize: 11, color: THEME.outline },
  timeText: { fontSize: 10, color: THEME.outline, marginTop: 4 },
  searchBar: {
    backgroundColor: THEME.card,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    justifyContent: 'center',
    marginTop: 14,
    elevation: 1,
  },
  searchInput: { fontSize: 13, color: THEME.primary },
  categoriesRow: { flexDirection: 'row', marginVertical: 14 },
  categoryPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: THEME.card,
    borderRadius: 999,
    marginRight: 8,
  },
  categoryPillActive: { backgroundColor: THEME.primaryContainer },
  categoryText: { fontSize: 12, color: THEME.outline, fontWeight: '500' },
  categoryTextActive: { color: '#ffffff', fontWeight: '600' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 10 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: THEME.primary },
  pinnedRow: { flexDirection: 'row', marginBottom: 16 },
  pinnedCard: {
    width: 200,
    backgroundColor: THEME.card,
    borderRadius: 14,
    padding: 12,
    marginRight: 10,
    elevation: 1,
  },
  pinnedTop: { alignSelf: 'flex-start', backgroundColor: '#e2efff', paddingHorizontal: 6, borderRadius: 4, marginBottom: 6 },
  pinnedTag: { fontSize: 10, color: THEME.secondary, fontWeight: '600' },
  pinnedTitle: { fontSize: 13, fontWeight: '700', color: THEME.primary, marginBottom: 2 },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.card,
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    elevation: 1,
  },
  fileIconBox: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#e2efff', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  fileIconText: { fontSize: 18 },
  fileInfo: { flex: 1 },
  fileName: { fontSize: 13, fontWeight: '600', color: THEME.primary, marginBottom: 2 },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 16,
    backgroundColor: THEME.primaryContainer,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 999,
    elevation: 6,
  },
  fabText: { color: '#ffffff', fontSize: 13, fontWeight: '700' },
});

