import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Plus, Minus, Trash2, CalendarDays, Check, Search, Zap, ShoppingCart, X, Package } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useOrders } from '@/providers/OrderProvider';
import { OrderItem } from '@/types/order';
import { nkvProducts } from '@/mocks/nkv-products';
import { getTodayString } from '@/utils/recommendations';
import CalendarPicker from '@/components/CalendarPicker';
import Colors from '@/constants/colors';

interface CartItem {
  id: string;
  articleName: string;
  articleNumber: string;
  quantity: number;
  price: number;
}

export default function NewOrderScreen() {
  const router = useRouter();
  const { companies, addOrder, getArticlesForCompany } = useOrders();

  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [companySearch, setCompanySearch] = useState<string>('');
  const [companyDropdownVisible, setCompanyDropdownVisible] = useState<boolean>(false);
  const [date, setDate] = useState<string>(getTodayString());
  const [showCalendar, setShowCalendar] = useState<boolean>(false);
  const [showDeliveryCalendar, setShowDeliveryCalendar] = useState<boolean>(false);
  const [deliveryDate, setDeliveryDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const [cart, setCart] = useState<CartItem[]>([]);

  const [articleSearch, setArticleSearch] = useState<string>('');
  const [showArticleSuggestions, setShowArticleSuggestions] = useState<boolean>(false);

  const sortedCompanies = useMemo(
    () => [...companies].sort((a, b) => a.name.localeCompare(b.name, 'sv')),
    [companies]
  );

  const filteredCompanies = useMemo(() => {
    if (!companySearch.trim()) return sortedCompanies;
    const q = companySearch.toLowerCase();
    return sortedCompanies.filter((c) => c.name.toLowerCase().startsWith(q));
  }, [sortedCompanies, companySearch]);

  const showCompanySuggestions = companyDropdownVisible && !selectedCompanyId && filteredCompanies.length > 0;

  const companyArticles = useMemo(() => {
    if (!selectedCompanyId) return [];
    return getArticlesForCompany(selectedCompanyId);
  }, [selectedCompanyId, getArticlesForCompany]);

  const articleSuggestions = useMemo(() => {
    const q = articleSearch.toLowerCase().trim();
    const results: { name: string; articleNumber: string; price: number; source: 'company' | 'nkv' }[] = [];

    if (selectedCompanyId && companyArticles.length > 0) {
      const companyMatches = companyArticles.filter((a) => {
        if (!q) return true;
        return a.articleName.toLowerCase().startsWith(q) || a.articleNumber.toLowerCase().startsWith(q);
      });
      for (const a of companyMatches.slice(0, 5)) {
        results.push({ name: a.articleName, articleNumber: a.articleNumber, price: a.lastPrice, source: 'company' });
      }
    }

    const nkvMatches = nkvProducts.filter((p) => {
      if (!q) return results.length < 3;
      return p.name.toLowerCase().includes(q) || p.articleNumber.toLowerCase().startsWith(q);
    });
    for (const p of nkvMatches.slice(0, 8 - results.length)) {
      const alreadyAdded = results.some((r) => r.articleNumber === p.articleNumber);
      if (!alreadyAdded) {
        results.push({ name: p.name, articleNumber: p.articleNumber, price: p.price, source: 'nkv' });
      }
    }

    return results.slice(0, 8);
  }, [articleSearch, selectedCompanyId, companyArticles]);

  const addToCart = useCallback((name: string, articleNumber: string, price: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCart((prev) => {
      const existing = prev.find((item) => item.articleNumber === articleNumber);
      if (existing) {
        return prev.map((item) =>
          item.articleNumber === articleNumber
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prev,
        { id: Date.now().toString(), articleName: name, articleNumber, quantity: 1, price },
      ];
    });
    setArticleSearch('');
    setShowArticleSuggestions(false);
    console.log('[NewOrder] Added to cart:', name);
  }, []);

  const updateCartQuantity = useCallback((id: string, delta: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCart((prev) =>
      prev
        .map((item) =>
          item.id === id ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item
        )
        .filter((item) => item.quantity > 0)
    );
  }, []);

  const updateCartPrice = useCallback((id: string, price: number) => {
    setCart((prev) =>
      prev.map((item) => (item.id === id ? { ...item, price } : item))
    );
  }, []);

  const removeFromCart = useCallback((id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCart((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const cartTotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart]
  );

  const cartItemCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  const handleSubmit = useCallback(() => {
    if (!selectedCompanyId) {
      Alert.alert('Välj företag', 'Du måste välja ett företag för beställningen.');
      return;
    }
    if (cart.length === 0) {
      Alert.alert('Tom varukorg', 'Lägg till minst en artikel i varukorgen.');
      return;
    }

    const orderItems: OrderItem[] = cart.map((item) => ({
      id: item.id,
      articleName: item.articleName,
      articleNumber: item.articleNumber,
      quantity: item.quantity,
      price: item.price,
    }));

    addOrder(
      selectedCompanyId,
      orderItems,
      date,
      deliveryDate || undefined,
      notes || undefined
    );

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Beställning sparad!', 'Din beställning har lagts till.', [
      {
        text: 'OK',
        onPress: () => {
          setCart([]);
          setSelectedCompanyId('');
          setCompanySearch('');
          setDate(getTodayString());
          setDeliveryDate('');
          setNotes('');
          router.push('/' as never);
        },
      },
    ]);
  }, [selectedCompanyId, cart, date, deliveryDate, notes, addOrder, router]);

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Företag</Text>
          <View style={styles.companyInputWrapper}>
            <Search size={16} color={Colors.textTertiary} style={styles.companyInputIcon} />
            <TextInput
              style={styles.companyInput}
              value={selectedCompanyId ? (companies.find(c => c.id === selectedCompanyId)?.name ?? companySearch) : companySearch}
              onChangeText={(text) => {
                if (selectedCompanyId) {
                  setSelectedCompanyId('');
                }
                setCompanySearch(text);
                setCompanyDropdownVisible(true);
              }}
              onFocus={() => {
                if (selectedCompanyId) {
                  setSelectedCompanyId('');
                  setCompanySearch('');
                }
                setCompanyDropdownVisible(true);
              }}
              onBlur={() => {
                setTimeout(() => setCompanyDropdownVisible(false), 250);
              }}
              placeholder="Skriv för att söka företag..."
              placeholderTextColor={Colors.textTertiary}
              testID="company-picker"
            />
            {(companySearch.length > 0 || selectedCompanyId) ? (
              <TouchableOpacity
                onPress={() => {
                  setCompanySearch('');
                  setSelectedCompanyId('');
                  setCompanyDropdownVisible(false);
                }}
                hitSlop={8}
                style={styles.companyClearBtn}
              >
                <X size={14} color={Colors.textTertiary} />
              </TouchableOpacity>
            ) : null}
          </View>
          {showCompanySuggestions ? (
            <View style={styles.pickerDropdown}>
              <ScrollView style={styles.pickerList} nestedScrollEnabled keyboardShouldPersistTaps="handled">
                {filteredCompanies.length > 0 ? filteredCompanies.map((company) => (
                  <TouchableOpacity
                    key={company.id}
                    style={styles.pickerItem}
                    onPress={() => {
                      setSelectedCompanyId(company.id);
                      setCompanySearch(company.name);
                      setCompanyDropdownVisible(false);
                      Haptics.selectionAsync();
                      console.log('[NewOrder] Selected company:', company.name);
                    }}
                  >
                    <Text style={styles.pickerItemText}>{company.name}</Text>
                  </TouchableOpacity>
                )) : (
                  <View style={styles.noResultRow}>
                    <Text style={styles.noResultText}>Inga företag hittades</Text>
                  </View>
                )}
              </ScrollView>
            </View>
          ) : null}
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Orderdatum</Text>
          <TouchableOpacity
            style={styles.datePickerBtn}
            onPress={() => setShowCalendar(true)}
            activeOpacity={0.7}
          >
            <CalendarDays size={18} color={Colors.primary} />
            <Text style={styles.datePickerText}>{date}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Sök artikel</Text>
          <View style={styles.articleSearchWrapper}>
            <Search size={16} color={Colors.textTertiary} />
            <TextInput
              style={styles.articleSearchInput}
              value={articleSearch}
              onChangeText={(text) => {
                setArticleSearch(text);
                setShowArticleSuggestions(true);
              }}
              onFocus={() => setShowArticleSuggestions(true)}
              onBlur={() => {
                setTimeout(() => setShowArticleSuggestions(false), 250);
              }}
              placeholder="Sök namn eller artikelnummer..."
              placeholderTextColor={Colors.textTertiary}
            />
            {articleSearch.length > 0 ? (
              <TouchableOpacity
                onPress={() => {
                  setArticleSearch('');
                  setShowArticleSuggestions(false);
                }}
                hitSlop={8}
              >
                <X size={14} color={Colors.textTertiary} />
              </TouchableOpacity>
            ) : null}
          </View>

          {showArticleSuggestions && articleSuggestions.length > 0 ? (
            <View style={styles.suggestionsDropdown}>
              <ScrollView style={styles.suggestionsList} nestedScrollEnabled keyboardShouldPersistTaps="handled">
                {articleSuggestions.map((s, idx) => (
                  <TouchableOpacity
                    key={`${s.articleNumber}-${idx}`}
                    style={styles.suggestionItem}
                    onPress={() => addToCart(s.name, s.articleNumber, s.price)}
                  >
                    <View style={styles.suggestionLeft}>
                      <Text style={styles.suggestionName} numberOfLines={1}>{s.name}</Text>
                      <View style={styles.suggestionMetaRow}>
                        <Text style={styles.suggestionNumber}>#{s.articleNumber}</Text>
                        {s.price > 0 ? (
                          <Text style={styles.suggestionPrice}>{s.price} kr</Text>
                        ) : null}
                      </View>
                    </View>
                    <View style={[styles.sourceBadge, s.source === 'company' ? styles.sourceBadgeCompany : styles.sourceBadgeNkv]}>
                      <Text style={[styles.sourceBadgeText, s.source === 'company' ? styles.sourceBadgeTextCompany : styles.sourceBadgeTextNkv]}>
                        {s.source === 'company' ? 'Tidigare' : 'NKV'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          ) : null}

          {selectedCompanyId && companyArticles.length > 0 ? (
            <View style={styles.quickAddSection}>
              <View style={styles.quickAddHeader}>
                <Zap size={13} color={Colors.accent} />
                <Text style={styles.quickAddTitle}>Snabbval</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickAddScroll}>
                {companyArticles.slice(0, 8).map((saved) => (
                  <TouchableOpacity
                    key={saved.id}
                    style={styles.quickAddChip}
                    onPress={() => addToCart(saved.articleName, saved.articleNumber, saved.lastPrice)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.quickAddChipName} numberOfLines={1}>{saved.articleName}</Text>
                    <Text style={styles.quickAddChipNumber}>#{saved.articleNumber}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          ) : null}
        </View>

        <View style={styles.cartSection}>
          <View style={styles.cartHeader}>
            <ShoppingCart size={18} color={Colors.primary} />
            <Text style={styles.cartTitle}>Varukorg</Text>
            {cart.length > 0 ? (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cartItemCount}</Text>
              </View>
            ) : null}
          </View>

          {cart.length === 0 ? (
            <View style={styles.cartEmpty}>
              <Package size={28} color={Colors.textTertiary} />
              <Text style={styles.cartEmptyText}>Sök och lägg till artiklar ovan</Text>
            </View>
          ) : (
            <>
              {cart.map((item) => (
                <View key={item.id} style={styles.cartItem}>
                  <View style={styles.cartItemTop}>
                    <View style={styles.cartItemInfo}>
                      <Text style={styles.cartItemName} numberOfLines={1}>{item.articleName}</Text>
                      <Text style={styles.cartItemNumber}>#{item.articleNumber}</Text>
                    </View>
                    <TouchableOpacity onPress={() => removeFromCart(item.id)} hitSlop={8}>
                      <Trash2 size={16} color={Colors.error} />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.cartItemBottom}>
                    <View style={styles.quantityControl}>
                      <TouchableOpacity
                        style={styles.quantityBtn}
                        onPress={() => updateCartQuantity(item.id, -1)}
                      >
                        <Minus size={14} color={Colors.primary} />
                      </TouchableOpacity>
                      <Text style={styles.quantityText}>{item.quantity}</Text>
                      <TouchableOpacity
                        style={styles.quantityBtn}
                        onPress={() => updateCartQuantity(item.id, 1)}
                      >
                        <Plus size={14} color={Colors.primary} />
                      </TouchableOpacity>
                    </View>
                    <View style={styles.cartPriceWrapper}>
                      <TextInput
                        style={styles.cartPriceInput}
                        value={item.price > 0 ? item.price.toString() : ''}
                        onChangeText={(v) => updateCartPrice(item.id, parseFloat(v) || 0)}
                        keyboardType="numeric"
                        placeholder="0"
                        placeholderTextColor={Colors.textTertiary}
                      />
                      <Text style={styles.cartPriceUnit}>kr</Text>
                    </View>
                    {item.price > 0 ? (
                      <Text style={styles.cartItemTotal}>{(item.price * item.quantity).toFixed(0)} kr</Text>
                    ) : null}
                  </View>
                </View>
              ))}

              {cartTotal > 0 ? (
                <View style={styles.cartTotalRow}>
                  <Text style={styles.cartTotalLabel}>Totalt</Text>
                  <Text style={styles.cartTotalValue}>{cartTotal.toFixed(0)} kr</Text>
                </View>
              ) : null}
            </>
          )}
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Anteckningar (valfritt)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Eventuella anteckningar..."
            placeholderTextColor={Colors.textTertiary}
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Leveransdatum (valfritt)</Text>
          <TouchableOpacity
            style={styles.datePickerBtn}
            onPress={() => setShowDeliveryCalendar(true)}
            activeOpacity={0.7}
          >
            <CalendarDays size={18} color={deliveryDate ? Colors.primary : Colors.textTertiary} />
            <Text style={[styles.datePickerText, !deliveryDate && styles.datePickerPlaceholder]}>
              {deliveryDate || 'Välj leveransdatum'}
            </Text>
            {deliveryDate ? (
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  setDeliveryDate('');
                }}
                hitSlop={8}
                style={styles.dateClearBtn}
              >
                <X size={14} color={Colors.textTertiary} />
              </TouchableOpacity>
            ) : null}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.submitButton, cart.length === 0 && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          activeOpacity={0.8}
          testID="submit-order-btn"
          disabled={cart.length === 0}
        >
          <Check size={20} color={Colors.white} />
          <Text style={styles.submitText}>
            {cart.length > 0 ? `Spara beställning (${cartItemCount} artiklar)` : 'Spara beställning'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <CalendarPicker
        visible={showCalendar}
        selectedDate={date}
        onSelect={setDate}
        onClose={() => setShowCalendar(false)}
      />
      <CalendarPicker
        visible={showDeliveryCalendar}
        selectedDate={deliveryDate}
        onSelect={setDeliveryDate}
        onClose={() => setShowDeliveryCalendar(false)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  fieldGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.white,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  companyInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
  },
  companyInputIcon: {
    marginRight: 8,
  },
  companyInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
    paddingVertical: 13,
  },
  companyClearBtn: {
    padding: 4,
    marginLeft: 4,
  },
  pickerDropdown: {
    backgroundColor: Colors.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 4,
    overflow: 'hidden',
  },
  pickerList: {
    maxHeight: 200,
  },
  pickerItem: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  pickerItemText: {
    fontSize: 14,
    color: Colors.text,
  },
  noResultRow: {
    paddingHorizontal: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  noResultText: {
    fontSize: 13,
    color: Colors.textTertiary,
  },
  datePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 10,
  },
  datePickerText: {
    fontSize: 15,
    color: Colors.text,
    fontWeight: '500' as const,
    flex: 1,
  },
  datePickerPlaceholder: {
    color: Colors.textTertiary,
    fontWeight: '400' as const,
  },
  dateClearBtn: {
    padding: 4,
  },
  articleSearchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    gap: 8,
  },
  articleSearchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
    paddingVertical: 13,
  },
  suggestionsDropdown: {
    backgroundColor: Colors.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 4,
    overflow: 'hidden',
  },
  suggestionsList: {
    maxHeight: 280,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  suggestionLeft: {
    flex: 1,
    marginRight: 8,
  },
  suggestionName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  suggestionMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  suggestionNumber: {
    fontSize: 12,
    color: Colors.textTertiary,
  },
  suggestionPrice: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600' as const,
  },
  sourceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  sourceBadgeCompany: {
    backgroundColor: Colors.surfaceSecondary,
  },
  sourceBadgeNkv: {
    backgroundColor: '#E3F2FD',
  },
  sourceBadgeText: {
    fontSize: 10,
    fontWeight: '700' as const,
  },
  sourceBadgeTextCompany: {
    color: Colors.textSecondary,
  },
  sourceBadgeTextNkv: {
    color: Colors.primary,
  },
  quickAddSection: {
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: 10,
    padding: 10,
    marginTop: 12,
  },
  quickAddHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 8,
  },
  quickAddTitle: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  quickAddScroll: {
    flexDirection: 'row',
  },
  quickAddChip: {
    backgroundColor: Colors.white,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    minWidth: 100,
  },
  quickAddChipName: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
    maxWidth: 120,
  },
  quickAddChipNumber: {
    fontSize: 11,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  cartSection: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    marginBottom: 20,
  },
  cartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  cartTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    flex: 1,
  },
  cartBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  cartBadgeText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  cartEmpty: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  cartEmptyText: {
    fontSize: 13,
    color: Colors.textTertiary,
  },
  cartItem: {
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  cartItemTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  cartItemInfo: {
    flex: 1,
    marginRight: 8,
  },
  cartItemName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  cartItemNumber: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  cartItemBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quantityBtn: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  quantityText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
    minWidth: 28,
    textAlign: 'center',
  },
  cartPriceWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 8,
    flex: 1,
  },
  cartPriceInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    paddingVertical: 7,
    textAlign: 'right',
  },
  cartPriceUnit: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginLeft: 4,
  },
  cartItemTotal: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.primary,
    minWidth: 60,
    textAlign: 'right',
  },
  cartTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  cartTotalLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  cartTotalValue: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: Colors.primary,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 10,
    marginTop: 8,
  },
  submitButtonDisabled: {
    backgroundColor: Colors.textTertiary,
  },
  submitText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700' as const,
  },
});
