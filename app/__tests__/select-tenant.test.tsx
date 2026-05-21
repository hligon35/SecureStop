import * as React from "react";

const renderer = require("react-test-renderer");

const mockReplace = jest.fn();
const mockAuthState = {
  email: "parent@example.com",
  isAuthenticated: true,
  role: "parent",
  setTenantId: jest.fn(),
};
const mockTenantMembershipState = {
  activeTenantId: "tenant-1",
};
const mockConfig = {
  features: { enableDemoLogin: false },
  tenants: [
    { id: "tenant-1", name: "District 1" },
    { id: "tenant-2", name: "District 2" },
  ],
};

jest.mock("expo-router", () => ({
  Redirect: (props: unknown) => {
    const React = require("react");
    return React.createElement("Redirect", props);
  },
  router: {
    replace: mockReplace,
  },
}));

jest.mock("@/components/UpdateDebugBadge", () => ({
  UpdateDebugBadge: () => null,
}));

jest.mock("@/lib/config", () => ({
  getConfig: () => mockConfig,
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

jest.mock("react-native-paper", () => {
  const React = require("react");

  const createComponent = (name: string) => {
    const Component = (props: Record<string, unknown>) =>
      React.createElement(name, props, props.children);
    Component.displayName = name;
    return Component;
  };

  const Card: any = createComponent("Card");
  Card.Content = createComponent("CardContent");

  const RadioButton: any = createComponent("RadioButton");
  RadioButton.Group = createComponent("RadioButtonGroup");

  return {
    Button: createComponent("Button"),
    Card,
    Divider: createComponent("Divider"),
    RadioButton,
    Snackbar: createComponent("Snackbar"),
    Text: createComponent("Text"),
    TextInput: createComponent("TextInput"),
    useTheme: () => ({
      colors: {
        background: "#fff",
        onSurfaceVariant: "#666",
      },
    }),
  };
});

describe("SelectTenantScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthState.email = "parent@example.com";
    mockAuthState.isAuthenticated = true;
    mockAuthState.role = "parent";
    mockTenantMembershipState.activeTenantId = "tenant-1";
    mockConfig.features.enableDemoLogin = false;
    mockConfig.tenants = [
      { id: "tenant-1", name: "District 1" },
      { id: "tenant-2", name: "District 2" },
    ];
  });

  function renderScreen() {
    const SelectTenantScreen = require("../select-tenant").default;
    return renderer.create(<SelectTenantScreen />);
  }

  it("redirects admins away from tenant selection", async () => {
    mockAuthState.role = "admin";

    let root: any;

    await renderer.act(async () => {
      root = renderScreen();
    });

    expect(root!.root.findByType("Redirect").props.href).toBe("/");

    await renderer.act(async () => {
      root!.unmount();
    });
  });

  it("saves a normalized custom tenant id and continues", async () => {
    let root: any;

    await renderer.act(async () => {
      root = renderScreen();
    });

    const buttons = root!.root.findAllByType("Button");

    await renderer.act(async () => {
      buttons[1].props.onPress();
    });

    const textInput = root!.root.findByType("TextInput");

    await renderer.act(async () => {
      textInput.props.onChangeText(" district-123 ");
    });

    const continueButton = root!.root.findAllByType("Button")[2];

    await renderer.act(async () => {
      continueButton.props.onPress();
    });

    expect(mockAuthState.setTenantId).toHaveBeenCalledWith("district-123");
    expect(mockReplace).toHaveBeenCalledWith("/");

    await renderer.act(async () => {
      root!.unmount();
    });
  });
});
