const mockClearSession = jest.fn().mockResolvedValue(undefined);
const mockLoadSession = jest.fn();
const mockSaveSession = jest.fn().mockResolvedValue(undefined);
const mockApiPost = jest.fn();
const mockProfileLoad = jest.fn();
const mockProfileClear = jest.fn().mockResolvedValue(undefined);
const mockHydrateIdentityProfile = jest.fn();
const mockPersistIdentityProfile = jest.fn().mockResolvedValue(undefined);
const mockExtractOidcIdentityClaims = jest.fn();
const mockSignOutFirebase = jest.fn().mockResolvedValue(undefined);
const mockConfigureApiAuthProviders = jest.fn();
const mockConfig = {
  apiBaseUrl: "https://example.test",
  features: { enableDemoLogin: false },
};
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
  api: { post: mockApiPost },
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
  extractOidcIdentityClaims: mockExtractOidcIdentityClaims,
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
  getConfig: () => mockConfig,
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
    mockConfig.apiBaseUrl = "https://example.test";
    mockConfig.features.enableDemoLogin = false;
    mockApiPost.mockReset();
    mockClearSession.mockResolvedValue(undefined);
    mockLoadSession.mockResolvedValue(undefined);
    mockSaveSession.mockResolvedValue(undefined);
    mockProfileLoad.mockResolvedValue(undefined);
    mockProfileClear.mockResolvedValue(undefined);
    mockHydrateIdentityProfile.mockResolvedValue({
      membershipContext: undefined,
      profile: undefined,
    });
    mockPersistIdentityProfile.mockResolvedValue(undefined);
    mockExtractOidcIdentityClaims.mockReturnValue(undefined);
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

  it("persists API password sign-in state and membership", async () => {
    const nowSpy = jest.spyOn(Date, "now").mockReturnValue(1_700_000_000_000);
    mockApiPost.mockResolvedValue({
      data: {
        accessToken: "api-access-token",
        expiresIn: 300,
        homeAddress: "456 Oak Ave",
        idToken: "api-id-token",
        refreshToken: "api-refresh-token",
        role: "driver",
        tenantId: "tenant-42",
        userId: "driver-42",
      },
    });

    await useAuthStore.getState().signInWithPassword({
      email: "driver@example.com",
      password: "correct-horse",
    });

    expect(mockApiPost).toHaveBeenCalledWith("/auth/login", {
      email: "driver@example.com",
      password: "correct-horse",
    });
    expect(mockSaveSession).toHaveBeenCalledWith({
      accessToken: "api-access-token",
      expiresAt: 1_700_000_300_000,
      idToken: "api-id-token",
      refreshToken: "api-refresh-token",
      userId: "driver-42",
    });
    expect(mockPersistIdentityProfile).toHaveBeenCalledWith({
      email: "driver@example.com",
      homeAddress: "456 Oak Ave",
      role: "driver",
      schoolId: "tenant-42",
      tenantId: "tenant-42",
      userId: "driver-42",
    });
    expect(mockTenantStore.syncFromAuthProfile).toHaveBeenCalledWith({
      role: "driver",
      tenantId: "tenant-42",
    });
    expect(useAuthStore.getState()).toMatchObject({
      accessToken: "api-access-token",
      email: "driver@example.com",
      expiresAt: 1_700_000_300_000,
      homeAddress: "456 Oak Ave",
      idToken: "api-id-token",
      isAuthenticated: true,
      refreshToken: "api-refresh-token",
      role: "driver",
      schoolId: "tenant-42",
      tenantId: "tenant-42",
      userId: "driver-42",
    });

    nowSpy.mockRestore();
  });

  it("fails fast when neither Firebase nor a real API base URL is configured", async () => {
    mockConfig.apiBaseUrl = "https://example.invalid";

    await expect(
      useAuthStore.getState().signInWithPassword({
        email: "parent@example.com",
        password: "password123",
      }),
    ).rejects.toThrow(
      "Neither Firebase nor EXPO_PUBLIC_API_BASE_URL is configured. Add Firebase env vars or a backend URL to .env and reload the app.",
    );

    expect(mockApiPost).not.toHaveBeenCalled();
    expect(mockSaveSession).not.toHaveBeenCalled();
  });

  it("hydrates OIDC sign-in using claims and synced profile data", async () => {
    mockProfileLoad.mockResolvedValue({
      email: "stored@example.com",
      homeAddress: "Stored Home",
      role: "parent",
      schoolId: "stored-school",
      tenantId: "stored-school",
      userId: "stored-user",
    });
    mockExtractOidcIdentityClaims.mockReturnValue({
      email: "admin@example.com",
      homeAddress: "500 Fleet St",
      role: "admin",
      schoolId: "district-7",
      userId: "oidc-user",
    });
    mockHydrateIdentityProfile.mockResolvedValue({
      membershipContext: undefined,
      profile: {
        email: "admin@example.com",
        homeAddress: "500 Fleet St",
        role: "admin",
        schoolId: "district-7",
        tenantId: "district-7",
        userId: "oidc-user",
      },
    });

    await useAuthStore.getState().signInWithOidcToken({
      accessToken: "oidc-access-token",
      expiresAt: 1_700_000_060_000,
      idToken: "oidc-id-token",
      refreshToken: "oidc-refresh-token",
    });

    expect(mockSaveSession).toHaveBeenCalledWith({
      accessToken: "oidc-access-token",
      expiresAt: 1_700_000_060_000,
      idToken: "oidc-id-token",
      refreshToken: "oidc-refresh-token",
      userId: "oidc-user",
    });
    expect(mockPersistIdentityProfile).toHaveBeenCalledWith({
      email: "admin@example.com",
      homeAddress: "500 Fleet St",
      role: "admin",
      schoolId: "district-7",
      tenantId: "district-7",
      userId: "oidc-user",
    });
    expect(mockHydrateIdentityProfile).toHaveBeenCalledWith({
      session: {
        accessToken: "oidc-access-token",
        expiresAt: 1_700_000_060_000,
        idToken: "oidc-id-token",
        refreshToken: "oidc-refresh-token",
        userId: "oidc-user",
      },
      storedProfile: {
        email: "admin@example.com",
        homeAddress: "500 Fleet St",
        role: "admin",
        schoolId: "district-7",
        tenantId: "district-7",
        userId: "oidc-user",
      },
    });
    expect(mockTenantStore.syncFromAuthProfile).toHaveBeenCalledWith({
      role: "admin",
      tenantId: "district-7",
    });
    expect(useAuthStore.getState()).toMatchObject({
      accessToken: "oidc-access-token",
      email: "admin@example.com",
      expiresAt: 1_700_000_060_000,
      homeAddress: "500 Fleet St",
      idToken: "oidc-id-token",
      isAuthenticated: true,
      refreshToken: "oidc-refresh-token",
      role: "admin",
      schoolId: "district-7",
      tenantId: "district-7",
      userId: "oidc-user",
    });
  });
});
