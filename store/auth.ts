import { create } from "zustand";

import {
    DEV_ACCOUNT_EMAIL,
    DEV_ACCOUNT_PASSWORD,
} from "@/constants/devAccount";
import type { Role } from "@/constants/roles";
import { api, configureApiAuthProviders } from "@/lib/api/client";
import {
    isFirebaseConfigured,
    signInWithFirebasePassword,
    signOutFirebase,
} from "@/lib/auth/firebase";
import {
    clearSession,
    loadSession,
    saveSession,
    type StoredSession,
} from "@/lib/auth/sessionStorage";
import { getConfig } from "@/lib/config";
import { getJson, setJson } from "@/lib/storage/kv";

type StoredAuthProfile = {
  role: Role;
  userId: string;
  schoolId: string;
  email: string;
  homeAddress: string;
};

const PROFILE_KEY = "securestop.authProfile.v1";

function isSeededDemoCredential(email: string, password: string) {
  return (
    email.trim().toLowerCase() === DEV_ACCOUNT_EMAIL.trim().toLowerCase() &&
    password === DEV_ACCOUNT_PASSWORD
  );
}

type AuthState = {
  isAuthenticated: boolean;
  role: Role;
  userId: string;
  schoolId: string;
  email: string;
  homeAddress: string;
  passwordMock: string;
  accessToken?: string;
  refreshToken?: string;
  idToken?: string;
  expiresAt?: number;
  hydrated: boolean;
  setRole: (role: Role) => void;
  setSchoolId: (schoolId: string) => void;
  setAccount: (
    next: Partial<Pick<AuthState, "email" | "homeAddress" | "passwordMock">>,
  ) => void;
  setSession: (next?: StoredSession) => Promise<void>;
  hydrate: () => Promise<void>;
  signInMock: (
    params?: Partial<
      Pick<AuthState, "role" | "userId" | "schoolId" | "email" | "passwordMock">
    >,
  ) => void;
  signInWithPassword: (params: {
    email: string;
    password: string;
  }) => Promise<void>;
  signInWithOidcToken: (params: StoredSession) => Promise<void>;
  signOut: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  role: "parent",
  userId: "mock-user",
  schoolId: "",
  email: DEV_ACCOUNT_EMAIL,
  homeAddress: "123 Main St",
  passwordMock: DEV_ACCOUNT_PASSWORD,
  accessToken: undefined,
  refreshToken: undefined,
  idToken: undefined,
  expiresAt: undefined,
  hydrated: false,
  setRole: (role) =>
    set((s) => {
      const next = { ...s, role };
      setJson(PROFILE_KEY, {
        role: next.role,
        userId: next.userId,
        schoolId: next.schoolId,
        email: next.email,
        homeAddress: next.homeAddress,
      } satisfies StoredAuthProfile).catch(() => {});
      return next;
    }),
  setSchoolId: (schoolId) =>
    set((s) => {
      const next = { ...s, schoolId };
      setJson(PROFILE_KEY, {
        role: next.role,
        userId: next.userId,
        schoolId: next.schoolId,
        email: next.email,
        homeAddress: next.homeAddress,
      } satisfies StoredAuthProfile).catch(() => {});
      return next;
    }),
  setAccount: (nextPartial) =>
    set((s) => {
      const next = { ...s, ...nextPartial };
      setJson(PROFILE_KEY, {
        role: next.role,
        userId: next.userId,
        schoolId: next.schoolId,
        email: next.email,
        homeAddress: next.homeAddress,
      } satisfies StoredAuthProfile).catch(() => {});
      return next;
    }),
  setSession: async (next) => {
    set({
      accessToken: next?.accessToken,
      refreshToken: next?.refreshToken,
      idToken: next?.idToken,
      expiresAt: next?.expiresAt,
      isAuthenticated: !!next?.accessToken,
    });
    await saveSession(next);
  },
  hydrate: async () => {
    const session = await loadSession();
    const profile = await getJson<StoredAuthProfile>(PROFILE_KEY);
    set({
      accessToken: session?.accessToken,
      refreshToken: session?.refreshToken,
      idToken: session?.idToken,
      expiresAt: session?.expiresAt,
      isAuthenticated: session?.accessToken ? true : false,
      role: profile?.role ?? "parent",
      userId: profile?.userId ?? "mock-user",
      schoolId: profile?.schoolId ?? "",
      email: profile?.email ?? DEV_ACCOUNT_EMAIL,
      homeAddress: profile?.homeAddress ?? "123 Main St",
      passwordMock: DEV_ACCOUNT_PASSWORD,
      hydrated: true,
    });
  },
  signInMock: (params) =>
    set((s) => {
      const next = {
        ...s,
        isAuthenticated: true,
        role: params?.role ?? "parent",
        userId: params?.userId ?? "mock-user",
        schoolId: params?.schoolId ?? s.schoolId,
        email: params?.email ?? DEV_ACCOUNT_EMAIL,
        passwordMock: params?.passwordMock ?? DEV_ACCOUNT_PASSWORD,
      };
      setJson(PROFILE_KEY, {
        role: next.role,
        userId: next.userId,
        schoolId: next.schoolId,
        email: next.email,
        homeAddress: next.homeAddress,
      } satisfies StoredAuthProfile).catch(() => {});
      return next;
    }),
  signInWithPassword: async ({ email, password }) => {
    const cfg = getConfig();
    if (
      cfg.features.enableDemoLogin &&
      isSeededDemoCredential(email, password)
    ) {
      set((s) => {
        const next = {
          ...s,
          isAuthenticated: true,
          role: s.role,
          userId: s.userId,
          schoolId: s.schoolId,
          email: DEV_ACCOUNT_EMAIL,
          passwordMock: DEV_ACCOUNT_PASSWORD,
        };

        setJson(PROFILE_KEY, {
          role: next.role,
          userId: next.userId,
          schoolId: next.schoolId,
          email: next.email,
          homeAddress: next.homeAddress,
        } satisfies StoredAuthProfile).catch(() => {});

        return next;
      });
      return;
    }

    if (isFirebaseConfigured()) {
      const credential = await signInWithFirebasePassword({ email, password });
      const idToken = await credential.user.getIdToken();
      const tokenResult = await credential.user.getIdTokenResult();
      const expirationTime = tokenResult.expirationTime
        ? new Date(tokenResult.expirationTime).getTime()
        : undefined;

      const nextProfile: StoredAuthProfile = {
        role: (tokenResult.claims.role as Role | undefined) ?? "parent",
        userId: credential.user.uid,
        schoolId:
          typeof tokenResult.claims.schoolId === "string"
            ? tokenResult.claims.schoolId
            : "",
        email: credential.user.email ?? email,
        homeAddress:
          typeof tokenResult.claims.homeAddress === "string"
            ? tokenResult.claims.homeAddress
            : "123 Main St",
      };

      await saveSession({
        accessToken: idToken,
        refreshToken: credential.user.refreshToken,
        idToken,
        expiresAt: expirationTime,
      });
      await setJson(PROFILE_KEY, nextProfile);

      set({
        isAuthenticated: true,
        email: nextProfile.email,
        role: nextProfile.role,
        userId: nextProfile.userId,
        schoolId: nextProfile.schoolId,
        homeAddress: nextProfile.homeAddress,
        accessToken: idToken,
        refreshToken: credential.user.refreshToken,
        idToken,
        expiresAt: expirationTime,
      });
      return;
    }

    const apiBaseUrl = cfg.apiBaseUrl.trim();
    if (!apiBaseUrl || apiBaseUrl.includes("example.invalid")) {
      throw new Error(
        "Neither Firebase nor EXPO_PUBLIC_API_BASE_URL is configured. Add Firebase env vars or a backend URL to .env and reload the app.",
      );
    }

    const res = await api.post("/auth/login", { email, password });
    const data = res.data as any;
    const accessToken: string | undefined = data?.accessToken;
    if (!accessToken) throw new Error("Login did not return an access token");

    const expiresAt =
      typeof data?.expiresIn === "number"
        ? Date.now() + data.expiresIn * 1000
        : undefined;
    await saveSession({
      accessToken,
      refreshToken: data?.refreshToken,
      idToken: data?.idToken,
      expiresAt,
    });

    const nextProfile: StoredAuthProfile = {
      role: (data?.role as Role) ?? "parent",
      userId: (data?.userId as string) ?? "mock-user",
      schoolId: (data?.schoolId as string) ?? "",
      email,
      homeAddress: (data?.homeAddress as string) ?? "123 Main St",
    };
    await setJson(PROFILE_KEY, nextProfile);

    set({
      isAuthenticated: true,
      email,
      role: nextProfile.role,
      userId: nextProfile.userId,
      schoolId: nextProfile.schoolId,
      homeAddress: nextProfile.homeAddress,
      accessToken,
      refreshToken: data?.refreshToken,
      idToken: data?.idToken,
      expiresAt,
    });
  },
  signInWithOidcToken: async (session) => {
    await saveSession(session);
    set({
      isAuthenticated: true,
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      idToken: session.idToken,
      expiresAt: session.expiresAt,
    });
  },
  signOut: () => {
    clearSession();
    signOutFirebase().catch(() => {});
    setJson(PROFILE_KEY, undefined).catch(() => {});
    set({
      isAuthenticated: false,
      accessToken: undefined,
      refreshToken: undefined,
      idToken: undefined,
      expiresAt: undefined,
      schoolId: "",
    });
  },
}));

configureApiAuthProviders({
  getAccessToken: () => useAuthStore.getState().accessToken,
  getSchoolId: () => useAuthStore.getState().schoolId,
});
