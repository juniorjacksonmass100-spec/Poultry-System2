import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { PoultryNews } from '../types';
import { logActivity } from './activityService';

const LOCAL_STORAGE_NEWS_KEY = 'kukutrack_news_store';
const LOCAL_STORAGE_DELETED_NEWS_KEY = 'kukutrack_deleted_news_ids';

// Helper to get local stored news
const getLocalNews = (): PoultryNews[] => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_NEWS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

// Helper to save local news
const saveLocalNews = (items: PoultryNews[]) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_NEWS_KEY, JSON.stringify(items));
  } catch {
    // Ignore storage limits
  }
};

// Helper to track permanently deleted news IDs
const getDeletedNewsIds = (): Set<string> => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_DELETED_NEWS_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
};

const markNewsAsDeletedLocally = (id: string) => {
  try {
    const set = getDeletedNewsIds();
    set.add(id);
    localStorage.setItem(LOCAL_STORAGE_DELETED_NEWS_KEY, JSON.stringify(Array.from(set)));
  } catch {
    // Ignore
  }
};

/**
 * Fetch real news for user. Does NOT return any prerecorded mock news!
 * Matches broadcast news OR news targeted specifically to this user's ID or Email.
 */
export const fetchNewsForUser = async (
  userId?: string | null,
  userEmail?: string | null,
  isAdmin?: boolean
): Promise<PoultryNews[]> => {
  const deletedIds = getDeletedNewsIds();
  let dbNews: PoultryNews[] = [];

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('poultry_news')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        dbNews = data;
      }
    } catch {
      // Quiet fail if table not present
    }
  }

  // Also read from local backup store
  const localItems = getLocalNews();

  // Combine DB and local items uniquely by ID
  const map = new Map<string, PoultryNews>();
  dbNews.forEach((n) => {
    if (!deletedIds.has(n.id)) {
      map.set(n.id, n);
    }
  });

  localItems.forEach((n) => {
    if (!deletedIds.has(n.id) && !map.has(n.id)) {
      map.set(n.id, n);
    }
  });

  const allActiveNews = Array.from(map.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  // If Admin, they see every news entry throughout the entire farm UI
  if (isAdmin) {
    return allActiveNews;
  }

  // If standard user, show broadcast news OR news explicitly targeted to this user's ID or email
  const currentUid = userId ? userId.trim() : null;
  const currentEmail = userEmail ? userEmail.trim().toLowerCase() : null;

  const userNews = allActiveNews.filter((item) => {
    const hasTargetUser = Boolean(item.target_user_id && item.target_user_id.trim() !== '');
    const hasTargetEmail = Boolean(item.target_user_email && item.target_user_email.trim() !== '');

    // 1. Broadcast news (no target) is visible to all users
    if (!hasTargetUser && !hasTargetEmail) {
      return true;
    }

    // 2. Targeted to user's UID
    if (currentUid && item.target_user_id && item.target_user_id.trim() === currentUid) {
      return true;
    }

    // 3. Targeted to user's Email address
    if (
      currentEmail &&
      item.target_user_email &&
      item.target_user_email.trim().toLowerCase() === currentEmail
    ) {
      return true;
    }

    return false;
  });

  return userNews;
};

/**
 * Dispatch news or personal advisory. Persists to both Supabase and Local Store.
 */
export const createNews = async (
  news: Omit<PoultryNews, 'id' | 'created_at'>
): Promise<PoultryNews> => {
  const generatedId = `news-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  // Sanitize target recipient
  const target_user_id =
    news.target_user_id && news.target_user_id !== 'broadcast' && news.target_user_id.trim() !== ''
      ? news.target_user_id.trim()
      : null;

  const target_user_email =
    news.target_user_email && news.target_user_email.trim() !== ''
      ? news.target_user_email.trim().toLowerCase()
      : null;

  const author_id = news.author_id && news.author_id.trim() !== '' ? news.author_id.trim() : null;

  const payloadToInsert = {
    title: news.title.trim(),
    content: news.content.trim(),
    category: news.category || 'general',
    priority: news.priority || 'normal',
    target_user_id,
    target_user_email,
    author_id,
    author_name: news.author_name || 'Farm Administration',
    suggestion_context: news.suggestion_context || null,
  };

  let finalNews: PoultryNews = {
    ...payloadToInsert,
    id: generatedId,
    created_at: now,
  };

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('poultry_news')
        .insert([payloadToInsert])
        .select()
        .single();

      if (!error && data) {
        finalNews = data;
      }
    } catch {
      // Quiet failover to local store
    }
  }

  // Always keep in local store backup so recipient sees it immediately
  const existing = getLocalNews();
  const updated = [finalNews, ...existing.filter((n) => n.id !== finalNews.id)];
  saveLocalNews(updated);

  await logActivity(
    'News Dispatched',
    'poultry_news',
    finalNews.id,
    `Title: ${finalNews.title} | Target: ${finalNews.target_user_email || finalNews.target_user_id || 'Broadcast'}`
  );

  return finalNews;
};

/**
 * Delete news throughout the entire system (Supabase DB + Local Store).
 */
export const deleteNews = async (id: string): Promise<void> => {
  markNewsAsDeletedLocally(id);

  // 1. Delete from Supabase
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('poultry_news').delete().eq('id', id);
    } catch {
      // Quiet failover
    }
  }

  // 2. Delete from Local Store
  const existing = getLocalNews();
  const filtered = existing.filter((item) => item.id !== id);
  saveLocalNews(filtered);

  await logActivity('News Deleted', 'poultry_news', id);
};
