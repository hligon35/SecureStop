const mockClearSession = jest.fn().mockResolvedValue(undefined);
const mockLoadSession = jest.fn();
const mockSaveSession = jest.fn().mockResolvedValue(undefined);
const mockProfileLoad = jest.fn();
const mockProfileClear = jest.fn().mockResolvedValue(undefined);
const mockHydrateIdentityProfile = jest.fn();
const mockPersistIdentityProfile = jest.fn().mockResolvedValue(undefined);
const mockSignOutFirebase = jest.fn().mockResolvedValue(undefined);
const mockConfigureApiAuthProviders = jest.fn();
const mockTenantStore = {
  clear: jest.fn(),
  replaceContext: jest.fn(),
  setActiveTenantId: jest.fn(),
  syncFromAuthProfile: jest.fn(),
};

jest.mock("@/constants/devAccount", () => ({
  DEV_ACCOUNT_EMAIL: "demo@example.com",
  DEV_ACCOUNT_PASSWORD: "demo-password",
}));

jest.mock("@/lib/api/client", () => ({
  api: { post: jest.fn() },
  configureApiAuthProviders: mockConfigureApiAuthProviders,
}));

jest.mock("@/lib/auth/firebase", () => ({
  isFirebaseConfigured: jest.fn(() => false),
  signInWithFirebasePassword: jest.fn(),
  signOutFirebase: mockSignOutFirebase,
}));

jest.mock("@/lib/auth/localProfileRepository", () => ({
  localIdentityProfileRepository: {
    clear: mockProfileClear,
    load: mockProfileLoad,
    save: jest.fn(),
  },
}));

jest.mock("@/lib/auth/oidc", () => ({
  extractOidcIdentityClaims: jest.fn(),
}));

jest.mock("@/lib/auth/profileSync", () => ({
  hydrateIdentityProfile: mockHydrateIdentityProfile,
  persistIdentityProfile: mockPersistIdentityProfile,
}));

jest.mock("@/lib/auth/sessionStorage", () => ({
  clearSession: mockClearSession,
  loadSession: mockLoadSession,
  saveSession: mockSaveSession,
}));

jest.mock("@/lib/config", () => ({
  getConfig: () => ({
    apiBaseUrl: "https://example.test",
    features: { enableDemoLogin: false },
  }),
}));

jest.mock("@/lib/tenancy/context", () => ({
  normalizeTenantId: (value?: string) => value?.trim() ?? "",
}));

jest.mock("@/store/tenantMembership", () => ({
  useTenantMembershipStore: {
    getState: () => mockTenantStore,
  },
}));

const { useAuthStore } =
  require("@/store/auth") as typeof import("@/store/auth");

describe("useAuthStore", () => {
  const initialState = useAuthStore.getState();

  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState(initialState);
    mockClearSession.mockResolvedValue(undefined);
    mockSaveSession.mockResolvedValue(undefined);
    mockProfileClear.mockResolvedValue(undefined);
    mockPersistIdentityProfile.mockResolvedValue(undefined);
    mockSignOutFirebase.mockResolvedValue(undefined);
  });

  it("hydrates auth state from the persisted session and profile", async () => {
    mockLoadSession.mockResolvedValue({
      accessToken: "access-token",
      expiresAt: 1_700_000_000_000,
      refreshToken: "refresh-token",
      userId: "driver-1",
    });
    mockProfileLoad.mockResolvedValue(undefined);
    mockHydrateIdentityProfile.mockResolvedValue({
      membershipContext: undefined,
      profile: {
        email: "driver@example.com",
        homeAddress: "123 Main St",
        role: "driver",
        schoolId: "tenant-1",
        tenantId: "tenant-1",
        userId: "driver-1",
      },
    });

    await useAuthStore.getState().hydrate();

    expect(mockLoadSession).toHaveBeenCalledTimes(1);
    expect(mockProfileLoad).toHaveBeenCalledTimes(1);
    expect(mockHydrateIdentityProfile).toHaveBeenCalledWith({
      session: {
        accessToken: "access-token",
        expiresAt: 1_700_000_000_000,
        refreshToken: "refresh-token",
        userId: "driver-1",
      },
      storedProfile: undefined,
    });
    expect(mockTenantStore.syncFromAuthProfile).toHaveBeenCalledWith({
      role: "driver",
      tenantId: "tenant-1",
    });
    expect(useAuthStore.getState()).toMatchObject({
      accessToken: "access-token",
      email: "driver@example.com",
      expiresAt: 1_700_000_000_000,
      hydrated: true,
      isAuthenticated: true,
      refreshToken: "refresh-token",
      role: "driver",
      schoolId: "tenant-1",
      tenantId: "tenant-1",
      userId: "driver-1",
    });
  });

  it("clears persisted auth state on sign out", () => {
    useAuthStore.setState({
      accessToken: "access-token",
      expiresAt: 1_700_000_000_000,
      idToken: "id-token",
      isAuthenticated: true,
      refreshToken: "refresh-token",
      schoolId: "tenant-1",
      tenantId: "tenant-1",
    });

    useAuthStore.getState().signOut();

    expect(mockClearSession).toHaveBeenCalledTimes(1);
    expect(mockSignOutFirebase).toHaveBeenCalledTimes(1);
    expect(mockTenantStore.clear).toHaveBeenCalledTimes(1);
    expect(mockProfileClear).toHaveBeenCalledTimes(1);
    expect(useAuthStore.getState()).toMatchObject({
      accessToken: undefined,
      expiresAt: undefined,
      idToken: undefined,
      isAuthenticated: false,
      refreshToken: undefined,
      schoolId: "",
      tenantId: "",
    });
  });
});
