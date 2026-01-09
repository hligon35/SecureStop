import { ScrollView, View } from 'react-native';
import { Card, ProgressBar, Switch, Text, TextInput } from 'react-native-paper';

import { useAuthStore } from '@/store/auth';
import { useNotificationStore } from '@/store/notifications';

export default function DriverSetupScreen() {
  const email = useAuthStore((s) => s.email);
  const homeAddress = useAuthStore((s) => s.homeAddress);
  const passwordMock = useAuthStore((s) => s.passwordMock);
  const setAccount = useAuthStore((s) => s.setAccount);

  const prefs = useNotificationStore((s) => s.prefs);
  const setPrefs = useNotificationStore((s) => s.setPrefs);

  const hasMinLen = passwordMock.length >= 8;
  const hasCapital = /[A-Z]/.test(passwordMock);
  const hasSpecial = /[^A-Za-z0-9]/.test(passwordMock);
  const met = [hasMinLen, hasCapital, hasSpecial].filter(Boolean).length;
  const strength = met / 3;

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Card>
        <Card.Content style={{ gap: 12 }}>
          <Text variant="titleMedium" style={{ textAlign: 'center' }}>
            Account
          </Text>

          <TextInput
            label="Email"
            value={email}
            autoCapitalize="none"
            keyboardType="email-address"
            onChangeText={(v) => setAccount({ email: v })}
          />

          <TextInput
            label="Home address"
            value={homeAddress}
            onChangeText={(v) => setAccount({ homeAddress: v })}
          />

          <TextInput
            label="Password"
            value={passwordMock}
            secureTextEntry
            onChangeText={(v) => setAccount({ passwordMock: v })}
          />

          <View style={{ gap: 6 }}>
            <Text variant="labelSmall">Password strength</Text>
            <ProgressBar progress={strength} />
            <Text variant="labelSmall">{hasCapital ? '✓' : '•'} 1 capital letter</Text>
            <Text variant="labelSmall">{hasSpecial ? '✓' : '•'} 1 special character</Text>
            <Text variant="labelSmall">{hasMinLen ? '✓' : '•'} 8+ characters</Text>
          </View>
        </Card.Content>
      </Card>

      <View style={{ gap: 12 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text>Notifications enabled</Text>
          <Switch value={prefs.enabled} onValueChange={(v) => setPrefs({ enabled: v })} />
        </View>
      </View>
    </ScrollView>
  );
}
