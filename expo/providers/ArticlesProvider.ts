import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { supabase } from '@/lib/supabase';
import { Article } from '@/types/order';

const ARTICLES_CACHE = '@nkv_articles_cache';

export const [ArticlesProvider, useArticles] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [articles, setArticles] = useState<Article[]>([]);

  const articlesQuery = useQuery({
    queryKey: ['articles'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('articles')
          .select('*')
          .order('name');
        if (error) throw error;
        const mapped: Article[] = (data || []).map((r: Record<string, unknown>) => ({
          id: r.id as string,
          article_number: r.article_number as string,
          name: r.name as string,
          category: (r.category as string) || undefined,
          created_at: (r.created_at as string) || undefined,
        }));
        await AsyncStorage.setItem(ARTICLES_CACHE, JSON.stringify(mapped)).catch(() => {});
        console.log('[ArticlesProvider] Fetched from Supabase:', mapped.length);
        return mapped;
      } catch (e) {
        console.log('[ArticlesProvider] Supabase error, using cache:', e);
        const cached = await AsyncStorage.getItem(ARTICLES_CACHE);
        if (cached) return JSON.parse(cached) as Article[];
        return [];
      }
    },
  });

  useEffect(() => {
    if (articlesQuery.data) setArticles(articlesQuery.data);
  }, [articlesQuery.data]);

  const addMutation = useMutation({
    mutationFn: async (params: { article_number: string; name: string; category?: string }) => {
      const { data, error } = await supabase
        .from('articles')
        .insert({ article_number: params.article_number, name: params.name, category: params.category || null })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      const a: Article = {
        id: data.id as string,
        article_number: data.article_number as string,
        name: data.name as string,
        category: (data.category as string) || undefined,
      };
      setArticles(prev => [...prev, a].sort((x, y) => x.name.localeCompare(y.name, 'sv')));
      void queryClient.invalidateQueries({ queryKey: ['articles'] });
      console.log('[ArticlesProvider] Added:', data.name);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (params: { id: string; article_number: string; name: string; category?: string }) => {
      const { data, error } = await supabase
        .from('articles')
        .update({ article_number: params.article_number, name: params.name, category: params.category || null })
        .eq('id', params.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setArticles(prev => prev.map(a => a.id === (data.id as string) ? {
        id: data.id as string,
        article_number: data.article_number as string,
        name: data.name as string,
        category: (data.category as string) || undefined,
      } : a));
      void queryClient.invalidateQueries({ queryKey: ['articles'] });
      console.log('[ArticlesProvider] Updated:', data.name);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('articles').delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: (id) => {
      setArticles(prev => prev.filter(a => a.id !== id));
      void queryClient.invalidateQueries({ queryKey: ['articles'] });
      console.log('[ArticlesProvider] Deleted:', id);
    },
  });

  const addArticle = useCallback(
    (article_number: string, name: string, category?: string) => {
      return addMutation.mutateAsync({ article_number, name, category });
    },
    [addMutation]
  );

  const updateArticle = useCallback(
    (id: string, article_number: string, name: string, category?: string) => {
      return updateMutation.mutateAsync({ id, article_number, name, category });
    },
    [updateMutation]
  );

  const deleteArticle = useCallback(
    (id: string) => { deleteMutation.mutate(id); },
    [deleteMutation]
  );

  const searchArticles = useCallback(
    (query: string): Article[] => {
      const q = query.toLowerCase().trim();
      if (!q) return articles;
      return articles.filter(a =>
        a.name.toLowerCase().includes(q) ||
        a.article_number.toLowerCase().startsWith(q)
      );
    },
    [articles]
  );

  const isLoading = articlesQuery.isLoading;
  const isMutating = addMutation.isPending || updateMutation.isPending || deleteMutation.isPending;
  const addError = addMutation.error?.message;
  const updateError = updateMutation.error?.message;

  return useMemo(() => ({
    articles, isLoading, isMutating,
    addArticle, updateArticle, deleteArticle, searchArticles,
    addError, updateError,
    refetch: articlesQuery.refetch,
  }), [articles, isLoading, isMutating, addArticle, updateArticle, deleteArticle, searchArticles, addError, updateError, articlesQuery.refetch]);
});
