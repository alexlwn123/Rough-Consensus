import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
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
    } else if (roleData) {
      return true; // User found in user_roles as admin
    }

    // If not found directly or there was an error, try the function approach
    const { data: funcData, error: funcError } = await supabase.rpc('is_admin');
    
    if (funcError) {
      console.error("Error calling is_admin function:", funcError);
      return false;
    }
    
    return !!funcData; // Return result from the function
    
  } catch (error) {
    console.error("Exception checking admin status:", error);
    return false;
  }
};