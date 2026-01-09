import { ScrollView, View } from 'react-native';
import { Avatar, Card, Divider, Switch, Text, useTheme } from 'react-native-paper';

import { useAuthStore } from '@/store/auth';
import { useNotificationStore } from '@/store/notifications';

export default function AdminSettingsScreen() {
  const theme = useTheme();
  const email = useAuthStore((s) => s.email);
  const homeAddress = useAuthStore((s) => s.homeAddress);
  const userId = useAuthStore((s) => s.userId);

  const prefs = useNotificationStore((s) => s.prefs);
  const setPrefs = useNotificationStore((s) => s.setPrefs);

  const name = userId === 'mock-user' ? 'Admin User' : userId;
  const phone = '(555) 010-2040';

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Card mode="outlined">
        <Card.Title title="Account" />
        <Card.Content>
          <View style={{ gap: 10 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                Name
              </Text>
              <Text>{name}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                Email
              </Text>
              <Text>{email}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                Home address
              </Text>
              <Text>{homeAddress}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                Phone
              </Text>
              <Text>{phone}</Text>
            </View>

            <View style={{ marginTop: 8 }}>
              <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                Children
              </Text>
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
                <Avatar.Text size={36} label="A" />
                <Avatar.Text size={36} label="B" />
                <Avatar.Text size={36} label="C" />
              </View>
            </View>

            <Divider style={{ marginTop: 12 }} />
          </View>
        </Card.Content>
      </Card>

      <View style={{ gap: 12 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text>Notifications enabled</Text>
          <Switch value={prefs.enabled} onValueChange={(v) => setPrefs({ enabled: v })} />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text>Receive driver alerts</Text>
          <Switch value={prefs.receiveDriverAlerts} onValueChange={(v) => setPrefs({ receiveDriverAlerts: v })} />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text>Receive admin broadcasts</Text>
          <Switch value={prefs.receiveAdminBroadcasts} onValueChange={(v) => setPrefs({ receiveAdminBroadcasts: v })} />
        </View>
      </View>
    </ScrollView>
  );
}
