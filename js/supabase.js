// =======================================
// SUPABASE.JS - Initialization (v2 syntax)
// =======================================
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://nhzukmkmfyyekyhhfyru.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5oenVrbWttZnl5ZWt5aGhmeXJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5MTQzOTQsImV4cCI6MjA3NTQ5MDM5NH0.0uXVwG5yFcPOFIucVuH73Ng5E9F-6syEPnEJCrty6lk';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ============================
// AUTH HELPERS
// ============================

// Get current user
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// Login user
export async function loginUser(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  if (error) return { error };
  return { user: data.user };
}

// Register user
export async function registerUser(email, password, username) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password
  });
  if (error) return { error };

  // Insert user record into your "users" table
  await supabase
    .from('users')
    .insert({
      id: data.user.id,
      email,
      username,
      balance: 0.0,
      role: 'user'
    });

  return { user: data.user };
}

// Logout user
export async function logoutUser() {
  await supabase.auth.signOut();
}

// Listen for auth state changes (auto refresh)
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
    location.reload();
  }
});
