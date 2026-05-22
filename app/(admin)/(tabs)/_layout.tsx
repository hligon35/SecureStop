import { Tabs, usePathname, useRouter } from "expo-router";
import { useState } from "react";
import { useWindowDimensions, View } from "react-native";
import { useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AdminTabDrawer } from "@/components/AdminTabDrawer";
import { TabBarIcon } from "@/components/TabBarIcon";

const ADMIN_WIDE_BREAKPOINT = 1024;

export default function AdminTabsLayout() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const bottomPad = Math.min(insets.bottom, 14);
  const wideLayout = width >= ADMIN_WIDE_BREAKPOINT;
  const [drawerCollapsed, setDrawerCollapsed] = useState(false);

  return (
    <View
      style={{
        flex: 1,
        flexDirection: "row",
        backgroundColor: theme.colors.background,
      }}
    >
      {wideLayout ? (
        <AdminTabDrawer
          collapsed={drawerCollapsed}
          currentPath={pathname}
          onNavigate={(href) => router.replace(href)}
          onToggleCollapsed={() => setDrawerCollapsed((value) => !value)}
        />
      ) : null}

      <View style={{ flex: 1 }}>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarStyle: wideLayout
              ? { display: "none" }
              : {
                  backgroundColor: theme.colors.surface,
                  height: 56 + bottomPad,
                  paddingBottom: bottomPad,
                  paddingTop: 0,
                },
            tabBarItemStyle: {
              paddingVertical: 0,
            },
            tabBarIconStyle: {
              marginTop: 0,
              marginBottom: 0,
            },
            tabBarLabelStyle: {
              paddingTop: 0,
              marginTop: 0,
            },
          }}
        >
          <Tabs.Screen
            name="fleet"
            options={{
              title: "Fleet",
              tabBarIcon: ({ color }) => (
                <TabBarIcon name="bus" color={color} />
              ),
            }}
          />

          <Tabs.Screen
            name="routes"
            options={{
              title: "Routes",
              tabBarIcon: ({ color }) => (
                <TabBarIcon name="map-marker-path" color={color} />
              ),
            }}
          />

          <Tabs.Screen
            name="scans"
            options={{
              title: "Scans",
              tabBarIcon: ({ color }) => (
                <TabBarIcon name="qrcode-scan" color={color} />
              ),
            }}
          />

          <Tabs.Screen
            name="drivers"
            options={{
              title: "Drivers",
              tabBarIcon: ({ color }) => (
                <TabBarIcon name="card-account-details-outline" color={color} />
              ),
            }}
          />

          <Tabs.Screen name="settings" options={{ href: null }} />

          {/* Keep screens reachable via push buttons, but remove from bottom nav */}
          <Tabs.Screen name="alerts" options={{ href: null }} />
        </Tabs>
      </View>
    </View>
  );
}
