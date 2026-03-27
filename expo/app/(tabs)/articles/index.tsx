import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Alert,
  Modal,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Search, Plus, Trash2, Edit3, Package, X, Check, Tag } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useArticles } from '@/providers/ArticlesProvider';
import { Article } from '@/types/order';
import Colors from '@/constants/colors';

export default function ArticlesScreen() {
  const { articles, isLoading, isMutating, addArticle, updateArticle, deleteArticle } = useArticles();

  const [search, setSearch] = useState<string>('');
  const [showForm, setShowForm] = useState<boolean>(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [formNumber, setFormNumber] = useState<string>('');
  const [formName, setFormName] = useState<string>('');
  const [formCategory, setFormCategory] = useState<string>('');

  const filteredArticles = useMemo(() => {
    if (!search.trim()) return articles;
    const q = search.toLowerCase();
    return articles.filter(a =>
      a.name.toLowerCase().includes(q) ||
      a.article_number.toLowerCase().includes(q) ||
      (a.category?.toLowerCase().includes(q) ?? false)
    );
  }, [articles, search]);

  const openAddForm = useCallback(() => {
    setEditingArticle(null);
    setFormNumber('');
    setFormName('');
    setFormCategory('');
    setShowForm(true);
  }, []);

  const openEditForm = useCallback((article: Article) => {
    setEditingArticle(article);
    setFormNumber(article.article_number);
    setFormName(article.name);
    setFormCategory(article.category || '');
    setShowForm(true);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const handleSave = useCallback(async () => {
    if (!formNumber.trim() || !formName.trim()) {
      Alert.alert('Fyll i fält', 'Artikelnummer och namn krävs.');
      return;
    }
    try {
      if (editingArticle) {
        await updateArticle(editingArticle.id, formNumber.trim(), formName.trim(), formCategory.trim() || undefined);
      } else {
        await addArticle(formNumber.trim(), formName.trim(), formCategory.trim() || undefined);
      }
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowForm(false);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Något gick fel';
      if (msg.includes('duplicate') || msg.includes('unique')) {
        Alert.alert('Dublett', 'En artikel med detta nummer finns redan.');
      } else {
        Alert.alert('Fel', msg);
      }
    }
  }, [formNumber, formName, formCategory, editingArticle, addArticle, updateArticle]);

  const handleDelete = useCallback((article: Article) => {
    Alert.alert('Ta bort artikel', `Vill du ta bort "${article.name}"?`, [
      { text: 'Avbryt', style: 'cancel' },
      {
        text: 'Ta bort',
        style: 'destructive',
        onPress: () => {
          deleteArticle(article.id);
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
      },
    ]);
  }, [deleteArticle]);

  const renderArticle = useCallback(({ item }: { item: Article }) => (
    <TouchableOpacity
      style={styles.articleCard}
      onPress={() => openEditForm(item)}
      activeOpacity={0.7}
      testID={`article-${item.id}`}
    >
      <View style={styles.articleLeft}>
        <View style={styles.articleIconWrap}>
          <Package size={18} color={Colors.primary} />
        </View>
        <View style={styles.articleInfo}>
          <Text style={styles.articleName} numberOfLines={1}>{item.name}</Text>
          <View style={styles.articleMetaRow}>
            <Text style={styles.articleNumber}>#{item.article_number}</Text>
            {item.category ? (
              <View style={styles.categoryBadge}>
                <Tag size={10} color={Colors.textSecondary} />
                <Text style={styles.categoryText}>{item.category}</Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>
      <View style={styles.articleActions}>
        <TouchableOpacity
          onPress={() => openEditForm(item)}
          hitSlop={12}
          style={styles.actionBtn}
        >
          <Edit3 size={16} color={Colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleDelete(item)}
          hitSlop={12}
          style={styles.actionBtn}
        >
          <Trash2 size={16} color={Colors.error} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  ), [openEditForm, handleDelete]);

  const keyExtractor = useCallback((item: Article) => item.id, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Laddar artiklar...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <View style={styles.searchContainer}>
          <Search size={18} color={Colors.textTertiary} />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Sök artikelnummer eller namn..."
            placeholderTextColor={Colors.textTertiary}
            testID="article-search"
          />
          {search.length > 0 ? (
            <TouchableOpacity onPress={() => setSearch('')} hitSlop={8}>
              <X size={16} color={Colors.textTertiary} />
            </TouchableOpacity>
          ) : null}
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={openAddForm}
          activeOpacity={0.8}
          testID="add-article-btn"
        >
          <Plus size={20} color={Colors.white} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredArticles}
        renderItem={renderArticle}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Package size={44} color={Colors.textTertiary} />
            <Text style={styles.emptyTitle}>
              {search ? 'Inga artiklar hittades' : 'Inga artiklar ännu'}
            </Text>
            <Text style={styles.emptyText}>
              {search ? 'Prova ett annat sökord.' : 'Tryck + för att lägga till din första artikel.'}
            </Text>
          </View>
        }
        ListHeaderComponent={
          articles.length > 0 ? (
            <Text style={styles.countText}>
              {filteredArticles.length} {filteredArticles.length === 1 ? 'artikel' : 'artiklar'}
              {search ? ` (av ${articles.length})` : ''}
            </Text>
          ) : null
        }
      />

      <Modal visible={showForm} transparent animationType="slide" onRequestClose={() => setShowForm(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowForm(false)}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalKeyboard}>
            <Pressable style={styles.modalContent} onPress={() => {}}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {editingArticle ? 'Redigera artikel' : 'Lägg till artikel'}
                </Text>
                <TouchableOpacity onPress={() => setShowForm(false)} hitSlop={12}>
                  <X size={22} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Artikelnummer *</Text>
                <TextInput
                  style={styles.formInput}
                  value={formNumber}
                  onChangeText={setFormNumber}
                  placeholder="T.ex. 41823"
                  placeholderTextColor={Colors.textTertiary}
                  autoFocus
                  testID="form-article-number"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Namn *</Text>
                <TextInput
                  style={styles.formInput}
                  value={formName}
                  onChangeText={setFormName}
                  placeholder="T.ex. Kulspetspenna Ncon BP-83"
                  placeholderTextColor={Colors.textTertiary}
                  testID="form-article-name"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Kategori (valfritt)</Text>
                <TextInput
                  style={styles.formInput}
                  value={formCategory}
                  onChangeText={setFormCategory}
                  placeholder="T.ex. Pennor, Papper, Tejp..."
                  placeholderTextColor={Colors.textTertiary}
                  testID="form-article-category"
                />
              </View>

              <TouchableOpacity
                style={[styles.saveButton, isMutating && styles.saveButtonDisabled]}
                onPress={handleSave}
                disabled={isMutating}
                activeOpacity={0.8}
                testID="save-article-btn"
              >
                {isMutating ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <Check size={20} color={Colors.white} />
                )}
                <Text style={styles.saveButtonText}>
                  {editingArticle ? 'Spara ändringar' : 'Lägg till'}
                </Text>
              </TouchableOpacity>
            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 8,
    gap: 10,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: 14,
    borderRadius: 12,
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
  addButton: {
    backgroundColor: Colors.primary,
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
    paddingBottom: 32,
  },
  countText: {
    fontSize: 13,
    color: Colors.textTertiary,
    marginBottom: 10,
    fontWeight: '500' as const,
  },
  articleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  articleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  articleIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  articleInfo: {
    flex: 1,
  },
  articleName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  articleMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 3,
  },
  articleNumber: {
    fontSize: 13,
    color: Colors.textTertiary,
    fontWeight: '500' as const,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.surfaceSecondary,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  articleActions: {
    flexDirection: 'row',
    gap: 4,
  },
  actionBtn: {
    padding: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  emptyText: {
    fontSize: 13,
    color: Colors.textTertiary,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  modalKeyboard: {
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  formGroup: {
    marginBottom: 18,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    gap: 10,
    marginTop: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700' as const,
  },
});
