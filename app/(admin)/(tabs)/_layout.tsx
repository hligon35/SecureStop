import { Tabs } from 'expo-router';
import { useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TabBarIcon } from '@/components/TabBarIcon';

export default function AdminTabsLayout() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const bottomPad = Math.min(insets.bottom, 14);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarSafeAreaInsets: { bottom: 0 },
        tabBarStyle: {
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
          title: 'Fleet',
          tabBarIcon: ({ color }) => <TabBarIcon name="bus" color={color} />,
        }}
      />

      <Tabs.Screen
        name="scans"
        options={{
          title: 'Scans',
          tabBarIcon: ({ color }) => <TabBarIcon name="qrcode-scan" color={color} />,
        }}
      />

      <Tabs.Screen
        name="routes"
        options={{
          title: 'Routes',
          tabBarIcon: ({ color }) => <TabBarIcon name="map-marker-path" color={color} />,
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <TabBarIcon name="cog" color={color} />,
        }}
      />

      {/* Keep screens reachable via push buttons, but remove from bottom nav */}
      <Tabs.Screen name="alerts" options={{ href: null }} />
    </Tabs>
  );
}
