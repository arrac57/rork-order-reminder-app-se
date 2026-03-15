import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Search, Trash2, Package, ChevronRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useOrders } from '@/providers/OrderProvider';
import { Order } from '@/types/order';
import { formatDate } from '@/utils/recommendations';
import Colors from '@/constants/colors';

export default function HistoryScreen() {
  const router = useRouter();
  const { orders, deleteOrder, getCompanyName } = useOrders();
  const [search, setSearch] = useState<string>('');

  const filteredOrders = orders.filter((order) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const companyName = getCompanyName(order.companyId).toLowerCase();
    const hasArticle = order.items.some(
      (item) =>
        item.articleName.toLowerCase().includes(q) ||
        item.articleNumber.toLowerCase().includes(q)
    );
    return companyName.includes(q) || hasArticle;
  });

  const handleDelete = useCallback(
    (orderId: string) => {
      Alert.alert('Ta bort beställning', 'Är du säker på att du vill ta bort denna beställning?', [
        { text: 'Avbryt', style: 'cancel' },
        {
          text: 'Ta bort',
          style: 'destructive',
          onPress: () => {
            deleteOrder(orderId);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ]);
    },
    [deleteOrder]
  );

  const handleCompanyPress = useCallback(
    (companyId: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      router.push(`/company-profile?id=${companyId}` as never);
    },
    [router]
  );

  const renderOrder = useCallback(
    ({ item }: { item: Order }) => {
      const totalPrice = item.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
      return (
        <View style={styles.orderCard}>
          <View style={styles.orderHeader}>
            <TouchableOpacity
              style={styles.orderHeaderLeft}
              onPress={() => handleCompanyPress(item.companyId)}
              activeOpacity={0.7}
            >
              <View style={styles.companyRow}>
                <Text style={styles.orderCompany}>{getCompanyName(item.companyId)}</Text>
                <ChevronRight size={14} color={Colors.primary} />
              </View>
              <Text style={styles.orderDate}>{formatDate(item.date)}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(item.id)} hitSlop={12}>
              <Trash2 size={18} color={Colors.textTertiary} />
            </TouchableOpacity>
          </View>

          {item.items.map((orderItem) => (
            <View key={orderItem.id} style={styles.articleRow}>
              <Text style={styles.articleName}>
                {orderItem.quantity}x {orderItem.articleName}
              </Text>
              <View style={styles.articleMeta}>
                <Text style={styles.articleNumber}>#{orderItem.articleNumber}</Text>
                {orderItem.price > 0 && (
                  <Text style={styles.articlePrice}>{orderItem.price} kr</Text>
                )}
              </View>
            </View>
          ))}

          {totalPrice > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Totalt</Text>
              <Text style={styles.totalValue}>{totalPrice.toFixed(0)} kr</Text>
            </View>
          )}

          {item.deliveryDate && (
            <Text style={styles.deliveryDate}>Leverans: {formatDate(item.deliveryDate)}</Text>
          )}
          {item.notes && <Text style={styles.notes}>{item.notes}</Text>}
        </View>
      );
    },
    [getCompanyName, handleDelete, handleCompanyPress]
  );

  const keyExtractor = useCallback((item: Order) => item.id, []);

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Search size={18} color={Colors.textTertiary} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Sök företag eller artikel..."
          placeholderTextColor={Colors.textTertiary}
        />
      </View>

      <FlatList
        data={filteredOrders}
        renderItem={renderOrder}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Package size={40} color={Colors.textTertiary} />
            <Text style={styles.emptyTitle}>Inga beställningar</Text>
            <Text style={styles.emptyText}>
              {search ? 'Inga resultat hittades.' : 'Börja med att lägga till en beställning.'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    margin: 16,
    marginBottom: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.text,
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
    paddingBottom: 32,
  },
  orderCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderHeaderLeft: {
    flex: 1,
  },
  companyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  orderCompany: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  orderDate: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  articleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  articleName: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500' as const,
    flex: 1,
  },
  articleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  articleNumber: {
    fontSize: 12,
    color: Colors.textTertiary,
  },
  articlePrice: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '600' as const,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  totalValue: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  deliveryDate: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: 8,
  },
  notes: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: 4,
    fontStyle: 'italic',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  emptyText: {
    fontSize: 13,
    color: Colors.textTertiary,
    textAlign: 'center',
  },
});
