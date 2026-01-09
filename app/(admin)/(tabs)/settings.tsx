import { ScrollView, View } from 'react-native';
import { Switch, Text } from 'react-native-paper';

import { useNotificationStore } from '@/store/notifications';

export default function AdminSettingsScreen() {
  const prefs = useNotificationStore((s) => s.prefs);
  const setPrefs = useNotificationStore((s) => s.setPrefs);

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
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
