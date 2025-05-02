import { createClient } from "@supabase/supabase-js";
import { Database } from "../types/database.types";
import { DebateDb } from "../types";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: "pkce",
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Auth functions
export const signInWithGithub = async () => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error signing in with GitHub:", error);
    throw error;
  }
};

export const fetchDebates = async () => {
  const { data, error } = await supabase
    .from("debates")
    .select("*")
    .order("start_time", { ascending: true });
  if (error) throw error;
  return data;
};

export const fetchDebate = async (id: string) => {
  const { data, error } = await supabase
    .from("debates")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) throw error;
  return data satisfies DebateDb;
};

export const logOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
};

// Admin functions
export const checkIsAdmin = async (userId: string): Promise<boolean> => {
  try {
    // First, try to check using the user_roles table
    const { data: roleData, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle(); // Using maybeSingle to avoid errors when no data is found

    if (roleError && roleError.code !== "PGSQL_ERROR_NO_DATA_FOUND") {
      console.error("Error checking admin role:", roleError);
    }

    return !!roleData;
  } catch (error) {
    console.error("Exception checking admin status:", error);
    return false;
  }
};
