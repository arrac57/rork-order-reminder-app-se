import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Stack } from 'expo-router';
import { TrendingUp, TrendingDown, Package, Calendar, DollarSign, BarChart3, Minus } from 'lucide-react-native';
import { useOrders } from '@/providers/OrderProvider';
import { formatDate } from '@/utils/recommendations';
import Colors from '@/constants/colors';

export default function CompanyProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getCompanyAnalytics, getCompanyName } = useOrders();

  const analytics = useMemo(() => {
    if (!id) return null;
    return getCompanyAnalytics(id);
  }, [id, getCompanyAnalytics]);

  const companyName = id ? getCompanyName(id) : 'Okänt';

  const spendTrend = useMemo(() => {
    if (!analytics || analytics.monthlyData.length < 2) return null;
    const data = analytics.monthlyData;
    const recent = data.slice(-3);
    const older = data.slice(-6, -3);
    if (older.length === 0) return null;
    const recentAvg = recent.reduce((s, m) => s + m.totalSpent, 0) / recent.length;
    const olderAvg = older.reduce((s, m) => s + m.totalSpent, 0) / older.length;
    if (olderAvg === 0) return null;
    const pctChange = ((recentAvg - olderAvg) / olderAvg) * 100;
    return { pctChange, direction: pctChange > 5 ? 'up' : pctChange < -5 ? 'down' : 'stable' as const };
  }, [analytics]);

  const itemTrend = useMemo(() => {
    if (!analytics || analytics.monthlyData.length < 2) return null;
    const data = analytics.monthlyData;
    const recent = data.slice(-3);
    const older = data.slice(-6, -3);
    if (older.length === 0) return null;
    const recentAvg = recent.reduce((s, m) => s + m.itemCount, 0) / recent.length;
    const olderAvg = older.reduce((s, m) => s + m.itemCount, 0) / older.length;
    if (olderAvg === 0) return null;
    const pctChange = ((recentAvg - olderAvg) / olderAvg) * 100;
    return { pctChange, direction: pctChange > 5 ? 'up' : pctChange < -5 ? 'down' : 'stable' as const };
  }, [analytics]);

  if (!id) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Inget företag valt</Text>
      </View>
    );
  }

  if (!analytics) {
    return (
      <>
        <Stack.Screen options={{ title: companyName }} />
        <View style={styles.centered}>
          <Package size={40} color={Colors.textTertiary} />
          <Text style={styles.emptyTitle}>Ingen data</Text>
          <Text style={styles.emptyText}>
            Inga beställningar har registrerats för detta företag ännu.
          </Text>
        </View>
      </>
    );
  }

  const maxMonthlySpend = Math.max(...analytics.monthlyData.map((m) => m.totalSpent), 1);

  return (
    <>
      <Stack.Screen options={{ title: companyName }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Package size={18} color={Colors.primary} />
            <Text style={styles.statValue}>{analytics.totalOrders}</Text>
            <Text style={styles.statLabel}>Ordrar</Text>
          </View>
          <View style={styles.statCard}>
            <BarChart3 size={18} color={Colors.accent} />
            <Text style={styles.statValue}>{analytics.totalItems}</Text>
            <Text style={styles.statLabel}>Artiklar totalt</Text>
          </View>
          <View style={styles.statCard}>
            <DollarSign size={18} color={Colors.success} />
            <Text style={styles.statValue}>{analytics.totalSpent.toFixed(0)} kr</Text>
            <Text style={styles.statLabel}>Total kostnad</Text>
          </View>
          <View style={styles.statCard}>
            <Calendar size={18} color={Colors.textSecondary} />
            <Text style={styles.statValue}>{formatDate(analytics.lastOrderDate)}</Text>
            <Text style={styles.statLabel}>Senaste order</Text>
          </View>
        </View>

        {(spendTrend || itemTrend) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Trender</Text>
            {spendTrend && (
              <View style={styles.trendRow}>
                {spendTrend.direction === 'up' ? (
                  <TrendingUp size={18} color={Colors.error} />
                ) : spendTrend.direction === 'down' ? (
                  <TrendingDown size={18} color={Colors.success} />
                ) : (
                  <Minus size={18} color={Colors.textTertiary} />
                )}
                <View style={styles.trendInfo}>
                  <Text style={styles.trendLabel}>Kostnad</Text>
                  <Text style={[
                    styles.trendValue,
                    { color: spendTrend.direction === 'up' ? Colors.error : spendTrend.direction === 'down' ? Colors.success : Colors.textSecondary },
                  ]}>
                    {spendTrend.direction === 'up' ? '+' : ''}{spendTrend.pctChange.toFixed(0)}% senaste 3 månaderna
                  </Text>
                </View>
              </View>
            )}
            {itemTrend && (
              <View style={styles.trendRow}>
                {itemTrend.direction === 'up' ? (
                  <TrendingUp size={18} color={Colors.accent} />
                ) : itemTrend.direction === 'down' ? (
                  <TrendingDown size={18} color={Colors.primary} />
                ) : (
                  <Minus size={18} color={Colors.textTertiary} />
                )}
                <View style={styles.trendInfo}>
                  <Text style={styles.trendLabel}>Antal artiklar</Text>
                  <Text style={[
                    styles.trendValue,
                    { color: itemTrend.direction === 'up' ? Colors.accent : itemTrend.direction === 'down' ? Colors.primary : Colors.textSecondary },
                  ]}>
                    {itemTrend.direction === 'up' ? '+' : ''}{itemTrend.pctChange.toFixed(0)}% senaste 3 månaderna
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}

        {analytics.monthlyData.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Månadsöversikt</Text>
            {analytics.monthlyData.slice(-12).map((month) => {
              const barWidth = Math.max((month.totalSpent / maxMonthlySpend) * 100, 2);
              return (
                <View key={month.month} style={styles.monthRow}>
                  <Text style={styles.monthLabel}>{month.month}</Text>
                  <View style={styles.monthBarContainer}>
                    <View style={[styles.monthBar, { width: `${barWidth}%` }]} />
                  </View>
                  <View style={styles.monthStats}>
                    <Text style={styles.monthOrders}>{month.orderCount} ordrar</Text>
                    <Text style={styles.monthSpend}>{month.totalSpent.toFixed(0)} kr</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {analytics.topArticles.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Artikelanalys</Text>
            {analytics.topArticles.map((article) => {
              const priceChanged =
                article.priceHistory.length >= 2 &&
                article.priceHistory[0].price !== article.priceHistory[article.priceHistory.length - 1].price;
              const firstPrice = article.priceHistory.length > 0 ? article.priceHistory[0].price : 0;
              const lastPrice = article.priceHistory.length > 0 ? article.priceHistory[article.priceHistory.length - 1].price : 0;
              const priceDiff = lastPrice - firstPrice;

              return (
                <View key={article.articleNumber} style={styles.articleCard}>
                  <View style={styles.articleHeader}>
                    <View style={styles.articleHeaderLeft}>
                      <Text style={styles.articleName}>{article.articleName}</Text>
                      <Text style={styles.articleNumber}>#{article.articleNumber}</Text>
                    </View>
                    <View style={styles.articleBadge}>
                      <Text style={styles.articleBadgeText}>{article.orderCount}x</Text>
                    </View>
                  </View>
                  <View style={styles.articleStats}>
                    <View style={styles.articleStatItem}>
                      <Text style={styles.articleStatLabel}>Totalt antal</Text>
                      <Text style={styles.articleStatValue}>{article.totalQuantity} st</Text>
                    </View>
                    <View style={styles.articleStatItem}>
                      <Text style={styles.articleStatLabel}>Snittpris</Text>
                      <Text style={styles.articleStatValue}>{article.avgPrice.toFixed(0)} kr</Text>
                    </View>
                    <View style={styles.articleStatItem}>
                      <Text style={styles.articleStatLabel}>Total kostnad</Text>
                      <Text style={styles.articleStatValue}>{article.totalSpent.toFixed(0)} kr</Text>
                    </View>
                  </View>
                  {priceChanged && (
                    <View style={styles.priceChangeRow}>
                      {priceDiff > 0 ? (
                        <TrendingUp size={14} color={Colors.error} />
                      ) : (
                        <TrendingDown size={14} color={Colors.success} />
                      )}
                      <Text
                        style={[
                          styles.priceChangeText,
                          { color: priceDiff > 0 ? Colors.error : Colors.success },
                        ]}
                      >
                        Pris ändrat: {firstPrice} kr → {lastPrice} kr ({priceDiff > 0 ? '+' : ''}{priceDiff.toFixed(0)} kr)
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        <View style={styles.periodRow}>
          <Text style={styles.periodText}>
            Period: {formatDate(analytics.firstOrderDate)} — {formatDate(analytics.lastOrderDate)}
          </Text>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: 32,
    gap: 10,
  },
  errorText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.textSecondary,
  },
  emptyText: {
    fontSize: 13,
    color: Colors.textTertiary,
    textAlign: 'center',
    lineHeight: 18,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    minWidth: '45%' as unknown as number,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: 6,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: Colors.text,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500' as const,
    color: Colors.textTertiary,
  },
  section: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 14,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  trendInfo: {
    flex: 1,
  },
  trendLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  trendValue: {
    fontSize: 13,
    fontWeight: '500' as const,
    marginTop: 2,
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  monthLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600' as const,
    width: 60,
  },
  monthBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: 4,
    overflow: 'hidden',
  },
  monthBar: {
    height: 8,
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  monthStats: {
    alignItems: 'flex-end',
    minWidth: 80,
  },
  monthOrders: {
    fontSize: 11,
    color: Colors.textTertiary,
  },
  monthSpend: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  articleCard: {
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },
  articleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  articleHeaderLeft: {
    flex: 1,
  },
  articleName: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  articleNumber: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  articleBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  articleBadgeText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  articleStats: {
    flexDirection: 'row',
    gap: 12,
  },
  articleStatItem: {
    flex: 1,
  },
  articleStatLabel: {
    fontSize: 11,
    color: Colors.textTertiary,
    marginBottom: 2,
  },
  articleStatValue: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  priceChangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  priceChangeText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  periodRow: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  periodText: {
    fontSize: 12,
    color: Colors.textTertiary,
  },
});
