import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useSecurity } from '@/hooks/useSecurity';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, username?: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { checkRateLimit, recordLoginAttempt, logSecurityEvent } = useSecurity();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Handle email verification redirect
        if (event === 'SIGNED_IN' && session?.user && window.location.pathname === '/') {
          window.location.href = '/dashboard';
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

  const signIn = async (email: string, password: string) => {
    // Check rate limit before attempting login
    const rateLimitResult = await checkRateLimit(email);
    
    if (!rateLimitResult.allowed) {
      await logSecurityEvent({
        event_type: 'login_blocked_rate_limit',
        event_data: { 
          email,
          reason: rateLimitResult.reason,
          ip_attempts: rateLimitResult.ip_attempts,
          email_attempts: rateLimitResult.email_attempts
        },
        risk_level: 'high'
      });
      
      return { 
        error: { 
          message: 'Too many failed login attempts. Please try again in 15 minutes.',
          status: 429
        } 
      };
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // Record the login attempt
    await recordLoginAttempt(email, !error);

    // Log additional security events
    if (!error) {
      await logSecurityEvent({
        event_type: 'successful_login',
        event_data: { email },
        risk_level: 'low'
      });
    } else {
      await logSecurityEvent({
        event_type: 'failed_login',
        event_data: { 
          email,
          error_message: error.message
        },
        risk_level: 'medium'
      });
    }

    return { error };
  };

  const signUp = async (email: string, password: string, username?: string) => {
    const redirectUrl = `${window.location.origin}/dashboard`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: username ? { username } : undefined,
      }
    });

    // Enhanced error handling for existing email
    if (error) {
      let errorToReturn = error;
      
      // Check for existing user error and provide clear message
      if (error.message?.includes('User already registered') || 
          error.message?.includes('already been registered') ||
          error.message?.includes('email address is already registered') ||
          error.status === 422) {
        errorToReturn = {
          message: 'An account with this email address already exists. Please sign in instead or use a different email address.'
        } as any;
      }
      
      // Log signup attempt
      await logSecurityEvent({
        event_type: 'failed_signup',
        event_data: { 
          email,
          username,
          error_message: error.message,
          error_type: errorToReturn.message !== error.message ? 'existing_email' : 'other'
        },
        risk_level: 'medium'
      });

      return { error: errorToReturn };
    }

    // Log successful signup attempt
    await logSecurityEvent({
      event_type: 'successful_signup',
      event_data: { 
        email,
        username
      },
      risk_level: 'low'
    });

    // Send welcome email after successful signup
    try {
      await supabase.functions.invoke('send-welcome-email', {
        body: { 
          email, 
          username: username || email.split('@')[0] 
        }
      });
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Don't fail the signup if email fails
    }

    return { error };
  };

  const signOut = async () => {
    // Log signout event
    if (user) {
      await logSecurityEvent({
        event_type: 'user_signout',
        user_id: user.id,
        event_data: {},
        risk_level: 'low'
      });
    }
    
    await supabase.auth.signOut();
  };

  const value = {
    user,
    session,
    signIn,
    signUp,
    signOut,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};