import { create } from "zustand";

import {
    DEV_ACCOUNT_EMAIL,
    DEV_ACCOUNT_PASSWORD,
} from "@/constants/devAccount";
import type { Role } from "@/constants/roles";
import type { AuthLoginRequest, AuthLoginResponse } from "@/core/api/contracts";
import type { IdentityProfile } from "@/core/identity/types";
import { api, configureApiAuthProviders } from "@/lib/api/client";
import {
    deleteFirebaseAccount,
    isFirebaseConfigured,
    signInWithFirebasePassword,
    signOutFirebase,
} from "@/lib/auth/firebase";
import { localIdentityProfileRepository } from "@/lib/auth/localProfileRepository";
import { extractOidcIdentityClaims } from "@/lib/auth/oidc";
import {
    hydrateIdentityProfile,
    persistIdentityProfile,
} from "@/lib/auth/profileSync";
import {
    clearSession,
    loadSession,
    saveSession,
    type StoredSession,
} from "@/lib/auth/sessionStorage";
import { getConfig } from "@/lib/config";
import { normalizeTenantId } from "@/lib/tenancy/context";
import { useTenantMembershipStore } from "@/store/tenantMembership";

function isSeededDemoCredential(email: string, password: string) {
  return (
    email.trim().toLowerCase() === DEV_ACCOUNT_EMAIL.trim().toLowerCase() &&
    password === DEV_ACCOUNT_PASSWORD
  );
}

function isSeededDemoEmail(email: string) {
  return email.trim().toLowerCase() === DEV_ACCOUNT_EMAIL.trim().toLowerCase();
}

function normalizeIdentityProfile(profile?: IdentityProfile) {
  if (!profile) return profile;
  const tenantId = normalizeTenantId(profile.tenantId ?? profile.schoolId);
  if (!isSeededDemoEmail(profile.email)) return profile;

  return {
    ...profile,
    tenantId,
    role: "admin" as const,
    schoolId: tenantId || "mock-school",
  } satisfies IdentityProfile;
}

function getHydratedProfile(
  session: StoredSession | undefined,
  profile: IdentityProfile | undefined,
) {
  if (profile) return profile;

  if (!session?.accessToken) return profile;
  if (!getConfig().features.enableDemoLogin) return profile;

  return {
    role: "admin" as const,
    userId: "mock-user",
    tenantId: "mock-school",
    schoolId: "mock-school",
    email: DEV_ACCOUNT_EMAIL,
    homeAddress: "123 Main St",
  } satisfies IdentityProfile;
}

function toIdentityProfile(params: {
  role: Role;
  userId: string;
  tenantId?: string;
  schoolId?: string;
  email: string;
  homeAddress: string;
}) {
  const tenantId = normalizeTenantId(params.tenantId ?? params.schoolId);

  return {
    role: params.role,
    userId: params.userId,
    tenantId: tenantId || undefined,
    schoolId: tenantId,
    email: params.email,
    homeAddress: params.homeAddress,
  } satisfies IdentityProfile;
}

function syncTenantMembershipFromAuth(params: {
  tenantId?: string;
  role: Role;
}) {
  useTenantMembershipStore.getState().syncFromAuthProfile({
    tenantId: params.tenantId,
    role: params.role,
  });
}

function toFirebaseSignInErrorMessage(error: unknown) {
  const code =
    typeof error === "object" && error && "code" in error
      ? String((error as { code?: unknown }).code ?? "")
      : "";

  if (code === "auth/configuration-not-found") {
    return "Firebase email/password sign-in is not enabled for this project yet. Enable Email/Password in Firebase Authentication, or use the seeded demo credentials.";
  }

  return error;
}

type AuthState = {
  isAuthenticated: boolean;
  role: Role;
  userId: string;
  tenantId: string;
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
  setTenantId: (tenantId: string) => void;
  setSchoolId: (schoolId: string) => void;
  setAccount: (
    next: Partial<Pick<AuthState, "email" | "homeAddress" | "passwordMock">>,
  ) => void;
  setSession: (next?: StoredSession) => Promise<void>;
  hydrate: () => Promise<void>;
  signInMock: (
    params?: Partial<
      Pick<
        AuthState,
        "role" | "userId" | "tenantId" | "schoolId" | "email" | "passwordMock"
      >
    >,
  ) => void;
  signInWithPassword: (params: {
    email: string;
    password: string;
  }) => Promise<void>;
  signInWithOidcToken: (params: StoredSession) => Promise<void>;
  deleteAccount: () => Promise<{ deletedRemotely: boolean }>;
  signOut: () => void;
};

function clearLocalAuthArtifacts() {
  clearSession();
  signOutFirebase().catch(() => {});
  useTenantMembershipStore.getState().clear();
  localIdentityProfileRepository.clear().catch(() => {});
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  role: "parent",
  userId: "mock-user",
  tenantId: "",
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
      persistIdentityProfile(toIdentityProfile(next)).catch(() => {});
      return next;
    }),
  setTenantId: (tenantId) =>
    set((s) => {
      const normalizedTenantId = normalizeTenantId(tenantId);
      useTenantMembershipStore.getState().setActiveTenantId(normalizedTenantId);
      const next = {
        ...s,
        tenantId: normalizedTenantId,
        schoolId: normalizedTenantId,
      };
      persistIdentityProfile(toIdentityProfile(next)).catch(() => {});
      return next;
    }),
  setSchoolId: (schoolId) =>
    set((s) => {
      const normalizedTenantId = normalizeTenantId(schoolId);
      useTenantMembershipStore.getState().setActiveTenantId(normalizedTenantId);
      const next = {
        ...s,
        tenantId: normalizedTenantId,
        schoolId: normalizedTenantId,
      };
      persistIdentityProfile(toIdentityProfile(next)).catch(() => {});
      return next;
    }),
  setAccount: (nextPartial) =>
    set((s) => {
      const next = { ...s, ...nextPartial };
      persistIdentityProfile(toIdentityProfile(next)).catch(() => {});
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
    const storedProfile = normalizeIdentityProfile(
      await localIdentityProfileRepository.load(),
    );
    const hydratedIdentity = await hydrateIdentityProfile({
      session,
      storedProfile,
    });
    const profile = getHydratedProfile(
      session,
      normalizeIdentityProfile(hydratedIdentity.profile),
    );

    if (
      profile &&
      JSON.stringify(profile) !== JSON.stringify(hydratedIdentity.profile)
    ) {
      await localIdentityProfileRepository.save(profile);
    }

    if (!hydratedIdentity.membershipContext) {
      syncTenantMembershipFromAuth({
        tenantId: profile?.tenantId ?? profile?.schoolId,
        role: profile?.role ?? "parent",
      });
    }

    set({
      accessToken: session?.accessToken,
      refreshToken: session?.refreshToken,
      idToken: session?.idToken,
      expiresAt: session?.expiresAt,
      isAuthenticated: session?.accessToken ? true : false,
      role: profile?.role ?? "parent",
      userId: profile?.userId ?? "mock-user",
      tenantId: normalizeTenantId(profile?.tenantId ?? profile?.schoolId),
      schoolId: normalizeTenantId(profile?.schoolId ?? profile?.tenantId),
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
        tenantId:
          normalizeTenantId(params?.tenantId ?? params?.schoolId) || s.tenantId,
        schoolId:
          normalizeTenantId(params?.tenantId ?? params?.schoolId) || s.schoolId,
        email: params?.email ?? DEV_ACCOUNT_EMAIL,
        passwordMock: params?.passwordMock ?? DEV_ACCOUNT_PASSWORD,
      };
      syncTenantMembershipFromAuth({
        tenantId: next.tenantId,
        role: next.role,
      });
      persistIdentityProfile(toIdentityProfile(next)).catch(() => {});
      return next;
    }),
  signInWithPassword: async ({ email, password }) => {
    const cfg = getConfig();
    if (isSeededDemoCredential(email, password)) {
      set((s) => {
        const next = {
          ...s,
          isAuthenticated: true,
          role: "admin" as const,
          userId: s.userId,
          tenantId: s.tenantId || "mock-school",
          schoolId: s.tenantId || s.schoolId || "mock-school",
          email: DEV_ACCOUNT_EMAIL,
          passwordMock: DEV_ACCOUNT_PASSWORD,
        };

        syncTenantMembershipFromAuth({
          tenantId: next.tenantId,
          role: next.role,
        });

        persistIdentityProfile(toIdentityProfile(next)).catch(() => {});

        return next;
      });
      return;
    }

    if (isFirebaseConfigured()) {
      try {
        const credential = await signInWithFirebasePassword({
          email,
          password,
        });
        const idToken = await credential.user.getIdToken();
        const tokenResult = await credential.user.getIdTokenResult();
        const expirationTime = tokenResult.expirationTime
          ? new Date(tokenResult.expirationTime).getTime()
          : undefined;
        const seededDemoUser = isSeededDemoEmail(
          credential.user.email ?? email,
        );

        const nextProfile: IdentityProfile = {
          role: seededDemoUser
            ? "admin"
            : ((tokenResult.claims.role as Role | undefined) ?? "parent"),
          userId: credential.user.uid,
          tenantId: seededDemoUser
            ? typeof tokenResult.claims.schoolId === "string" &&
              tokenResult.claims.schoolId.trim().length > 0
              ? tokenResult.claims.schoolId
              : "mock-school"
            : typeof tokenResult.claims.schoolId === "string"
              ? tokenResult.claims.schoolId
              : "",
          schoolId: seededDemoUser
            ? typeof tokenResult.claims.schoolId === "string" &&
              tokenResult.claims.schoolId.trim().length > 0
              ? tokenResult.claims.schoolId
              : "mock-school"
            : typeof tokenResult.claims.schoolId === "string"
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
          userId: credential.user.uid,
          refreshToken: credential.user.refreshToken,
          idToken,
          expiresAt: expirationTime,
        });
        await persistIdentityProfile(nextProfile);
        syncTenantMembershipFromAuth({
          tenantId: nextProfile.tenantId ?? nextProfile.schoolId,
          role: nextProfile.role,
        });

        set({
          isAuthenticated: true,
          email: nextProfile.email,
          role: nextProfile.role,
          userId: nextProfile.userId,
          tenantId: normalizeTenantId(
            nextProfile.tenantId ?? nextProfile.schoolId,
          ),
          schoolId: nextProfile.schoolId,
          homeAddress: nextProfile.homeAddress,
          accessToken: idToken,
          refreshToken: credential.user.refreshToken,
          idToken,
          expiresAt: expirationTime,
        });
        return;
      } catch (error) {
        throw toFirebaseSignInErrorMessage(error);
      }
    }

    const apiBaseUrl = cfg.apiBaseUrl.trim();
    if (!apiBaseUrl || apiBaseUrl.includes("example.invalid")) {
      throw new Error(
        "Neither Firebase nor EXPO_PUBLIC_API_BASE_URL is configured. Add Firebase env vars or a backend URL to .env and reload the app.",
      );
    }

    const payload: AuthLoginRequest = { email, password };
    const res = await api.post<AuthLoginResponse>("/auth/login", payload);
    const data = res.data;
    const accessToken: string | undefined = data?.accessToken;
    if (!accessToken) throw new Error("Login did not return an access token");

    const expiresAt =
      typeof data?.expiresIn === "number"
        ? Date.now() + data.expiresIn * 1000
        : undefined;
    await saveSession({
      accessToken,
      userId: (data?.userId as string | undefined) ?? "mock-user",
      refreshToken: data?.refreshToken,
      idToken: data?.idToken,
      expiresAt,
    });

    const nextProfile = toIdentityProfile({
      role: (data?.role as Role) ?? "parent",
      userId: (data?.userId as string) ?? "mock-user",
      tenantId: (data?.tenantId as string | undefined) ?? data?.schoolId,
      schoolId: (data?.schoolId as string | undefined) ?? data?.tenantId,
      email,
      homeAddress: (data?.homeAddress as string) ?? "123 Main St",
    });
    await persistIdentityProfile(nextProfile);
    syncTenantMembershipFromAuth({
      tenantId: nextProfile.tenantId ?? nextProfile.schoolId,
      role: nextProfile.role,
    });

    set({
      isAuthenticated: true,
      email,
      role: nextProfile.role,
      userId: nextProfile.userId,
      tenantId: normalizeTenantId(nextProfile.tenantId ?? nextProfile.schoolId),
      schoolId: nextProfile.schoolId,
      homeAddress: nextProfile.homeAddress,
      accessToken,
      refreshToken: data?.refreshToken,
      idToken: data?.idToken,
      expiresAt,
    });
  },
  signInWithOidcToken: async (session) => {
    const existingProfile = normalizeIdentityProfile(
      await localIdentityProfileRepository.load(),
    );
    const claims = extractOidcIdentityClaims({
      idToken: session.idToken,
      accessToken: session.accessToken,
    });
    const nextSession = {
      ...session,
      userId: session.userId ?? claims?.userId ?? existingProfile?.userId,
    } satisfies StoredSession;

    const seededProfile = claims?.userId
      ? toIdentityProfile({
          role: claims.role ?? existingProfile?.role ?? "parent",
          userId: claims.userId,
          tenantId:
            claims.tenantId ??
            claims.schoolId ??
            existingProfile?.tenantId ??
            existingProfile?.schoolId,
          schoolId:
            claims.schoolId ??
            claims.tenantId ??
            existingProfile?.schoolId ??
            existingProfile?.tenantId,
          email: claims.email ?? existingProfile?.email ?? DEV_ACCOUNT_EMAIL,
          homeAddress:
            claims.homeAddress ?? existingProfile?.homeAddress ?? "123 Main St",
        })
      : existingProfile;

    await saveSession(nextSession);

    if (
      seededProfile &&
      JSON.stringify(seededProfile) !== JSON.stringify(existingProfile)
    ) {
      await persistIdentityProfile(seededProfile);
    }

    const hydratedIdentity = await hydrateIdentityProfile({
      session: nextSession,
      storedProfile: seededProfile,
    });
    const profile = normalizeIdentityProfile(hydratedIdentity.profile);

    if (!hydratedIdentity.membershipContext && profile) {
      syncTenantMembershipFromAuth({
        tenantId: profile.tenantId ?? profile.schoolId,
        role: profile.role,
      });
    }

    set({
      isAuthenticated: true,
      role: profile?.role ?? "parent",
      userId: profile?.userId ?? nextSession.userId ?? "mock-user",
      tenantId: normalizeTenantId(profile?.tenantId ?? profile?.schoolId),
      schoolId: normalizeTenantId(profile?.schoolId ?? profile?.tenantId),
      email: profile?.email ?? existingProfile?.email ?? DEV_ACCOUNT_EMAIL,
      homeAddress:
        profile?.homeAddress ?? existingProfile?.homeAddress ?? "123 Main St",
      accessToken: nextSession.accessToken,
      refreshToken: nextSession.refreshToken,
      idToken: nextSession.idToken,
      expiresAt: nextSession.expiresAt,
    });
  },
  deleteAccount: async () => {
    const state = useAuthStore.getState();
    const seededDemoAccount = isSeededDemoEmail(state.email);

    if (isFirebaseConfigured()) {
      const deletedRemotely = await deleteFirebaseAccount();
      clearLocalAuthArtifacts();
      set({
        isAuthenticated: false,
        accessToken: undefined,
        refreshToken: undefined,
        idToken: undefined,
        expiresAt: undefined,
        tenantId: "",
        schoolId: "",
      });
      return { deletedRemotely };
    }

    if (seededDemoAccount || !state.accessToken) {
      clearLocalAuthArtifacts();
      set({
        isAuthenticated: false,
        accessToken: undefined,
        refreshToken: undefined,
        idToken: undefined,
        expiresAt: undefined,
        tenantId: "",
        schoolId: "",
      });
      return { deletedRemotely: false };
    }

    throw new Error(
      "Account deletion is not connected for this sign-in provider yet. Contact an administrator or use the backend account management flow.",
    );
  },
  signOut: () => {
    clearLocalAuthArtifacts();
    set({
      isAuthenticated: false,
      accessToken: undefined,
      refreshToken: undefined,
      idToken: undefined,
      expiresAt: undefined,
      tenantId: "",
      schoolId: "",
    });
  },
}));

configureApiAuthProviders({
  getAccessToken: () => useAuthStore.getState().accessToken,
  getTenantId: () => useAuthStore.getState().tenantId,
  getSchoolId: () => useAuthStore.getState().schoolId,
});
