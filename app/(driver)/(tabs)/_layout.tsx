import { Tabs } from 'expo-router';

import { TabBarIcon } from '@/components/TabBarIcon';

export default function DriverTabsLayout() {
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
        options={{
          title: 'Setup',
          tabBarIcon: ({ color }) => <TabBarIcon name="cog" color={color} />,
        }}
      />
    </Tabs>
  );
}
