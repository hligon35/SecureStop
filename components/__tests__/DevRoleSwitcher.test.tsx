import * as React from "react";

const renderer = require("react-test-renderer");

const mockReplace = jest.fn();
const mockSetRole = jest.fn();
const mockSetVehicleLocation = jest.fn();
const mockSetDemoFleetOverride = jest.fn();
const mockCheckForUpdateAsync = jest.fn();
const mockFetchUpdateAsync = jest.fn();
const mockReloadAsync = jest.fn();

const mockAuthState = {
  role: "admin",
  email: "admin@example.com",
  isAuthenticated: true,
  setRole: mockSetRole,
};

const mockLocationState = {
  demoFleetOverride: false as boolean | undefined,
  setVehicleLocation: mockSetVehicleLocation,
  setDemoFleetOverride: mockSetDemoFleetOverride,
};

const mockConfig = {
  features: { enableDemoLogin: false },
};

const originalDemoFleetFlag = process.env.EXPO_PUBLIC_DEMO_FLEET;
const testGlobal = globalThis as typeof globalThis & { __DEV__?: boolean };

jest.mock("expo-location", () => ({
  Accuracy: { Balanced: 1 },
  getCurrentPositionAsync: jest.fn(),
  requestForegroundPermissionsAsync: jest.fn(),
}));

jest.mock("expo-updates", () => ({
  checkForUpdateAsync: mockCheckForUpdateAsync,
  fetchUpdateAsync: mockFetchUpdateAsync,
  isEnabled: true,
  reloadAsync: mockReloadAsync,
}));

jest.mock("expo-router", () => ({
  usePathname: () => "/dashboard",
  useRouter: () => ({ replace: mockReplace }),
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

jest.mock("@/lib/config", () => ({
  getConfig: () => mockConfig,
}));

jest.mock("@/store/auth", () => ({
  useAuthStore: (selector: (state: typeof mockAuthState) => unknown) =>
    selector(mockAuthState),
}));

jest.mock("@/store/location", () => ({
  useLocationStore: (selector: (state: typeof mockLocationState) => unknown) =>
    selector(mockLocationState),
}));

jest.mock("react-native-paper", () => {
  const React = require("react");

  const createComponent = (name: string) => {
    const Component = (props: Record<string, unknown>) =>
      React.createElement(name, props, props.children);
    Component.displayName = name;
    return Component;
  };

  const Menu = (props: Record<string, unknown>) =>
    React.createElement("Menu", props, props.anchor, props.children);
  Menu.displayName = "Menu";
  Menu.Item = createComponent("MenuItem");

  return {
    IconButton: createComponent("IconButton"),
    Menu,
    useTheme: () => ({
      colors: {
        surfaceVariant: "#eee",
      },
    }),
  };
});

describe("DevRoleSwitcher", () => {
  beforeAll(() => {
    delete process.env.EXPO_PUBLIC_DEMO_FLEET;
  });

  afterAll(() => {
    if (originalDemoFleetFlag == null) {
      delete process.env.EXPO_PUBLIC_DEMO_FLEET;
      return;
    }

    process.env.EXPO_PUBLIC_DEMO_FLEET = originalDemoFleetFlag;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.EXPO_PUBLIC_DEMO_FLEET;
    mockAuthState.role = "admin";
    mockAuthState.email = "admin@example.com";
    mockAuthState.isAuthenticated = true;
    mockLocationState.demoFleetOverride = false;
    mockConfig.features.enableDemoLogin = false;
    mockCheckForUpdateAsync.mockResolvedValue({ isAvailable: false });
    mockFetchUpdateAsync.mockResolvedValue({ isNew: true });
    mockReloadAsync.mockResolvedValue(undefined);
    testGlobal.__DEV__ = false;
  });

  function renderSwitcher() {
    const { DevRoleSwitcher } = require("../DevRoleSwitcher");
    return renderer.create(<DevRoleSwitcher variant="header" />);
  }

  it("toggles the menu open and closed from the anchor", async () => {
    let root: any;

    await renderer.act(async () => {
      root = renderSwitcher();
    });

    const button = root.root.findByType("IconButton");

    await renderer.act(async () => {
      button.props.onPress();
    });

    expect(root.root.findByType("Menu").props.visible).toBe(true);

    await renderer.act(async () => {
      button.props.onPress();
    });

    expect(root.root.findByType("Menu").props.visible).toBe(false);

    await renderer.act(async () => {
      button.props.onPress();
    });

    expect(root.root.findByType("Menu").props.visible).toBe(true);

    await renderer.act(async () => {
      root.root.findByType("Menu").props.onDismiss();
    });

    expect(root.root.findByType("Menu").props.visible).toBe(false);

    await renderer.act(async () => {
      button.props.onPress();
    });

    expect(root.root.findByType("Menu").props.visible).toBe(true);

    await renderer.act(async () => {
      root.unmount();
    });
  });

  it("reopens cleanly after toggling demo mode", async () => {
    let root: any;

    await renderer.act(async () => {
      root = renderSwitcher();
    });

    const button = root.root.findByType("IconButton");

    await renderer.act(async () => {
      button.props.onPress();
    });

    const demoToggle = root.root
      .findAllByType("MenuItem")
      .find((node: any) => String(node.props.title).startsWith("Fleet demo:"));

    expect(demoToggle).toBeTruthy();

    await renderer.act(async () => {
      demoToggle.props.onPress();
    });

    expect(mockSetDemoFleetOverride).toHaveBeenCalledWith(true);
    expect(root.root.findByType("Menu").props.visible).toBe(false);

    await renderer.act(async () => {
      button.props.onPress();
    });

    expect(root.root.findByType("Menu").props.visible).toBe(true);

    await renderer.act(async () => {
      root.unmount();
    });
  });

  it("shows the toggle as locked when the environment flag is set", async () => {
    process.env.EXPO_PUBLIC_DEMO_FLEET = "true";

    let root: any;

    await renderer.act(async () => {
      root = renderSwitcher();
    });

    const button = root.root.findByType("IconButton");

    await renderer.act(async () => {
      button.props.onPress();
    });

    const demoToggle = root.root
      .findAllByType("MenuItem")
      .find((node: any) => String(node.props.title).startsWith("Fleet demo:"));

    expect(demoToggle.props.title).toContain("locked by env");
    expect(demoToggle.props.disabled).toBe(true);

    await renderer.act(async () => {
      demoToggle.props.onPress();
    });

    expect(mockSetDemoFleetOverride).not.toHaveBeenCalled();

    await renderer.act(async () => {
      root.unmount();
    });
  });

  it("pulls an OTA update and reloads when one is available", async () => {
    mockCheckForUpdateAsync.mockResolvedValue({ isAvailable: true });

    let root: any;

    await renderer.act(async () => {
      root = renderSwitcher();
    });

    const button = root.root.findByType("IconButton");

    await renderer.act(async () => {
      button.props.onPress();
    });

    const otaAction = root.root
      .findAllByType("MenuItem")
      .find((node: any) =>
        String(node.props.title).startsWith("Pull OTA update"),
      );

    await renderer.act(async () => {
      await otaAction.props.onPress();
    });

    expect(mockCheckForUpdateAsync).toHaveBeenCalledTimes(1);
    expect(mockFetchUpdateAsync).toHaveBeenCalledTimes(1);
    expect(mockReloadAsync).toHaveBeenCalledTimes(1);

    await renderer.act(async () => {
      root.unmount();
    });
  });

  it("shows when no OTA update is available", async () => {
    mockCheckForUpdateAsync.mockResolvedValue({ isAvailable: false });

    let root: any;

    await renderer.act(async () => {
      root = renderSwitcher();
    });

    const button = root.root.findByType("IconButton");

    await renderer.act(async () => {
      button.props.onPress();
    });

    const otaAction = root.root
      .findAllByType("MenuItem")
      .find((node: any) =>
        String(node.props.title).startsWith("Pull OTA update"),
      );

    await renderer.act(async () => {
      await otaAction.props.onPress();
    });

    const refreshedOtaAction = root.root
      .findAllByType("MenuItem")
      .find((node: any) =>
        String(node.props.title).startsWith("Pull OTA update"),
      );

    expect(mockFetchUpdateAsync).not.toHaveBeenCalled();
    expect(mockReloadAsync).not.toHaveBeenCalled();
    expect(refreshedOtaAction.props.title).toContain("no update found");

    await renderer.act(async () => {
      root.unmount();
    });
  });
});
