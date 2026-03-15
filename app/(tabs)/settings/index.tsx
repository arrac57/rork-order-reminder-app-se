import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { Bell, Building2, Plus, Trash2, Clock, Database, ChevronDown, ChevronUp } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useSettings } from '@/providers/SettingsProvider';
import { useOrders } from '@/providers/OrderProvider';
import Colors from '@/constants/colors';

export default function SettingsScreen() {
  const { settings, updateSettings } = useSettings();
  const { companies, addCompany, deleteCompany, savedArticles, deleteSavedArticle, getArticlesForCompany } = useOrders();

  const [newCompanyName, setNewCompanyName] = useState<string>('');
  const [showAddCompany, setShowAddCompany] = useState<boolean>(false);
  const [editingTime, setEditingTime] = useState<boolean>(false);
  const [timeInput, setTimeInput] = useState<string>(settings.reminderTime);
  const [showArticleManager, setShowArticleManager] = useState<boolean>(false);
  const [expandedCompanyId, setExpandedCompanyId] = useState<string | null>(null);

  const companiesWithArticles = useMemo(() => {
    const sorted = [...companies].sort((a, b) => a.name.localeCompare(b.name, 'sv'));
    return sorted.filter((c) => getArticlesForCompany(c.id).length > 0);
  }, [companies, getArticlesForCompany]);

  const handleToggleReminder = useCallback(
    (value: boolean) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      updateSettings({ reminderEnabled: value });
    },
    [updateSettings]
  );

  const handleSaveTime = useCallback(() => {
    const match = timeInput.match(/^([01]\d|2[0-3]):([0-5]\d)$/);
    if (!match) {
      Alert.alert('Ogiltigt format', 'Ange tid i formatet HH:MM (t.ex. 08:00)');
      return;
    }
    updateSettings({ reminderTime: timeInput });
    setEditingTime(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [timeInput, updateSettings]);

  const handleAddCompany = useCallback(() => {
    if (!newCompanyName.trim()) {
      Alert.alert('Ange namn', 'Företagsnamn kan inte vara tomt.');
      return;
    }
    addCompany(newCompanyName.trim());
    setNewCompanyName('');
    setShowAddCompany(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [newCompanyName, addCompany]);

  const handleDeleteCompany = useCallback(
    (id: string, name: string) => {
      Alert.alert('Ta bort företag', `Vill du ta bort "${name}"?`, [
        { text: 'Avbryt', style: 'cancel' },
        {
          text: 'Ta bort',
          style: 'destructive',
          onPress: () => {
            deleteCompany(id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ]);
    },
    [deleteCompany]
  );

  const handleDeleteArticle = useCallback(
    (articleId: string, articleName: string) => {
      Alert.alert('Ta bort artikel', `Vill du ta bort "${articleName}" från sparade artiklar?`, [
        { text: 'Avbryt', style: 'cancel' },
        {
          text: 'Ta bort',
          style: 'destructive',
          onPress: () => {
            deleteSavedArticle(articleId);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ]);
    },
    [deleteSavedArticle]
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Bell size={18} color={Colors.primary} />
          <Text style={styles.sectionTitle}>Påminnelser</Text>
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Daglig påminnelse</Text>
            <Text style={styles.settingDescription}>
              Få en notis om att logga beställningar
            </Text>
          </View>
          <Switch
            value={settings.reminderEnabled}
            onValueChange={handleToggleReminder}
            trackColor={{ false: Colors.border, true: Colors.primaryLight }}
            thumbColor={settings.reminderEnabled ? Colors.primary : Colors.textTertiary}
          />
        </View>

        {settings.reminderEnabled && (
          <View style={styles.timeSection}>
            <View style={styles.timeRow}>
              <Clock size={16} color={Colors.textSecondary} />
              <Text style={styles.timeLabel}>Påminnelsetid</Text>
              <TouchableOpacity
                onPress={() => setEditingTime(!editingTime)}
                style={styles.editTimeBtn}
              >
                <Text style={styles.editTimeText}>{editingTime ? 'Avbryt' : 'Ändra'}</Text>
              </TouchableOpacity>
            </View>
            {editingTime ? (
              <View style={styles.timeEditRow}>
                <TextInput
                  style={styles.timeInput}
                  value={timeInput}
                  onChangeText={setTimeInput}
                  placeholder="HH:MM"
                  placeholderTextColor={Colors.textTertiary}
                  keyboardType={Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'default'}
                  maxLength={5}
                />
                <TouchableOpacity onPress={handleSaveTime} style={styles.saveTimeBtn}>
                  <Text style={styles.saveTimeBtnText}>Spara</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Text style={styles.currentTime}>{settings.reminderTime}</Text>
            )}
          </View>
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Building2 size={18} color={Colors.primary} />
          <Text style={styles.sectionTitle}>Företag ({companies.length})</Text>
          <TouchableOpacity
            onPress={() => setShowAddCompany(!showAddCompany)}
            style={styles.addCompanyHeaderBtn}
          >
            <Plus size={18} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {showAddCompany && (
          <View style={styles.addCompanyRow}>
            <TextInput
              style={styles.addCompanyInput}
              value={newCompanyName}
              onChangeText={setNewCompanyName}
              placeholder="Nytt företagsnamn..."
              placeholderTextColor={Colors.textTertiary}
              autoFocus
            />
            <TouchableOpacity
              onPress={handleAddCompany}
              style={styles.addCompanyBtn}
              activeOpacity={0.7}
            >
              <Text style={styles.addCompanyBtnText}>Lägg till</Text>
            </TouchableOpacity>
          </View>
        )}

        {companies.map((company) => (
          <View key={company.id} style={styles.companyRow}>
            <Text style={styles.companyName}>{company.name}</Text>
            <TouchableOpacity
              onPress={() => handleDeleteCompany(company.id, company.name)}
              hitSlop={12}
            >
              <Trash2 size={16} color={Colors.textTertiary} />
            </TouchableOpacity>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => setShowArticleManager(!showArticleManager)}
          activeOpacity={0.7}
        >
          <Database size={18} color={Colors.primary} />
          <Text style={styles.sectionTitle}>Sparade artiklar ({savedArticles.length})</Text>
          {showArticleManager ? (
            <ChevronUp size={18} color={Colors.textTertiary} />
          ) : (
            <ChevronDown size={18} color={Colors.textTertiary} />
          )}
        </TouchableOpacity>

        {!showArticleManager && (
          <Text style={styles.articleManagerHint}>
            Tryck för att hantera sparade artiklar per företag
          </Text>
        )}

        {showArticleManager && (
          <View style={styles.articleManagerContent}>
            {companiesWithArticles.length === 0 && (
              <Text style={styles.noArticlesText}>
                Inga sparade artiklar ännu. Artiklar sparas automatiskt när du gör beställningar.
              </Text>
            )}
            {companiesWithArticles.map((company) => {
              const articles = getArticlesForCompany(company.id);
              const isExpanded = expandedCompanyId === company.id;
              return (
                <View key={company.id} style={styles.articleCompanyGroup}>
                  <TouchableOpacity
                    style={styles.articleCompanyHeader}
                    onPress={() => setExpandedCompanyId(isExpanded ? null : company.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.articleCompanyName}>{company.name}</Text>
                    <View style={styles.articleCompanyMeta}>
                      <Text style={styles.articleCompanyCount}>{articles.length} artiklar</Text>
                      {isExpanded ? (
                        <ChevronUp size={14} color={Colors.textTertiary} />
                      ) : (
                        <ChevronDown size={14} color={Colors.textTertiary} />
                      )}
                    </View>
                  </TouchableOpacity>
                  {isExpanded &&
                    articles.map((article) => (
                      <View key={article.id} style={styles.savedArticleRow}>
                        <View style={styles.savedArticleInfo}>
                          <Text style={styles.savedArticleName}>{article.articleName}</Text>
                          <Text style={styles.savedArticleMeta}>
                            #{article.articleNumber} · {article.lastPrice > 0 ? `${article.lastPrice} kr` : '—'} · {article.orderCount} beställningar
                          </Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => handleDeleteArticle(article.id, article.articleName)}
                          hitSlop={12}
                        >
                          <Trash2 size={14} color={Colors.textTertiary} />
                        </TouchableOpacity>
                      </View>
                    ))}
                </View>
              );
            })}
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>NKV Orderhantering v1.0</Text>
      </View>
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
    paddingBottom: 40,
  },
  section: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    flex: 1,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  settingDescription: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  timeSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    flex: 1,
  },
  editTimeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  editTimeText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '500' as const,
  },
  timeEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
  },
  timeInput: {
    flex: 1,
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    color: Colors.text,
    fontWeight: '600' as const,
    textAlign: 'center',
  },
  saveTimeBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  saveTimeBtnText: {
    color: Colors.white,
    fontWeight: '600' as const,
    fontSize: 14,
  },
  currentTime: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.primary,
    marginTop: 8,
  },
  addCompanyHeaderBtn: {
    padding: 4,
  },
  addCompanyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  addCompanyInput: {
    flex: 1,
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.text,
  },
  addCompanyBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  addCompanyBtnText: {
    color: Colors.white,
    fontWeight: '600' as const,
    fontSize: 13,
  },
  companyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  companyName: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500' as const,
  },
  articleManagerHint: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: -8,
  },
  articleManagerContent: {
    marginTop: 4,
  },
  noArticlesText: {
    fontSize: 13,
    color: Colors.textTertiary,
    textAlign: 'center',
    paddingVertical: 16,
    lineHeight: 18,
  },
  articleCompanyGroup: {
    marginBottom: 8,
    borderRadius: 10,
    backgroundColor: Colors.surfaceSecondary,
    overflow: 'hidden',
  },
  articleCompanyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  articleCompanyName: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.text,
    flex: 1,
  },
  articleCompanyMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  articleCompanyCount: {
    fontSize: 12,
    color: Colors.textTertiary,
  },
  savedArticleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  savedArticleInfo: {
    flex: 1,
    marginRight: 12,
  },
  savedArticleName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  savedArticleMeta: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  footerText: {
    fontSize: 12,
    color: Colors.textTertiary,
  },
});
