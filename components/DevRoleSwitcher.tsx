import * as Location from "expo-location";
import { usePathname, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Platform, View } from "react-native";
import { IconButton, Menu, useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { DEV_ACCOUNT_EMAIL } from "@/constants/devAccount";
import type { Role } from "@/constants/roles";
import { ROLE_LABEL, ROLES } from "@/constants/roles";
import { roleRootPath } from "@/constants/routes";
import { getConfig } from "@/lib/config";
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
  const demoModeEnabled =
    demoFleetFlag === "true"
      ? true
      : demoFleetFlag === "false"
        ? false
        : typeof demoFleetOverride === "boolean"
          ? demoFleetOverride
          : !devEnabled;

  if (!demoAccessEnabled) return null;

  const variant = props?.variant ?? "floating";

  // Ensure the menu never gets "stuck" across route transitions.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const goToRole = useCallback(
    (nextRole: Role) => {
      setOpen(false);
      setRole(nextRole);
      router.replace(roleRootPath(nextRole));
    },
    [router, setRole],
  );

  const snapGpsOnce = useCallback(async () => {
    setOpen(false);
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
  }, [setVehicleLocation]);

  const menu = (
    <Menu
      visible={open}
      onDismiss={() => setOpen(false)}
      anchor={
        <IconButton
          icon="account-switch"
          size={18}
          mode="contained"
          containerColor={theme.colors.surfaceVariant}
          accessibilityLabel="Developer role switcher"
          style={{ margin: 0, width: 34, height: 34 }}
          onPress={() => setOpen((v) => !v)}
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
        title={`Demo mode: ${demoModeEnabled ? "ON" : "OFF"}${typeof demoFleetOverride === "boolean" ? " ✓" : ""}`}
        onPress={() => {
          setOpen(false);
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
