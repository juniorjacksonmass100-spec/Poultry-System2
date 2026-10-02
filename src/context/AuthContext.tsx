import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { UserProfile, UserRole } from '../types';
import { checkIsFirstRun, fetchUserProfile } from '../services/authService';

export const MASTER_ADMIN_EMAIL = 'junior.jacksonmass100@gmail.com';

export const isMasterAdmin = (email?: string | null): boolean => {
  if (!email) return false;
  return email.trim().toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase();
};

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  isFirstRun: boolean;
  isSchemaMissing: boolean;
  isAdmin: boolean;
  isConfigured: boolean;
  showAuthModal: boolean;
  setShowAuthModal: (show: boolean) => void;
  refreshProfile: () => Promise<void>;
  checkFirstRunStatus: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isFirstRun, setIsFirstRun] = useState<boolean>(false);
  const [isSchemaMissing, setIsSchemaMissing] = useState<boolean>(false);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);

  const currentUserRef = useRef<User | null>(null);
  currentUserRef.current = user;

  const checkFirstRunStatus = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setIsFirstRun(false);
      setIsSchemaMissing(false);
      return;
    }
    try {
      const { isFirstRun: firstRun, isSchemaMissing: schemaMissing } = await checkIsFirstRun();
      setIsFirstRun(firstRun);
      setIsSchemaMissing(schemaMissing);
    } catch {
      setIsFirstRun(false);
      setIsSchemaMissing(false);
    }
  }, []);

  const loadProfileForUser = useCallback(async (targetUser: User | null) => {
    if (!targetUser) {
      setProfile(null);
      return;
    }

    const email = targetUser.email || '';
    const isOwner = isMasterAdmin(email);
    const assignedRole: UserRole = isOwner ? 'admin' : 'staff';

    try {
      const userProf = await fetchUserProfile(targetUser.id);
      if (userProf) {
        // If master admin email, always ensure role is admin
        if (isOwner && userProf.role !== 'admin') {
          userProf.role = 'admin';
        }
        setProfile(userProf);
      } else {
        const fallback: UserProfile = {
          id: targetUser.id,
          email: email || 'user@poultryfarm.com',
          full_name: targetUser.user_metadata?.full_name || (email ? email.split('@')[0] : 'Farm User'),
          phone: targetUser.user_metadata?.phone || null,
          role: assignedRole,
          is_active: true,
          preferred_language: 'en',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setProfile(fallback);
      }
    } catch {
      setProfile({
        id: targetUser.id,
        email: email || 'user@poultryfarm.com',
        full_name: targetUser.user_metadata?.full_name || (email ? email.split('@')[0] : 'Farm User'),
        phone: null,
        role: assignedRole,
        is_active: true,
        preferred_language: 'en',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (currentUserRef.current) {
      await loadProfileForUser(currentUserRef.current);
    }
  }, [loadProfileForUser]);

  // Main Auth Setup - Runs ONCE on mount to prevent any infinite loop!
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    // Failsafe timeout: never allow app to freeze in loading state
    const timeoutId = setTimeout(() => {
      if (isMounted) setLoading(false);
    }, 2000);

    // Initial session retrieval
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfileForUser(session.user).finally(() => {
          if (isMounted) setLoading(false);
        });
      } else {
        checkFirstRunStatus().finally(() => {
          if (isMounted) setLoading(false);
        });
      }
    }).catch(() => {
      if (isMounted) setLoading(false);
    });

    // Listen to Auth State Changes
    const { data: { subscription: authListener } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!isMounted) return;
        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          setShowAuthModal(false);
          await loadProfileForUser(newSession.user);
          setIsFirstRun(false);
        } else {
          setProfile(null);
          await checkFirstRunStatus();
        }
        setLoading(false);
      }
    );

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      authListener?.unsubscribe();
    };
  }, [checkFirstRunStatus, loadProfileForUser]);

  const signOut = async () => {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch {
        // Quiet failover
      }
    }
    setUser(null);
    setSession(null);
    setProfile(null);
    await checkFirstRunStatus();
  };

  // Master admin email junior.jacksonmass100@gmail.com is ALWAYS admin
  const isAdmin = Boolean(
    isMasterAdmin(user?.email) || 
    (profile?.role === 'admin' && profile?.is_active)
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        isFirstRun,
        isSchemaMissing,
        isAdmin,
        isConfigured: isSupabaseConfigured,
        showAuthModal,
        setShowAuthModal,
        refreshProfile,
        checkFirstRunStatus,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
