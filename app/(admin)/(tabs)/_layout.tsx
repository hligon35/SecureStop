import { Tabs } from 'expo-router';

import { TabBarIcon } from '@/components/TabBarIcon';

export default function AdminTabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen
        name="fleet"
        options={{
          title: 'Fleet',
          tabBarIcon: ({ color }) => <TabBarIcon name="bus" color={color} />,
        }}
      />
      <Tabs.Screen
        name="alerts"
        options={{
          title: 'Alerts',
          tabBarIcon: ({ color }) => <TabBarIcon name="bell-alert" color={color} />,
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
    </Tabs>
  );
}
