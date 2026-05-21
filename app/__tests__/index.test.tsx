const mockAuthState = {
  hydrated: true,
  isAuthenticated: true,
  role: "parent",
};

const mockTenantMembershipState = {
  activeTenantId: "tenant-1",
  hydrated: true,
};

jest.mock("expo-router", () => ({
  Redirect: function Redirect() {
    return null;
  },
}));

jest.mock("react-native", () => ({
  Platform: {
    OS: "ios",
  },
}));

jest.mock("@/store/auth", () => ({
  useAuthStore: (selector: (state: typeof mockAuthState) => unknown) =>
    selector(mockAuthState),
}));

jest.mock("@/store/tenantMembership", () => ({
  useTenantMembershipStore: (
    selector: (state: typeof mockTenantMembershipState) => unknown,
  ) => selector(mockTenantMembershipState),
}));

describe("app index routing", () => {
  beforeEach(() => {
    mockAuthState.hydrated = true;
    mockAuthState.isAuthenticated = true;
    mockAuthState.role = "parent";
    mockTenantMembershipState.activeTenantId = "tenant-1";
    mockTenantMembershipState.hydrated = true;
    const { Platform } = require("react-native");
    Platform.OS = "ios";
  });

  function renderIndex() {
    const Index = require("../index").default;
    return Index();
  }

  it("returns null until auth and tenant membership are hydrated", () => {
    mockAuthState.hydrated = false;

    expect(renderIndex()).toBeNull();
  });

  it("redirects unauthenticated users to login", () => {
    mockAuthState.isAuthenticated = false;

    expect(renderIndex()?.props.href).toBe("/login");
  });

  it("redirects admins on web to the dashboard", () => {
    mockAuthState.role = "admin";
    const { Platform } = require("react-native");
    Platform.OS = "web";

    expect(renderIndex()?.props.href).toBe("/(admin)/(web)/dashboard");
  });

  it("redirects admins on native to the fleet tab", () => {
    mockAuthState.role = "admin";

    expect(renderIndex()?.props.href).toBe("/(admin)/(tabs)/fleet");
  });

  it("redirects parents without tenant context to tenant selection", () => {
    mockTenantMembershipState.activeTenantId = "";

    expect(renderIndex()?.props.href).toBe("/select-tenant");
  });

  it("redirects parents with tenant context to the parent map", () => {
    mockAuthState.role = "parent";

    expect(renderIndex()?.props.href).toBe("/(parent)/(tabs)/map");
  });

  it("redirects drivers with tenant context to the driver map", () => {
    mockAuthState.role = "driver";

    expect(renderIndex()?.props.href).toBe("/(driver)/(tabs)/map");
  });
});
