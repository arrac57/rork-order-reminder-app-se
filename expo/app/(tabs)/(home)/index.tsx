import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { PlusCircle, TrendingUp, Package, AlertTriangle, ChevronRight, WifiOff } from 'lucide-react-native';
import { useOrders } from '@/providers/OrderProvider';
import Colors from '@/constants/colors';
import { formatDate } from '@/utils/recommendations';

export default function HomeScreen() {
  const router = useRouter();
  const { orders, recommendations, isLoading, isError, getCompanyName } = useOrders();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Laddar data...</Text>
      </View>
    );
  }

  const recentOrders = orders.slice(0, 3);
  const totalOrders = orders.length;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {isError ? (
        <View style={styles.errorBanner}>
          <WifiOff size={16} color={Colors.warning} />
          <Text style={styles.errorBannerText}>Kunde inte ansluta till servern. Visar cachad data.</Text>
        </View>
      ) : null}

      <View style={styles.statsRow}>
        <View style={[styles.statCard, styles.statCardPrimary]}>
          <Package size={20} color={Colors.white} />
          <Text style={styles.statNumber}>{totalOrders}</Text>
          <Text style={styles.statLabel}>Totalt ordrar</Text>
        </View>
        <View style={[styles.statCard, styles.statCardAccent]}>
          <TrendingUp size={20} color={Colors.white} />
          <Text style={styles.statNumber}>{recommendations.length}</Text>
          <Text style={styles.statLabel}>Rekommendationer</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.newOrderButton}
        onPress={() => router.push('/new-order' as never)}
        activeOpacity={0.8}
        testID="new-order-btn"
      >
        <PlusCircle size={22} color={Colors.white} />
        <Text style={styles.newOrderButtonText}>Lägg till ny beställning</Text>
      </TouchableOpacity>

      {recommendations.length > 0 ? (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Beställ snart</Text>
            <AlertTriangle size={16} color={Colors.accent} />
          </View>
          {recommendations.map((rec, index) => (
            <View key={`${rec.articleNumber}-${rec.companyId}-${index}`} style={styles.recCard}>
              <View style={[styles.urgencyDot, { backgroundColor: Colors[`urgency${rec.urgency.charAt(0).toUpperCase() + rec.urgency.slice(1)}` as keyof typeof Colors] as string }]} />
              <View style={styles.recContent}>
                <Text style={styles.recArticle}>{rec.quantity}x {rec.articleName}</Text>
                <Text style={styles.recMeta}>Art.nr: {rec.articleNumber} · {rec.companyName}</Text>
                <Text style={styles.recInterval}>
                  {rec.daysSinceLastOrder} dagar sedan senast (snitt: var {rec.avgIntervalDays}:e dag)
                </Text>
              </View>
            </View>
          ))}
        </View>
      ) : null}

      {recommendations.length === 0 && totalOrders < 2 ? (
        <View style={styles.emptyRec}>
          <TrendingUp size={32} color={Colors.textTertiary} />
          <Text style={styles.emptyRecTitle}>Inga rekommendationer ännu</Text>
          <Text style={styles.emptyRecText}>
            Logga minst 2 beställningar av samma artikel för att få smarta rekommendationer.
          </Text>
        </View>
      ) : null}

      {recentOrders.length > 0 ? (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Senaste beställningar</Text>
            <TouchableOpacity onPress={() => router.push('/history' as never)} hitSlop={8}>
              <View style={styles.seeAllRow}>
                <Text style={styles.seeAll}>Visa alla</Text>
                <ChevronRight size={14} color={Colors.primary} />
              </View>
            </TouchableOpacity>
          </View>
          {recentOrders.map((order) => (
            <View key={order.id} style={styles.orderCard}>
              <View style={styles.orderCardHeader}>
                <Text style={styles.orderCompany}>{getCompanyName(order.companyId)}</Text>
                <Text style={styles.orderDate}>{formatDate(order.date)}</Text>
              </View>
              <Text style={styles.orderItems}>
                {order.items.map((item) => `${item.quantity}x ${item.articleName || item.articleNumber}`).join(', ')}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.warningLight,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorBannerText: {
    fontSize: 13,
    color: Colors.warning,
    fontWeight: '500' as const,
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    borderRadius: 14,
    padding: 16,
    alignItems: 'flex-start',
    gap: 6,
  },
  statCardPrimary: {
    backgroundColor: Colors.primary,
  },
  statCardAccent: {
    backgroundColor: Colors.accent,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: Colors.white,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: 'rgba(255,255,255,0.85)',
  },
  newOrderButton: {
    backgroundColor: Colors.primaryDark,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 10,
    marginBottom: 24,
  },
  newOrderButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700' as const,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  seeAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeAll: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '600' as const,
  },
  recCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  urgencyDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 5,
  },
  recContent: {
    flex: 1,
  },
  recArticle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  recMeta: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  recInterval: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: 4,
  },
  emptyRec: {
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: 14,
    padding: 28,
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  emptyRecTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  emptyRecText: {
    fontSize: 13,
    color: Colors.textTertiary,
    textAlign: 'center',
    lineHeight: 18,
  },
  orderCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  orderCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  orderCompany: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  orderDate: {
    fontSize: 12,
    color: Colors.textTertiary,
  },
  orderItems: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
});
