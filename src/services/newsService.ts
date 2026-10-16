import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { PoultryNews } from '../types';
import { logActivity } from './activityService';

import { tr } from '../lib/locale';
/**
 * News is stored ONLY in the Supabase database. Nothing is cached or faked in the
 * browser, so what the admin posts is exactly what users see, and what the admin
 * deletes is really gone for everyone.
 *
 * Database rules (Row Level Security):
 *  - a user can read broadcasts and messages addressed to them
 *  - only the admin can post, edit or delete
 */
export const fetchNewsForUser = async (): Promise<PoultryNews[]> => {
  if (!isSupabaseConfigured || !supabase) return [];
  try {
    const { data, error } = await supabase
      .from('poultry_news')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !Array.isArray(data)) return [];
    return data as PoultryNews[];
  } catch {
    return [];
  }
};

export const createNews = async (
  news: Omit<PoultryNews, 'id' | 'created_at'>
): Promise<PoultryNews> => {
  if (!isSupabaseConfigured || !supabase) throw new Error(tr('Database not configured', 'Hifadhidata haijawekwa.'));

  const title = news.title.trim();
  const content = news.content.trim();
  if (!title || !content) throw new Error(tr('Please enter both a title and a message.', 'Tafadhali weka kichwa na ujumbe.'));

  const target_user_id =
    news.target_user_id && news.target_user_id !== 'broadcast' && news.target_user_id.trim() !== ''
      ? news.target_user_id.trim()
      : null;

  const payload = {
    title,
    content,
    category: news.category || 'general',
    priority: news.priority || 'normal',
    target_user_id,
    target_user_email: news.target_user_email ? news.target_user_email.trim().toLowerCase() : null,
    author_id: news.author_id && news.author_id.trim() !== '' ? news.author_id.trim() : null,
    author_name: news.author_name || 'Farm Administration',
    suggestion_context: news.suggestion_context || null,
  };

  const { data, error } = await supabase.from('poultry_news').insert([payload]).select().single();

  if (error) {
    const msg = String(error.message || '');
    if (msg.toLowerCase().includes('row-level security')) {
      throw new Error(tr('Only the administrator can post news. Please sign in as admin and run the latest SQL migration.', 'Msimamizi pekee ndiye anayeweza kutuma habari. Ingia kama msimamizi na uhakikishe SQL ya hivi karibuni imeendeshwa.'));
    }
    if (error.code === 'PGRST205' || msg.toLowerCase().includes('schema cache')) {
      throw new Error(tr('The news table is missing. Run supabase/migrations/002_user_isolation_and_news.sql in Supabase.', 'Jedwali la habari halipo. Endesha faili la SQL 002_user_isolation_and_news.sql kwenye Supabase.'));
    }
    throw new Error(msg || tr('Could not post the news.', 'Habari haikuweza kutumwa.'));
  }

  await logActivity(
    'News Dispatched',
    'poultry_news',
    data.id,
    `Title: ${data.title} | Target: ${data.target_user_email || data.target_user_id || 'Everyone'}`
  );

  return data as PoultryNews;
};

/** Really deletes a news item for everyone. Throws if nothing was deleted. */
export const deleteNews = async (id: string): Promise<void> => {
  if (!isSupabaseConfigured || !supabase) throw new Error(tr('Database not configured', 'Hifadhidata haijawekwa.'));

  const { data, error } = await supabase.from('poultry_news').delete().eq('id', id).select('id');
  if (error) throw new Error(error.message);
  if (!data || data.length === 0) {
    throw new Error(tr('The message was not deleted. Only the administrator can delete news.', 'Habari haijafutwa. Msimamizi pekee ndiye anayeweza kufuta habari.'));
  }

  await logActivity('News Deleted', 'poultry_news', id);
};
