import * as Location from "expo-location";
import { usePathname, useRouter } from "expo-router";
import * as Updates from "expo-updates";
import { useCallback, useEffect, useRef, useState } from "react";
import { Platform, View } from "react-native";
import { IconButton, Menu, useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { DEV_ACCOUNT_EMAIL } from "@/constants/devAccount";
import type { Role } from "@/constants/roles";
import { ROLE_LABEL, ROLES } from "@/constants/roles";
import { roleRootPath } from "@/constants/routes";
import { getConfig } from "@/lib/config";
import {
    formatDemoFleetMenuTitle,
    resolveDemoFleetMode,
} from "@/lib/location/demoFleet";
import { useAuthStore } from "@/store/auth";
import { useLocationStore } from "@/store/location";

const DEV_SWITCHER_ROLES = Object.values(ROLES) as Role[];

export function DevRoleSwitcher(props?: { variant?: "floating" | "header" }) {
  const cfg = getConfig();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const router = useRouter();
  const pathname = usePathname();

  const role = useAuthStore((s) => s.role);
  const email = useAuthStore((s) => s.email);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setRole = useAuthStore((s) => s.setRole);

  const setVehicleLocation = useLocationStore((s) => s.setVehicleLocation);
  const demoFleetOverride = useLocationStore((s) => s.demoFleetOverride);
  const setDemoFleetOverride = useLocationStore((s) => s.setDemoFleetOverride);

  const [open, setOpen] = useState(false);
  const [gpsBusy, setGpsBusy] = useState(false);
  const [otaBusy, setOtaBusy] = useState(false);
  const [otaStatus, setOtaStatus] = useState<
    "idle" | "checking" | "downloading" | "none" | "error"
  >("idle");
  const suppressNextDismissRef = useRef(false);

  const devEnabled = typeof __DEV__ !== "undefined" ? __DEV__ : false;
  const demoFleetFlag = process.env.EXPO_PUBLIC_DEMO_FLEET;
  const seededDemoAccess =
    isAuthenticated &&
    email.trim().toLowerCase() === DEV_ACCOUNT_EMAIL.trim().toLowerCase();
  const demoAccessEnabled =
    devEnabled ||
    cfg.features.enableDemoLogin ||
    role === "admin" ||
    seededDemoAccess;
  const demoFleetMode = resolveDemoFleetMode({
    envFlag: demoFleetFlag,
    override: demoFleetOverride,
  });
  const demoModeEnabled = demoFleetMode.enabled;
  const otaSupported =
    Platform.OS !== "web" && !devEnabled && Updates.isEnabled;

  if (!demoAccessEnabled) return null;

  const variant = props?.variant ?? "floating";

  // Ensure the menu never gets "stuck" across route transitions.
  useEffect(() => {
    setOpen(false);
    suppressNextDismissRef.current = false;
  }, [pathname]);

  const closeMenu = useCallback(() => {
    suppressNextDismissRef.current = true;
    setOpen(false);
  }, []);

  const handleDismiss = useCallback(() => {
    if (suppressNextDismissRef.current) {
      suppressNextDismissRef.current = false;
      return;
    }

    setOpen(false);
  }, []);

  const handleAnchorPress = useCallback(() => {
    suppressNextDismissRef.current = false;
    setOpen((value) => !value);
  }, []);

  const goToRole = useCallback(
    (nextRole: Role) => {
      closeMenu();
      setRole(nextRole);
      router.replace(roleRootPath(nextRole));
    },
    [closeMenu, router, setRole],
  );

  const snapGpsOnce = useCallback(async () => {
    closeMenu();
    setGpsBusy(true);
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.status !== "granted") return;

      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setVehicleLocation({
        coordinate: {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        },
        updatedAt: Date.now(),
        heading: pos.coords.heading ?? undefined,
      });
    } finally {
      setGpsBusy(false);
    }
  }, [closeMenu, setVehicleLocation]);

  const pullOtaUpdate = useCallback(async () => {
    if (!otaSupported || otaBusy) return;

    closeMenu();
    setOtaBusy(true);
    setOtaStatus("checking");

    try {
      const update = await Updates.checkForUpdateAsync();

      if (!update.isAvailable) {
        setOtaStatus("none");
        return;
      }

      setOtaStatus("downloading");
      await Updates.fetchUpdateAsync();
      await Updates.reloadAsync();
    } catch {
      setOtaStatus("error");
    } finally {
      setOtaBusy(false);
    }
  }, [closeMenu, otaBusy, otaSupported]);

  const otaMenuTitle = otaBusy
    ? otaStatus === "downloading"
      ? "Pull OTA update (downloading...)"
      : "Pull OTA update (checking...)"
    : otaStatus === "none"
      ? "Pull OTA update (no update found)"
      : otaStatus === "error"
        ? "Pull OTA update (failed)"
        : !otaSupported
          ? "Pull OTA update (release build only)"
          : "Pull OTA update now";

  const menu = (
    <Menu
      visible={open}
      onDismiss={handleDismiss}
      anchor={
        <IconButton
          icon="account-switch"
          size={18}
          mode="contained"
          containerColor={theme.colors.surfaceVariant}
          accessibilityLabel="Developer role switcher"
          style={{ margin: 0, width: 34, height: 34 }}
          onPress={handleAnchorPress}
        />
      }
    >
      {devEnabled && Platform.OS !== "web" ? (
        <Menu.Item
          title={gpsBusy ? "GPS snap (busy…) " : "GPS snap (one-time)"}
          disabled={gpsBusy}
          onPress={snapGpsOnce}
          leadingIcon="crosshairs-gps"
        />
      ) : null}
      <Menu.Item
        title={otaMenuTitle}
        disabled={!otaSupported || otaBusy}
        onPress={pullOtaUpdate}
        leadingIcon="download-circle-outline"
      />
      <Menu.Item
        title={formatDemoFleetMenuTitle(demoFleetMode)}
        disabled={demoFleetMode.isLocked}
        onPress={() => {
          if (demoFleetMode.isLocked) return;
          closeMenu();
          setDemoFleetOverride(!demoModeEnabled);
        }}
        leadingIcon={
          demoModeEnabled ? "toggle-switch" : "toggle-switch-off-outline"
        }
      />
      {DEV_SWITCHER_ROLES.map((nextRole) => (
        <Menu.Item
          key={nextRole}
          title={`${ROLE_LABEL[nextRole]}${role === nextRole ? " ✓" : ""}`}
          onPress={() => {
            goToRole(nextRole);
          }}
          leadingIcon={
            nextRole === "parent"
              ? "account"
              : nextRole === "driver"
                ? "steering"
                : "shield-account"
          }
        />
      ))}
    </Menu>
  );

  if (variant === "header") {
    return menu;
  }

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: "absolute",
        top: insets.top,
        right: 8,
        height: 44,
        justifyContent: "center",
        zIndex: 1000,
        elevation: 1000,
      }}
    >
      {menu}
    </View>
  );
}
