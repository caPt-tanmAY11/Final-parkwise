import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase as rawSupabase } from '@/integrations/supabase/client';
const supabase = rawSupabase as any;

export type UserRole = 'admin' | 'manager' | 'attendant' | 'staff' | 'user';

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  username?: string;
  phone?: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  roles: UserRole[];
  loading: boolean;
  signUp: (email: string, password: string, fullName: string, phone?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  hasRole: (role: UserRole) => boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Fetch profile and roles when user logs in
        if (session?.user) {
          setTimeout(() => {
            fetchUserData(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setRoles([]);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserData(session.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserData = async (userId: string) => {
    try {
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Fetch roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (rolesError) throw rolesError;
      setRoles(rolesData?.map(r => r.role as UserRole) || []);
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, fullName: string, phone?: string) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          full_name: fullName,
          phone: phone,
        },
      },
    });

    if (error) {
      console.error("Error during signUp:", error);
      return { error };
    }

    // Ensure profile row exists in `profiles`
    try {
      if (data?.user?.id) {
        const userId = data.user.id;

        await supabase
          .from("profiles")
          .insert({
            id: userId,
            full_name: fullName,
            email: email,
            phone: phone || null,
          })
          .select(); // select() not required but returns inserted row in some clients
      }
    } catch (profileErr) {
      // Don't block signup flow if profile insert fails — log for debugging
      console.error("Failed to insert profile after signUp:", profileErr);
    }

    // Assign manager/attendant role and link to centre (your current logic)
    try {
      const managerPattern = /^manager#(.+)@gmail\.com$/i;
      const attendantPattern = /^attendant#(.+)@gmail\.com$/i;
      const managerMatch = email.match(managerPattern);
      const attendantMatch = email.match(attendantPattern);

      if (data?.user) {
        const userId = data.user.id;

        if (managerMatch) {
          const centreName = managerMatch[1].replace(/-/g, " ");
          const { data: centres } = await supabase
            .from("parking_centres")
            .select("id, name")
            .ilike("name", `%${centreName}%`)
            .limit(1);

          if (centres && centres.length > 0) {
            const centreId = centres[0].id;

            await supabase.from("user_roles").insert({ user_id: userId, role: "manager" });
            await supabase.from("parking_centre_managers").insert({ user_id: userId, centre_id: centreId });
            console.log(`Manager role assigned for ${centres[0].name}`);
          } else {
            console.warn(`No parking centre found matching: ${centreName}`);
          }
        } else if (attendantMatch) {
          const centreName = attendantMatch[1].replace(/-/g, " ");
          const { data: centres, error: centreError } = await supabase
            .from("parking_centres")
            .select("id, name")
            .ilike("name", `%${centreName}%`)
            .limit(1);

          if (centreError) console.error("Error finding centre for attendant:", centreError);

          if (centres && centres.length > 0) {
            const centreId = centres[0].id;
            await supabase.from("user_roles").insert({ user_id: userId, role: "attendant" });
            await supabase.from("parking_centre_attendants").insert({ user_id: userId, centre_id: centreId });
            console.log(`Attendant role assigned for ${centres[0].name}`);
          } else {
            console.warn(`No parking centre found matching: ${centreName}`);
          }
        }
      }
    } catch (roleErr) {
      console.error("Error assigning roles after signUp:", roleErr);
    }

    // Immediately fetch user data to populate profile/roles in context (optional but helpful)
    try {
      if (data?.user?.id) {
        await fetchUserData(data.user.id);
      }
    } catch (fetchErr) {
      console.error("Error fetching user data after signUp:", fetchErr);
    }

    return { error: null };
  } catch (error) {
    console.error("Unexpected signUp error:", error);
    return { error };
  }
};


  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
    } catch (error) {
      return { error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setRoles([]);
  };

  const hasRole = (role: UserRole) => {
    return roles.includes(role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        roles,
        loading,
        signUp,
        signIn,
        signOut,
        hasRole,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
