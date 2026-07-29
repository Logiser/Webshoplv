// Vásárlói fiók — Supabase Auth (e-mail + jelszó).
//
// FONTOS: ez az ADMIN belépéstől teljesen független. Az admin továbbra is
// jelszavas, szerver-oldalon ellenőrzött (admin-api). A vásárlói fiók csak
// a saját rendelések megtekintésére szolgál.
//
// A jelszót soha nem tároljuk és nem látjuk — azt a Supabase Auth kezeli.

import { supabase, isSupabaseEnabled } from './supabaseClient';

export const isAuthEnabled = isSupabaseEnabled;

export const getSession = async () => {
  if (!isSupabaseEnabled) return null;
  const { data } = await supabase.auth.getSession();
  return data.session || null;
};

export const getUser = async () => {
  const s = await getSession();
  return s ? s.user : null;
};

export const onAuthChange = (cb) => {
  if (!isSupabaseEnabled) return () => {};
  const { data } = supabase.auth.onAuthStateChange((_e, session) => cb(session ? session.user : null));
  return () => { try { data.subscription.unsubscribe(); } catch (e) {} };
};

export const signUp = async (email, password, name) => {
  if (!isSupabaseEnabled) throw new Error('A fiókok jelenleg nem érhetők el.');
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: {
      data: { full_name: (name || '').trim() },
      emailRedirectTo: `${window.location.origin}/fiok`
    }
  });
  if (error) throw new Error(translateAuthError(error.message));
  return data;
};

export const signIn = async (email, password) => {
  if (!isSupabaseEnabled) throw new Error('A fiókok jelenleg nem érhetők el.');
  const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  if (error) throw new Error(translateAuthError(error.message));
  return data;
};

export const signOut = async () => {
  if (!isSupabaseEnabled) return;
  await supabase.auth.signOut();
};

export const resetPassword = async (email) => {
  if (!isSupabaseEnabled) throw new Error('A fiókok jelenleg nem érhetők el.');
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: `${window.location.origin}/fiok`
  });
  if (error) throw new Error(translateAuthError(error.message));
};

// A saját rendelések lekérése. A szerver a bejelentkezett felhasználó
// access tokenjét ellenőrzi, és CSAK az ő e-mail-címéhez tartozó
// rendeléseket adja vissza.
export const getMyOrders = async () => {
  const session = await getSession();
  if (!session) return [];
  const res = await fetch('/.netlify/functions/my-orders', {
    headers: { 'Authorization': `Bearer ${session.access_token}` }
  });
  if (!res.ok) throw new Error('A rendelések betöltése nem sikerült.');
  const data = await res.json();
  return data.orders || [];
};

// Gyakori Supabase hibaüzenetek magyarul
function translateAuthError(msg) {
  const m = String(msg || '').toLowerCase();
  if (m.includes('invalid login credentials')) return 'Hibás e-mail-cím vagy jelszó.';
  if (m.includes('user already registered')) return 'Ezzel az e-mail-címmel már van fiók. Jelentkezz be!';
  if (m.includes('password should be at least')) return 'A jelszó legyen legalább 6 karakter.';
  if (m.includes('unable to validate email')) return 'Érvénytelen e-mail-cím.';
  if (m.includes('email not confirmed')) return 'Előbb erősítsd meg az e-mail-címedet a kiküldött levélben.';
  if (m.includes('rate limit') || m.includes('too many')) return 'Túl sok próbálkozás. Várj néhány percet.';
  return msg || 'Ismeretlen hiba.';
}
