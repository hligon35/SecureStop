import { Link, Slot, usePathname } from 'expo-router';
import { Platform, ScrollView, View } from 'react-native';
import { Card, Divider, List, Text } from 'react-native-paper';

type NavItem = {
  title: string;
  href:
    | '/(admin)/(web)/dashboard'
    | '/(admin)/(web)/live-map'
    | '/(admin)/(web)/routes'
    | '/(admin)/(web)/vehicles'
    | '/(admin)/(web)/drivers'
    | '/(admin)/(web)/students'
    | '/(admin)/(web)/alerts-incidents'
    | '/(admin)/(web)/reports'
    | '/(admin)/(web)/settings';
};

const NAV: NavItem[] = [
  { title: 'Dashboard', href: '/(admin)/(web)/dashboard' },
  { title: 'Live Map', href: '/(admin)/(web)/live-map' },
  { title: 'Routes', href: '/(admin)/(web)/routes' },
  { title: 'Vehicles', href: '/(admin)/(web)/vehicles' },
  { title: 'Drivers', href: '/(admin)/(web)/drivers' },
  { title: 'Students / Riders', href: '/(admin)/(web)/students' },
  { title: 'Alerts & Incidents', href: '/(admin)/(web)/alerts-incidents' },
  { title: 'Reports', href: '/(admin)/(web)/reports' },
  { title: 'Settings', href: '/(admin)/(web)/settings' },
];

export default function AdminWebLayout() {
  const pathname = usePathname();

  // These routes are intended for web; keep mobile rendering simple.
  if (Platform.OS !== 'web') {
    return <Slot />;
  }

  return (
    <View style={{ flex: 1, flexDirection: 'row' }}>
      <View style={{ width: 280, borderRightWidth: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 12 }}>
          <Card>
            <Card.Title title="SecureStop" subtitle="Admin" />
            <Card.Content>
              <Text variant="labelSmall">Mission control (web)</Text>
            </Card.Content>
          </Card>

          <Divider style={{ marginVertical: 12 }} />

          {NAV.map((item) => {
            const selected = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} asChild>
                <List.Item
                  title={item.title}
                  style={{ borderRadius: 8 }}
                  titleStyle={selected ? { fontWeight: '700' } : undefined}
                />
              </Link>
            );
          })}
        </ScrollView>
      </View>

      <View style={{ flex: 1 }}>
        <Slot />
      </View>
    </View>
  );
}
