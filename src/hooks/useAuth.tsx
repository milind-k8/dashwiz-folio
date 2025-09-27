import { useState, useEffect, createContext, useContext } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Store Google tokens after successful sign in
        if (event === 'SIGNED_IN' && session?.provider_token && session?.provider_refresh_token) {
          try {
            const { error } = await supabase.functions.invoke('store-user-token', {
              headers: {
                Authorization: `Bearer ${session.access_token}`,
              },
              body: {
                provider_token: session.provider_token,
                provider_refresh_token: session.provider_refresh_token,
              },
            });
            
            if (error) {
              console.error('Failed to store user tokens:', error);
            } else {
              console.log('User tokens stored successfully');
              // Mark that user has gone through consent
              localStorage.setItem('google_consent_given', 'true');
            }
          } catch (error) {
            console.error('Error storing user tokens:', error);
          }
        }
        
        // Handle token expiration
        if (event === 'TOKEN_REFRESHED' && !session) {
          // Token refresh failed, redirect to login
          window.location.href = '/auth';
        }
      }
    );

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
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