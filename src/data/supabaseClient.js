// Supabase kliens (anon kulcs - csak publikus olvasásra)
// Ha nincs beállítva REACT_APP_SUPABASE_URL + REACT_APP_SUPABASE_ANON_KEY,
// az app localStorage módban fut tovább (mint eddig).

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

export const isSupabaseEnabled = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export const supabase = isSupabaseEnabled
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

// Admin jelszó a sessionStorage-ben (bejelentkezéskor kerül be, kijelentkezéskor törlődik)
export const getAdminPassword = () => sessionStorage.getItem('ms_admin_pw') || '';
export const setAdminPassword = (pw) => sessionStorage.setItem('ms_admin_pw', pw);
export const clearAdminPassword = () => sessionStorage.removeItem('ms_admin_pw');

// Admin API hívás (Netlify Function, service_role kulccsal ír a DB-be)
export const adminApi = async (op, payload = {}) => {
  const res = await fetch('/.netlify/functions/admin-api', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-password': getAdminPassword()
    },
    body: JSON.stringify({ op, ...payload })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `admin-api hiba (${res.status})`);
  }
  return res.json();
};
