import { Tabs } from 'expo-router';

import { TabBarIcon } from '@/components/TabBarIcon';

export default function DriverTabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen
        name="map"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <TabBarIcon name="view-dashboard" color={color} />,
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
        name="delay"
        options={{
          title: 'Delay',
          tabBarIcon: ({ color }) => <TabBarIcon name="timer-outline" color={color} />,
        }}
      />
      <Tabs.Screen
        name="incident"
        options={{
          title: 'Incident',
          tabBarIcon: ({ color }) => <TabBarIcon name="car-emergency" color={color} />,
        }}
      />
      <Tabs.Screen
        name="setup"
        options={{ href: null }}
      />
    </Tabs>
  );
}
