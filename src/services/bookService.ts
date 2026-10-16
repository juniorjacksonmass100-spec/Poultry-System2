import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Book } from '../types';

import { tr } from '../lib/locale';
const BUCKET = 'books';
export const MAX_BOOK_BYTES = 50 * 1024 * 1024;

const need = () => {
  if (!isSupabaseConfigured || !supabase) throw new Error(tr('Database not configured', 'Hifadhidata haijawekwa.'));
  return supabase;
};

const friendly = (message: string): string => {
  const m = message.toLowerCase();
  if (m.includes('row-level security') || m.includes('not allowed')) return tr('Only the administrator can do this.', 'Msimamizi pekee ndiye anayeweza kufanya hivi.');
  if (m.includes('bucket not found')) return tr('The book storage is missing. Run the latest SQL migration (004) in Supabase.', 'Hifadhi ya vitabu haipo. Endesha SQL ya hivi karibuni (004) kwenye Supabase.');
  if (m.includes('exceeded the maximum') || m.includes('too large') || m.includes('payload')) return tr('The file is too large (limit 50 MB).', 'Faili ni kubwa mno (kikomo MB 50).');
  if (m.includes('mime')) return tr('Only PDF files can be uploaded.', 'Faili za PDF pekee ndizo zinaweza kupakiwa.');
  return message;
};

export const fetchBooks = async (): Promise<Book[]> => {
  if (!isSupabaseConfigured || !supabase) return [];
  try {
    const { data, error } = await supabase
      .from('books')
      .select('id, title, description, storage_path, file_size, is_published, uploaded_by, created_at')
      .order('created_at', { ascending: false });
    if (error || !Array.isArray(data)) return [];
    return data.map((b: any) => ({ ...b, file_size: Number(b.file_size) })) as Book[];
  } catch {
    return [];
  }
};

/** A real PDF starts with "%PDF-". Checked before upload so a renamed file cannot slip in. */
export const looksLikePdf = async (file: Blob): Promise<boolean> => {
  const head = new Uint8Array(await file.slice(0, 5).arrayBuffer());
  return String.fromCharCode(...head) === '%PDF-';
};

/** Admin: upload a PDF and add it to the library. Cleans up the file if saving the entry fails. */
export const uploadBook = async (file: File, title: string, description: string): Promise<Book> => {
  const db = need();
  const cleanTitle = title.trim();
  if (!cleanTitle) throw new Error(tr('Please enter a title.', 'Tafadhali weka kichwa.'));
  if (file.size === 0) throw new Error(tr('That file is empty.', 'Faili hilo ni tupu.'));
  if (file.size > MAX_BOOK_BYTES) throw new Error(tr('The file is too large (limit 50 MB).', 'Faili ni kubwa mno (kikomo MB 50).'));
  if (!(await looksLikePdf(file))) throw new Error(tr('That file is not a valid PDF.', 'Faili hilo si PDF halali.'));

  const { data: auth } = await db.auth.getUser();
  // Random file name: nothing the uploader typed ends up in the storage path
  const path = `${crypto.randomUUID()}.pdf`;

  const up = await db.storage.from(BUCKET).upload(path, file, { contentType: 'application/pdf', upsert: false });
  if (up.error) throw new Error(friendly(up.error.message));

  const { data, error } = await db
    .from('books')
    .insert([
      {
        title: cleanTitle,
        description: description.trim() || null,
        storage_path: path,
        file_size: file.size,
        uploaded_by: auth.user?.id ?? null,
      },
    ])
    .select('id, title, description, storage_path, file_size, is_published, uploaded_by, created_at')
    .single();

  if (error) {
    await db.storage.from(BUCKET).remove([path]);
    throw new Error(friendly(error.message));
  }
  return { ...(data as any), file_size: Number((data as any).file_size) } as Book;
};

export const setBookPublished = async (id: string, published: boolean): Promise<void> => {
  const { data, error } = await need().from('books').update({ is_published: published }).eq('id', id).select('id');
  if (error) throw new Error(friendly(error.message));
  if (!data || data.length === 0) throw new Error(tr('Only the administrator can do this.', 'Msimamizi pekee ndiye anayeweza kufanya hivi.'));
};

export const deleteBook = async (book: Book): Promise<void> => {
  const db = need();
  const { data, error } = await db.from('books').delete().eq('id', book.id).select('id');
  if (error) throw new Error(friendly(error.message));
  if (!data || data.length === 0) throw new Error(tr('Only the administrator can do this.', 'Msimamizi pekee ndiye anayeweza kufanya hivi.'));
  await db.storage.from(BUCKET).remove([book.storage_path]);
};

/**
 * Fetches the PDF bytes for reading inside the app. There is no public link: a signed link that
 * works for 60 seconds is made, used once with caching switched off, and never shown to the user.
 * The bytes only live in memory while the reader is open.
 */
export const fetchBookBytes = async (path: string): Promise<ArrayBuffer> => {
  const db = need();
  const { data, error } = await db.storage.from(BUCKET).createSignedUrl(path, 60);
  if (error || !data?.signedUrl) throw new Error(friendly(error?.message || tr('Could not open this book.', 'Kitabu hakikuweza kufunguliwa.')));
  const res = await fetch(data.signedUrl, { cache: 'no-store', credentials: 'omit' });
  if (!res.ok) throw new Error(tr('Could not open this book.', 'Kitabu hakikuweza kufunguliwa.'));
  return res.arrayBuffer();
};
