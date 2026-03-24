"use client";

import { create } from "zustand";
import type { Profile } from "@/types/auth";

interface AuthStore {
  profile: Profile | null;
  loading: boolean;
  setProfile: (profile: Profile | null) => void;
  setLoading: (loading: boolean) => void;
  isGovernanca: () => boolean;
  canAccessDepartment: (dept: string) => boolean;
  clear: () => void;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  profile: null,
  loading: true,

  setProfile: (profile) => set({ profile }),
  setLoading: (loading) => set({ loading }),

  isGovernanca: () => get().profile?.role === "governanca",

  canAccessDepartment: (dept) => {
    const profile = get().profile;
    if (!profile) return false;
    if (profile.role === "governanca") return true;
    return profile.department === dept;
  },

  clear: () => set({ profile: null, loading: false }),
}));
