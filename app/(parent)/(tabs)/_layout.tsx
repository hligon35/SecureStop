import { Tabs } from 'expo-router';

import { TabBarIcon } from '@/components/TabBarIcon';

export default function ParentTabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen
        name="map"
        options={{
          title: 'Map',
          tabBarIcon: ({ color }) => <TabBarIcon name="map" color={color} />,
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
        name="setup"
        options={{
          title: 'Setup',
          tabBarIcon: ({ color }) => <TabBarIcon name="cog" color={color} />,
        }}
      />
    </Tabs>
  );
}
