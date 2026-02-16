import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "./supabase";
import { apiRequest, queryClient } from "./queryClient";
import type { User } from "@shared/schema";
import type { Session } from "@supabase/supabase-js";

type SafeUser = Omit<User, "password">;

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setSessionLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    });

    return () => subscription.unsubscribe();
  }, []);

  const { data: user, isLoading: profileLoading } = useQuery<SafeUser | null>({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      if (!session?.access_token) return null;
      const res = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.status === 401) return null;
      if (!res.ok) throw new Error("Failed to fetch user");
      return res.json();
    },
    enabled: !sessionLoading,
    staleTime: Infinity,
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });
      if (error) throw new Error(error.message);
      return authData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
  });

  const signupMutation = useMutation({
    mutationFn: async (data: { email: string; password: string; name: string; role: string }) => {
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: { name: data.name, role: data.role },
        },
      });
      if (error) throw new Error(error.message);

      if (authData.session) {
        await fetch("/api/auth/profile", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authData.session.access_token}`,
          },
          body: JSON.stringify({ name: data.name, role: data.role }),
        });
      }

      return authData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await supabase.auth.signOut();
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/me"], null);
      queryClient.clear();
    },
  });

  const isLoading = sessionLoading || profileLoading;

  return {
    user: user ?? null,
    isLoading,
    isAuthenticated: !!user && !!session,
    session,
    login: loginMutation,
    signup: signupMutation,
    logout: logoutMutation,
  };
}
