import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { setActiveOwnerId } from '../lib/scope';
import { UserProfile, UserRole } from '../types';
import { checkIsFirstRun, fetchUserProfile, ensureUserProfile } from '../services/authService';

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
  /** Admin only: the user whose account the admin is currently looking at. */
  viewAsUser: UserProfile | null;
  setViewAsUser: (target: UserProfile | null) => void;
  /** Whose data the app shows right now (the viewed user for an admin, otherwise me). */
  effectiveOwnerId: string | null;
  /** True after the user opened a password-reset email link. */
  isRecoveringPassword: boolean;
  finishPasswordRecovery: () => void;
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
  const [viewAsUserState, setViewAsUserState] = useState<UserProfile | null>(null);
  const [isRecoveringPassword, setIsRecoveringPassword] = useState<boolean>(false);

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

    const buildFallback = (): UserProfile => ({
      id: targetUser.id,
      email: email || 'user@poultryfarm.com',
      full_name: targetUser.user_metadata?.full_name || (email ? email.split('@')[0] : 'Farm User'),
      phone: targetUser.user_metadata?.phone || null,
      role: assignedRole,
      is_active: true,
      preferred_language: 'en',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    try {
      let userProf = await fetchUserProfile(targetUser.id);
      if (!userProf) {
        // No profile row yet (e.g. account made before the database trigger existed): create it
        await ensureUserProfile(targetUser);
        userProf = await fetchUserProfile(targetUser.id);
      }
      if (userProf) {
        if (isOwner && userProf.role !== 'admin') {
          userProf = { ...userProf, role: 'admin' };
        }
        setProfile(userProf);
      } else {
        setProfile(buildFallback());
      }
    } catch {
      setProfile(buildFallback());
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (currentUserRef.current) {
      await loadProfileForUser(currentUserRef.current);
    }
  }, [loadProfileForUser]);

  // Main Auth Setup - runs ONCE on mount
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    // Failsafe: never leave the app stuck on the loading screen
    const timeoutId = setTimeout(() => {
      if (isMounted) setLoading(false);
    }, 4000);

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

    // IMPORTANT: Supabase can deadlock if you call the database from inside this callback,
    // so all follow-up work is pushed to the next tick with setTimeout.
    const { data: { subscription: authListener } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        if (!isMounted) return;

        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (event === 'PASSWORD_RECOVERY') {
          setIsRecoveringPassword(true);
        }

        setTimeout(async () => {
          if (!isMounted) return;
          if (newSession?.user) {
            setShowAuthModal(false);
            await loadProfileForUser(newSession.user);
            setIsFirstRun(false);
          } else {
            setProfile(null);
            setViewAsUserState(null);
            await checkFirstRunStatus();
          }
          if (isMounted) setLoading(false);
        }, 0);
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
    setViewAsUserState(null);
    setIsRecoveringPassword(false);
    await checkFirstRunStatus();
  };

  // The primary admin email is ALWAYS admin
  const isAdmin = Boolean(
    isMasterAdmin(user?.email) ||
    (profile?.role === 'admin' && profile?.is_active)
  );

  // Only an admin can open someone else's account
  const viewAsUser = isAdmin && viewAsUserState && viewAsUserState.id !== user?.id ? viewAsUserState : null;
  const effectiveOwnerId = viewAsUser ? viewAsUser.id : user?.id ?? null;

  // Services read this synchronously, so set it during render (before any child effect runs)
  setActiveOwnerId(effectiveOwnerId);

  const setViewAsUser = useCallback((target: UserProfile | null) => {
    setViewAsUserState(target);
  }, []);

  const finishPasswordRecovery = useCallback(() => setIsRecoveringPassword(false), []);

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
        viewAsUser,
        setViewAsUser,
        effectiveOwnerId,
        isRecoveringPassword,
        finishPasswordRecovery,
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
