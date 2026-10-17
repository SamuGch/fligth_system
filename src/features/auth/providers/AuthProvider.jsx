import { useCallback, useEffect, useRef, useState } from "react";
import {
  getMyProfile,
  syncClient,
  updateMyProfile,
} from "../../../services/apiClient";
import { isSupabaseConfigured, supabase } from "../../../lib/supabase";
import { AuthContext } from "../context/AuthContext";

const configurationError =
  "La autenticación no está configurada. Revisa las variables de entorno de Supabase.";

export default function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [syncStatus, setSyncStatus] = useState("idle");
  const [error, setError] = useState(
    isSupabaseConfigured ? null : configurationError,
  );
  const syncedToken = useRef(null);
  const syncPromise = useRef(null);

  const syncProfile = useCallback(async (activeSession) => {
    if (!activeSession?.access_token) return null;
    if (syncedToken.current === activeSession.access_token) return null;
    if (syncPromise.current) return syncPromise.current;

    setSyncStatus("syncing");
    setError(null);
    syncPromise.current = (async () => {
      try {
        await syncClient(activeSession.access_token);
        const profile = await getMyProfile(activeSession.access_token);
        setClient(profile);
        syncedToken.current = activeSession.access_token;
        setSyncStatus("synced");
        return profile;
      } catch (syncError) {
        setClient(null);
        setSyncStatus("error");
        setError(syncError.message || "No fue posible sincronizar tu cuenta.");
        throw syncError;
      } finally {
        syncPromise.current = null;
      }
    })();
    return syncPromise.current;
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) return undefined;

    let mounted = true;
    const restoreSession = async () => {
      const { data, error: sessionError } = await supabase.auth.getSession();
      if (!mounted) return;
      if (sessionError) setError(sessionError.message);
      setSession(data.session);
      if (data.session) {
        try {
          await syncProfile(data.session);
        } catch {
          // syncProfile already exposes the recoverable error in context.
        }
      }
      if (mounted) setLoading(false);
    };
    void restoreSession();

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        setSession(nextSession);
        if (!nextSession) {
          syncedToken.current = null;
          setClient(null);
          setSyncStatus("idle");
          return;
        }
        void syncProfile(nextSession).catch(() => undefined);
      },
    );

    return () => {
      mounted = false;
      subscription.subscription.unsubscribe();
    };
  }, [syncProfile]);

  const signIn = useCallback(
    async (email, password) => {
      if (!supabase) throw new Error(configurationError);
      setError(null);
      const { data, error: authError } =
        await supabase.auth.signInWithPassword({ email, password });
      if (authError) {
        setError(authError.message);
        throw authError;
      }
      await syncProfile(data.session);
      return data;
    },
    [syncProfile],
  );

  const signUp = useCallback(
    async ({ firstName, lastName, email, password }) => {
      if (!supabase) throw new Error(configurationError);
      setError(null);
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { first_name: firstName, last_name: lastName } },
      });
      if (authError) {
        setError(authError.message);
        throw authError;
      }
      if (data.session) await syncProfile(data.session);
      return data;
    },
    [syncProfile],
  );

  const signInWithGoogle = useCallback(async () => {
    if (!supabase) throw new Error(configurationError);
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (authError) {
      setError(authError.message);
      throw authError;
    }
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    const { error: authError } = await supabase.auth.signOut();
    if (authError) {
      setError(authError.message);
      throw authError;
    }
    syncedToken.current = null;
    setClient(null);
    setSession(null);
    setSyncStatus("idle");
  }, []);

  const updateProfile = useCallback(async (changes) => {
    const profile = await updateMyProfile(changes);
    setClient(profile);
    return profile;
  }, []);

  const value = {
    session,
    client,
    loading,
    syncStatus,
    error,
    isAuthenticated: Boolean(session),
    isSupabaseConfigured,
    syncProfile,
    updateProfile,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
