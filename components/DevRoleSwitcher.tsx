import * as Location from "expo-location";
import { usePathname, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Platform, View } from "react-native";
import { IconButton, Menu, useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
  const setRole = useAuthStore((s) => s.setRole);

  const setVehicleLocation = useLocationStore((s) => s.setVehicleLocation);
  const demoFleetOverride = useLocationStore((s) => s.demoFleetOverride);
  const setDemoFleetOverride = useLocationStore((s) => s.setDemoFleetOverride);

  const [open, setOpen] = useState(false);
  const [gpsBusy, setGpsBusy] = useState(false);

  const devEnabled = typeof __DEV__ !== "undefined" ? __DEV__ : false;
  const demoAccessEnabled = devEnabled || cfg.features.enableDemoLogin;

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

      // Defer navigation until after state + menu close apply.
      requestAnimationFrame(() => {
        router.replace(roleRootPath(nextRole));
      });
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
        title={`Demo mode: ON${demoFleetOverride === true ? " ✓" : ""}`}
        onPress={() => {
          setOpen(false);
          setDemoFleetOverride(true);
        }}
        leadingIcon="play-circle"
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
